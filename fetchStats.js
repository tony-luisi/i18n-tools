var config = require('./config')
  var resources = config.resources
  var projectSlug = config.projectSlug

var getFromTransifex = require('./getFromTransifex')

module.exports = function fetchStats(locales, callback) {
  var doneCount = 0
  var finalCount = resources.length 
  var stats = buildEmptyLanguageStats(locales)

  resources.forEach( function(resource) {
    getFromTransifex("/api/2/project/"+projectSlug+"/resource/"+resource.transifexSlug+"/stats")( function(err, res, body) {
      if (err) { throw err; }

      if (body === "Not Found" ) {
        console.log("api/2/project/"+projectSlug+"/resource/"+resource.transifexSlug+"/stats  --  responding 'Not Found'")
        return
      } 

      var jsonResponse = JSON.parse(body)

      locales.forEach( function(locale) { 
        if (jsonResponse[locale] == null) { 
          console.log('transifex reporting locale presenet but no stats:', locale) 
          return 
        }

        stats[locale.replace('_','-')][resource.commonName] = Number( jsonResponse[locale]['completed'].replace('%','') )
      })

      //process.stdout.write(style.green('>'))
      doneCount++
      if (doneCount === finalCount) { callback(null, stats) }

    })
  })
}

function buildEmptyLanguageStats(locales) {
  var stats = {}

  locales.forEach( function(locale) {
    stats[locale.replace('_','-')] = {} 
  })
  return stats
}

