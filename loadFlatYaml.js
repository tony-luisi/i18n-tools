var flatten = require('flat')
var fs = require('fs')
var yaml    = require('js-yaml')

var config  = require('./config');
  var localesDir  = config.localesDir;

module.exports = function loadFlatYaml( name ) {
  var file = fs.readFileSync( localesDir + name )

  return flatten(yaml.safeLoad(file))
}
