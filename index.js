var http    = require('http')
var request = require('request')
var fs      = require('fs')
var flatten = require('flat')
var yaml    = require('js-yaml')

// my mini modules
var style            = require('./fontStyle')
var check            = require('./checkers')
var getFromTransifex = require('./getFromTransifex')
var fetchStats       = require('./fetchStats')
var writeStats       = require('./writeStats')
var print            = require('./stdPrint')

var config  = require('./config');
  var projectSlug = config.projectSlug;
  var loomioDir   = config.loomioDir;
  var localesDir  = config.localesDir;
  var resources   = config.resources;

////////////////////////////////////////////////////

console.log(style.green("\nfetching locales list"))
//
// get the list of locales Transifex has 
getFromTransifex('/api/2/project/loomio-1/languages')( function(err, res, body) {
  if (err) { throw err; }
  
  var transifexLocales = JSON.parse(body).map( function(a) { return a['language_code'] })
  //transifexLocales = ['he']

  print('  '); print( transifexLocales )  
  console.log(style.green("\n\nfetching stats + updating locales\n"))
  fetchStats(transifexLocales, writeStats)

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




