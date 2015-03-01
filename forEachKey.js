module.exports = function forEachKey( object, doThis ) {
  Object.keys(object).forEach( function(key) {
    doThis(key, object[key])
  })
}

