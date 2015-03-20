var style            = require('./fontStyle')
var print            = require('./stdPrint')
var sortObj          = require('sort-object')

var config           = require('./config')
  var resources      = config.resources

module.exports = function printStatsDiff( oldStats, stats, liveLocales ) {
  var locales = Object.keys(sortObj(stats))
  var resources = resourcesMap('commonName')
  var colZero = 12
  var colN = 60
  var liveThreshold = 80
  
  print(style.blue(style.pad('  locale',colZero)));
  resources.forEach( function(resource) { print(style.blue(style.pad(resource,colN))) } )
  print("\n")
    
  locales.forEach( function(locale) {
    locale = locale.replace('_','-')
    print(style.pad('  '+locale,colZero))

    var upgrade = 0;
    resources.forEach( function(resource) { 
      var percent = stats[locale][resource]
      var oldPercent = oldStats[locale][resource]

      // this is a hideous equivalent it !includes?(locale)
      if (resource == 'main' && percent > liveThreshold && liveLocales.indexOf(locale)==-1 ) { upgrade++ }

      // in the future would be good to also compare 'last updated_at'
      if (percent > oldPercent) {
        var msg = style.green(style.pad( progressBar(oldPercent, percent) ,colN)) 
      } else {
        var msg = style.pad( progressBar(oldPercent, percent) ,colN)
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

  if (percentDiff < 0) {
    var newChunk = []
  } else {
    var newChunk = Array(Math.round(percentDiff/2)+1).join(newSymbol)
  }
  var emptyChunk = Array( 50 - (oldChunk + newChunk).length +1).join(' ') 

  return ends[0] + oldChunk + newChunk + emptyChunk + ends[1]
}

function resourcesMap(key) { 
  return resources.map( function(object) { 
    return object[key] 
  })
}
