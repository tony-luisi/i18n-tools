var loadFlatYaml = require('./loadFlatYaml')
var forEachKey = require('./forEachKey')

var newYaml = loadFlatYaml('client.en.yml' )
var oldYaml = loadFlatYaml('en.yml' )

var mapping = {}


forEachKey( newYaml, function(newKey, newVal) {
  forEachKey( oldYaml, function(oldKey, oldVal) {
    newVal = newVal.replace(/(\.|\:)$/, '')
    oldVal = oldVal.replace(/(\.|\:)$/, '')
    
    // newVal = newVal.replace(/\%\{.*\}/, '')
    // oldVal = oldVal.replace(/\{.*\}/, '')

    if (newVal == oldVal) {
      //console.log(oldKey + ' >> ' + key)
      mapping[oldKey.replace(/^en\./, '')] = newKey.replace(/^en\./, '')
    }

  })
})


module.exports = mapping

//////

//console.log(mapping)
//console.log('\n')

//var conserved = Object.keys(mapping).length
//var total = Object.keys(newYaml).length

//console.log( conserved.toString()+'/'+total.toString() + ' = '+  Math.round(conserved/ total * 100 ).toString() + '% conserved' )



//////



