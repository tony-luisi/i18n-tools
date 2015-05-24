var indent = require('indent-string');
var style = require('./fontStyle');
var projectSlug = 'loomio-1'

module.exports = function niceLog(args) {
  var locale= args.locale, key= args.key, value= args.value, localeKey= args.localeKey, localeValue= args.localeValue, resource= args.resource, regex= args.regex;
  var correctedLocale = locale.replace('_','-')

  console.log('\n'+ indent(style.red(localeKey) + " : " + style.blue("https://www.transifex.com/projects/p/" +projectSlug+ "/translate/#" +locale+ "/" +resource.transifexSlug+ "?key=" +key.substr(3)),  ' ', 2) )
  process.stdout.write( indent(style.bold("["+correctedLocale+"]"), ' ', 4) )
  console.log( indent(localeValue, ' ', 2).replace(regex,style.green) )
  process.stdout.write( indent("[en]", ' ', 4) )
  console.log( indent(value, ' ', 2).replace(regex,style.green) )
  console.log('')
}

