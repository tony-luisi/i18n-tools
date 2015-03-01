var flatten = require('flat')
var fs = require('fs')
var yaml    = require('js-yaml')

var mapping = require('./findKeyMapping.js')
var loadFlatYaml = require('./loadFlatYaml')
var forEachKey = require('./forEachKey')
var print = require('./stdPrint')
var config  = require('./config');
  var localesDir  = config.localesDir;

//temp
module.exports = populateNewClientLocale

function populateNewClientLocale (locale) {
  locale = locale.replace('_','-')

  var source = loadFlatYaml(locale + '.yml')
  var output = {}

  // forEachKey expects a function which will take (key, value) as args
  forEachKey( mapping, mapToOutput )

  // in the case of our mapping, keys = sourceKeys, values = outputKeys
  function mapToOutput(sourceKey, outputKey) {
    var fullOutputKey = locale + '.' + outputKey
    var outputValue = source[locale + '.' + sourceKey]

    if (outputValue) {
      output[fullOutputKey] = outputValue 
    }
  }

  output = flatten.unflatten(output)

  var filename = localesDir + 'client.' + locale + '.yml'
  writeToYaml(output, filename)
}

function writeToYaml(output, filename) {
  fs.writeFile(filename, yaml.safeDump(output), function(err) {
    if (err) { throw err; }

    print('.')
  })
// fs.writeFileSync(filename, yaml.safeDump(output))
}
