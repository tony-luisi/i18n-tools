var fs      = require('fs')
var yaml    = require('js-yaml')
var sortObj = require('sort-object')

var printStatsDiff = require('./printStatsDiff')
var config         = require('./config')
  var loomioDir    = config.loomioDir


module.exports = function writeStats(err, stats) {
  if (err) { throw err }

  var coverageFilename = loomioDir +'/'+ '.translation_coverage.yml'
  var updatedAtFilename   = loomioDir +'/'+ '.translation_updated_at.yml'
  var updatedAtStats = { updated_at: (new Date).getTime() }

  fs.writeFile(updatedAtFilename, yaml.safeDump( updatedAtStats ), function(err) { 
    if (err) { throw err } 
  })

  fs.readFile(coverageFilename, function(err, data) {
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

    fs.writeFile(coverageFilename, yaml.safeDump(sortedStats), function(err) { 
      if (err) { throw err } 
    })
  })
}
