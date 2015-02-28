var flatten = require('flat')
var fs = require('fs')
var yaml    = require('js-yaml')

var config  = require('./config');
  var localesDir  = config.localesDir;

function loadFromFileAndPrep( name ) {
  var file = fs.readFileSync( localesDir + name )

  return flatten(yaml.safeLoad(file))
}

var newYaml = loadFromFileAndPrep('client.en.yml' )
var oldYaml = loadFromFileAndPrep('en.yml' )

var mapping = {}

function forEachKey( object, doThis ) {
  Object.keys(object).forEach( function(key) {
    doThis(key, object[key])
  })
}

forEachKey( newYaml, function(newKey, newVal) {
  forEachKey( oldYaml, function(oldKey, oldVal) {
    newVal = newVal.replace(/(\.|\:)$/, '')
    oldVal = oldVal.replace(/(\.|\:)$/, '')
    
    // newVal = newVal.replace(/\%\{.*\}/, '')
    // oldVal = oldVal.replace(/\{.*\}/, '')

    if (newVal == oldVal) {
      //console.log(oldKey + ' >> ' + key)
      mapping[oldKey] = newKey
    }


  })
})

console.log(mapping)
console.log('\n')

var conserved = Object.keys(mapping).length
var total = Object.keys(newYaml).length

console.log( conserved.toString()+'/'+total.toString() + ' = '+  Math.round(conserved/ total * 100 ).toString() + '% conserved' )
