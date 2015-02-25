var fs      = require('fs')
var yaml    = require('js-yaml')
var sortObj = require('sort-object')

var printStatsDiff = require('./printStatsDiff')
var config         = require('./config')
  var loomioDir    = config.loomioDir


module.exports = function writeStats(err, stats) {
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
