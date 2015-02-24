var http    = require('http');
var request = require('request');
var fs      = require('fs');
var flatten = require('flat');
var yaml    = require('js-yaml');
var sortObj = require('sort-object');

// my mini modules
var style            = require('./fontStyle');
var check            = require('./checkers');
var getFromTransifex = require('./getFromTransifex');

var config  = require('./config');
  var projectSlug = config.projectSlug;
  var loomioDir   = config.loomioDir;
  var localesDir  = config.localesDir;
  var resources   = config.resources;

function resourcesMap(key) { 
  return resources.map( function(object) { 
    return object[key] 
  })
}


console.log(style.green("\nfetching locales list"))
//
// get the list of locales Transifex has 
getFromTransifex('/api/2/project/loomio-1/languages')( function(err, res, body) {
  if (err) { throw err; }
  
  var transifexLocales = JSON.parse(body).map( function(a) { return a['language_code'] })
  //transifexLocales = ['he']

  print('  '); print( transifexLocales )  
  console.log(style.green("\n\nfetching stats + updating locales\n"))
  updateStats(transifexLocales, writeStats)

  updateLocales(transifexLocales)
})

function updateLocales(locales) {

  resources.forEach( function(resource) {
    locales.forEach( function(locale) {
      getFromTransifex("/api/2/project/"+projectSlug+"/resource/"+resource.transifexSlug+"/translation/"+locale)(updateLocale(resource, locale))
    })
  })
}

function updateLocale(resource, locale) {
  return function(err, res, body) {
    if (err) { throw err; }
    
    var correctedLocale = locale.replace('_','-')
    var filename = localesDir + resource.localFilePrefix + correctedLocale + '.yml'
    var refFile = localesDir + resource.localFilePrefix + 'en.yml'

    // get and correct the transifex translation
    var tempTransifexTranslations = yaml.safeLoad(JSON.parse(body).content)
    var transifexTranslations = {}
    transifexTranslations[correctedLocale] = tempTransifexTranslations[locale]
    
    // load loomio translation and compare
    fs.readFile(refFile, function(err, data) {
      if (err) { throw err; }

      var flatRefTranslations = flatten(yaml.safeLoad(data))
      var flatTransifexTranslations = flatten(transifexTranslations)
     
      Object.keys(flatRefTranslations).forEach( function(key) {
        var localeKey = key.replace('en.', correctedLocale+'.')

        var value = flatRefTranslations[key]
        var localeValue = flatTransifexTranslations[localeKey]

        if (typeof(localeValue) === 'undefined') {return}

        var args = { locale: locale, resource: resource, key: key, value: value, localeKey: localeKey, localeValue: localeValue }
        check.interpolation(args)
        check.html(args)
      })
    })

    fs.writeFile(filename, yaml.safeDump(transifexTranslations), function(err) {
      if (err) { throw err; }

      //process.stdout.write(style.green(locale)+' ')
      process.stdout.write(style.green('.'))
    })

  }
}


//# --- stats updater --- #
function updateStats(locales, callback) {
  var doneCount = 0
  var finalCount = resources.length 
  var stats = buildEmptyLanguageStats(locales)

  resources.forEach( function(resource) {
    getFromTransifex("/api/2/project/"+projectSlug+"/resource/"+resource.transifexSlug+"/stats")( function(err, res, body) {
      if (err) { throw err; }

      var jsonResponse = JSON.parse(body)

      locales.forEach( function(locale) { 
        stats[locale.replace('_','-')][resource.commonName] = Number( jsonResponse[locale]['completed'].replace('%','') )
      })

      //process.stdout.write(style.green('>'))
      doneCount++
      if (doneCount === finalCount) { callback(null, stats) }

    })
  })
}

function writeStats(err, stats) {
  if (err) { throw err }

  var filename = loomioDir +'/'+ '.translation_coverage.yml'

  fs.readFile(filename, function(err, data) {
    if (err) { 
      console.error(err)
      return 
    }

    var oldStats = yaml.safeLoad(data)

    var loomioI18nYaml = loomioDir +'/config/loomio_i18n.yml'
    fs.readFile(loomioI18nYaml, function(err, data) {
      if (err) { console.error(err)
        return 
      }
      var liveLocales = yaml.safeLoad(data).loomio_i18n.selectable_locales

      printStatsDiff( oldStats, stats, liveLocales )
    })
  
    var sortedStats = sortObj(stats)
    Object.keys(sortedStats).forEach( function(locale) {
      sortedStats[locale] = sortObj(sortedStats[locale])
    })

    fs.writeFile(filename, yaml.safeDump(sortedStats), function(err) { 
      if (err) { throw err } 
    })
  })
}

function printStatsDiff( oldStats, stats, liveLocales ) {
  var locales = Object.keys(stats)
  var resources = resourcesMap('commonName')
  var colZero = 12
  var colN = 60
  var liveThreshold = 80
  
  print(style.blue(pad('  locale',colZero)));
  resources.forEach( function(resource) { print(style.blue(pad(resource,colN))) } )
  print("\n")
    
  locales.forEach( function(locale) {
    locale = locale.replace('_','-')
    print(pad('  '+locale,colZero))

    var upgrade = 0;
    resources.forEach( function(resource) { 
      var percent = stats[locale][resource]
      var oldPercent = oldStats[locale][resource]

      // this is a hideous equivalent it !includes?(locale)
      if (resource == 'main' && percent > liveThreshold && liveLocales.indexOf(locale)==-1 ) { upgrade++ }

      // in the future would be good to also compare 'last updated_at'
      if (percent > oldPercent) {
        var msg = style.green(pad( progressBar(oldPercent, percent) ,colN)) 
      } else {
        var msg = pad( progressBar(oldPercent, percent) ,colN)
      }
      print(msg)
    })
    
    if (upgrade > 0) { print( style.green('UPGRADE')) } 
    print("\n")
  })

}

function progressBar(oldPercent, percent) {
  var symbol = '▍'
  var newSymbol = '+'
  var ends = ['(', ')']

  var percentDiff = percent - oldPercent

  if (percentDiff % 2 === 0) {
    var oldChunk = Array(Math.round(oldPercent/2)+1).join(symbol)
  } else {
    var oldChunk = Array(Math.round(oldPercent/2-0.5)+1).join(symbol)
  }

  var newChunk = Array(Math.round(percentDiff/2)+1).join(newSymbol)
  var emptyChunk = Array( 50 - (oldChunk + newChunk).length +1).join(' ') 

  return ends[0] + oldChunk + newChunk + emptyChunk + ends[1]
}

function print(string) {
  string = string.toString()
  process.stdout.write(string)
}

function pad(string, finalWidth) {
  string = string.toString()
  if (string.length > finalWidth) {
    return string
  }
  return string + Array(finalWidth-string.length+1).join(' ')
} 

function buildEmptyLanguageStats(locales) {
  var stats = {}

  locales.forEach( function(locale) {
    stats[locale.replace('_','-')] = {} 
  })
  return stats
}
