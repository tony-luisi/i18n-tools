

var getFromTransifex = require('./getFromTransifex')
var populateNewClientLocale = require('./populateNewClientLocale')

getFromTransifex('/api/2/project/loomio-1/languages')( function(err, res, body) {
  if (err) { throw err; }
  
  var transifexLocales = JSON.parse(body).map( function(a) { return a['language_code'] })

  console.log(transifexLocales)

  transifexLocales.forEach(populateNewClientLocale)
})
