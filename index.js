
// my mini modules
var style            = require('./fontStyle')
var check            = require('./checkers')
var getFromTransifex = require('./getFromTransifex')
var fetchStats       = require('./fetchStats')
var writeStats       = require('./writeStats')
var print            = require('./stdPrint')
var updateLocale     = require('./updateLocale')

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




