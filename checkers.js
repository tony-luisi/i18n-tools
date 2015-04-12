var niceLog = require('./niceLog');

module.exports = {
  'interpolation': function checkInterpolation(args) {
    var locale= args.locale, resource= args.resource, key= args.key, value= args.value, localeKey= args.localeKey, localeValue= args.localeValue;
    
    var regex = /%{[^{}]*}/gm
    var skipKeys = ["en.invitation.invitees_placeholder",]

    var match = value.match(regex)
    var localeMatch = localeValue.match(regex)

    if (match === null) {return}
    if (localeMatch === null) {
      niceLog( {locale: locale, key: key, value: value, localeKey: localeKey, localeValue: localeValue, resource: resource, regex: regex} )
      return
    }
    //

    //note interpolation keys are not order dependent, so we normalise by .sort()'ing
    if ( (match.sort().join(':') !== localeMatch.sort().join(':'))
      && (skipKeys.indexOf(key) === -1) ){
        niceLog( {locale: locale, key: key, value: value, localeKey: localeKey, localeValue: localeValue, resource: resource, regex: regex} )
    }
  },

  'html': function checkHTML(args) {
    var locale= args.locale, resource= args.resource, key= args.key, value= args.value, localeKey= args.localeKey, localeValue= args.localeValue;
    
    var regex = /\<[^\<\>]*\>/gm
    var skipKeys = ["en.invitation.invitees_placeholder",]

    var match = value.match(regex)
    var localeMatch = localeValue.match(regex)

    if (match === null) {return}

    //note we don't sort keys because html is order dep. this could be trickier with some languages
    if ( localeMatch === null ||                        // if there are not keys in the translation
        ( match.join(':') !== localeMatch.join(':')     // if the keys in en and in the translation are different
            && skipKeys.indexOf(key) === -1 )           // and the key is not in the list of keys to skip D: 
       ){
       
        niceLog( {locale: locale, key: key, value: value, localeKey: localeKey, localeValue: localeValue, resource: resource, regex: regex} )
    }
  },
}
