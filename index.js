var http = require('http');
var Url = require('url');
var request = require('request');
var fs = require('fs');
var flatten = require('flat');
var yaml = require('js-yaml');
var indent = require('indent-string');
var sortObj = require('sort-object');
var style = require('fontStyle');
var check = require('checkers');

var projectSlug = 'loomio-1'
var loomioDir = process.argv[2] || '/home/mix/projects/loomio'
var localesDir = loomioDir + '/' + 'config/locales/'

var resources = [
  {
   transifexSlug: 'github-linked-version',
   localFilePrefix: '',
   commonName: 'main',
  },
  {
   transifexSlug: 'frontpageenyml',
   localFilePrefix: 'frontpage.',
   commonName: 'frontpage',
  },
]

function resourcesMap(key) { 
  return resources.map( function(object) { 
    return object[key] 
  })
}

function getFromTransifex(path) {

  var login = {
    username: process.env.TRANSIFEX_USERNAME,
    password: process.env.TRANSIFEX_PASSWORD,
  }

  return function(callback) {
    request({
      method: "get",
      url: Url.format({
        protocol: "http",
        hostname: "www.transifex.com",
        pathname: path,
      }),
      auth: login,
    }, callback);
  };
};


console.log(style.green("\nfetching locales list"))
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

function niceLog(args) {
  var locale= args.locale, key= args.key, value= args.value, localeKey= args.localeKey, localeValue= args.localeValue, resource= args.resource, regex= args.regex;
  var correctedLocale = locale.replace('_','-')

  console.log( indent(style.red(localeKey) + " : " + style.blue("https://www.transifex.com/projects/p/" +projectSlug+ "/translate/#" +locale+ "/" +resource.transifexSlug+ "/?key=" +key.substr(3)),  ' ', 2) )
  process.stdout.write( indent(style.bold("["+correctedLocale+"]"), ' ', 4) )
  console.log( indent(localeValue, ' ', 2).replace(regex,style.green) )
  process.stdout.write( indent("[en]", ' ', 4) )
  console.log( indent(value, ' ', 2).replace(regex,style.green) )
  console.log('')
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
        stats[locale][resource.commonName] = Number( jsonResponse[locale]['completed'].replace('%','') )
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
    printStatsDiff( oldStats, stats)
   
    var sortedStats = sortObj(stats)
    fs.writeFile(filename, yaml.safeDump(sortedStats), function(err) { 
      if (err) { throw err } 
    })
  })
}

function printStatsDiff( oldStats, stats ) {
  var locales = Object.keys(stats)
  var resources = resourcesMap('commonName')
  var colZero = 12
  var colN = 70

  print(style.blue(pad('  locale',colZero)));
  resources.forEach( function(resource) { print(style.blue(pad(resource,colN))) } )
  print("\n")
    
  locales.forEach( function(locale) {
    print(pad('  '+locale,colZero))
    resources.forEach( function(resource) { 
      var percent = stats[locale][resource]
      var oldPercent = oldStats[locale][resource]

      // in the future would be good to also compare 'last updated_at'
      if (percent > oldPercent) {
        print(style.green(pad( progressBar(oldPercent, percent) ,colN))) 
      } else {
        print(pad( progressBar(oldPercent, percent) ,colN))
      }
    }) 
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
    stats[locale] = {} 
  })
  return stats
}
