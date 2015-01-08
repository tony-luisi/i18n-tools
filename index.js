var http = require('http');
var Url = require('url');
var request = require('request');
var fs = require('fs');
var flatten = require('flat');
var yaml = require('js-yaml');
var indent = require('indent-string');

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


console.log(green("\nfetching locales list"))
// get the list of locales Transifex has 
getFromTransifex('/api/2/project/loomio-1/languages')( function(err, res, body) {
  if (err) { throw err; }
  
  var transifexLocales = JSON.parse(body).map( function(a) { return a['language_code'] })
  //transifexLocales = ['he']

  print('  '); print( transifexLocales )  
  console.log(green("\n\nfetching stats + updating locales\n"))
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
        checkInterpolation(args)
        checkHTML(args)
      })
    })

    fs.writeFile(filename, yaml.safeDump(transifexTranslations), function(err) {
      if (err) { throw err; }

      //process.stdout.write(green(locale)+' ')
      process.stdout.write(green('.'))
    })

  }
}

function checkInterpolation(args) {
  var locale= args.locale, resource= args.resource, key= args.key, value= args.value, localeKey= args.localeKey, localeValue= args.localeValue;
  
  var regex = /%{[^{}]*}/gm
  var skipKeys = ["en.invitation.invitees_placeholder",]

  var match = value.match(regex)
  var localeMatch = localeValue.match(regex)

  if (match === null) {return}
  if (localeMatch === null) {throw localeKey}

  //note we interpolation keys are not order dependent, so we normalise by .sort()'ing
  if ( (match.sort().join(':') !== localeMatch.sort().join(':'))
    && (skipKeys.indexOf(key) === -1) ){
      niceLog( {locale: locale, key: key, value: value, localeKey: localeKey, localeValue: localeValue, resource: resource, regex: regex} )
  }
}

function checkHTML(args) {
  var locale= args.locale, resource= args.resource, key= args.key, value= args.value, localeKey= args.localeKey, localeValue= args.localeValue;
  
  var regex = /\<[^\<\>]*\>/gm
  var skipKeys = ["en.invitation.invitees_placeholder",]

  var match = value.match(regex)
  var localeMatch = localeValue.match(regex)

  if (match === null) {return}
  if (localeMatch === null) {throw localeKey}

  //note we don't sort keys because html is order dep. this could be trickier with some languages
  if ( (match.join(':') !== localeMatch.join(':'))
    && (skipKeys.indexOf(key) === -1) ){
      niceLog( {locale: locale, key: key, value: value, localeKey: localeKey, localeValue: localeValue, resource: resource, regex: regex} )
  }
}

function niceLog(args) {
  var locale= args.locale, key= args.key, value= args.value, localeKey= args.localeKey, localeValue= args.localeValue, resource= args.resource, regex= args.regex;
  var correctedLocale = locale.replace('_','-')

  console.log( indent(red(localeKey) + " : " + blue("https://www.transifex.com/projects/p/" +projectSlug+ "/translate/#" +locale+ "/" +resource.transifexSlug+ "/?key=" +key.substr(3)),  ' ', 2) )
  process.stdout.write( indent(bold("["+correctedLocale+"]"), ' ', 4) )
  console.log( indent(localeValue, ' ', 2).replace(regex,green) )
  process.stdout.write( indent("[en]", ' ', 4) )
  console.log( indent(value, ' ', 2).replace(regex,green) )
  console.log('')
}

function green(string) { return ("\033[32m"+ string +"\033[0m") }
function red(string) { return ("\033[31m"+ string +"\033[0m") }
function blue(string) { return ("\033[36m"+ string +"\033[0m") }
function bold(string) { return ("\033[101m"+ string +"\033[0m") }


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

      //process.stdout.write(green('>'))
      doneCount++
      if (doneCount === finalCount) { callback(null, stats) }

    })
  })
}

function writeStats(err, stats) {
  if (err) { throw err }

  var filename = loomioDir + '/lib/tasks/translation_stats.yaml'

  fs.readFile(filename, function(err, data) {
    if (err) { throw err; }

    var oldStats = yaml.safeLoad(data)
    printStatsDiff( oldStats, stats)
  })

  fs.writeFile(filename, yaml.safeDump(stats), function(err) { 
    if (err) { throw err } 
  })

}

function printStatsDiff( oldStats, stats ) {
  var locales = Object.keys(stats)
  var resources = resourcesMap('commonName')
  var colZero = 12
  var colN = 20

  print(blue(pad('  locale',colZero)));
  resources.forEach( function(resource) { print(blue(pad(resource,colN))) } )
  print("\n")
    
  locales.forEach( function(locale) {
    print(pad('  '+locale,colZero))
    resources.forEach( function(resource) { 
      var percent = stats[locale][resource]
      var oldPercent = oldStats[locale][resource]

      // in the future would be good to also compare 'last updated_at'
      if (percent > oldPercent) {
        print(green(pad(percent,colN))) 
      } else {
        print(pad(percent,colN)) 
      }
    }) 
    print("\n")
  })

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
  return string + Array(finalWidth+1-string.length).join(' ')
} 

function buildEmptyLanguageStats(locales) {
  var stats = {}

  locales.forEach( function(locale) {
    stats[locale] = {} 
  })
  return stats
}
