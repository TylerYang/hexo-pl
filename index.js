'use strict';
var hexo = hexo || {};
var initApis = require('./lib/api');

hexo.extend.filter.register('server_middleware', function(app) {
    initApis(app, hexo);
});
