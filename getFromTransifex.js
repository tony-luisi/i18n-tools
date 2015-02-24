var request = require('request');
var Url     = require('url');
var config  = require('./config');

module.exports = function getFromTransifex(path) {
  return function(callback) {
    request({
      method: "get",
      url: Url.format({
        protocol: "http",
        hostname: "www.transifex.com",
        pathname: path,
      }),
      auth: config.transifexLogin,
    }, callback);
  };
};

