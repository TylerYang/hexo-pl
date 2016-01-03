'use strict';

var connectRoute = require('connect-route');
var _ = require('underscore');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var util = require('util');

var jsonMW = require('../middleware/json');
var post = require('./post');

module.exports = function(app, hexo) {
    var baseUrl = hexo.config.root + 'pl/v1/api/';

    //add req.json method support
    app.use(jsonMW);

    //parse body to object
    app.use(bodyParser.urlencoded({
        extended: false
    }))
    app.use(bodyParser.json({
        limit: '50mb'
    }));

    app.use(expressValidator());

    //add validator to specify router
    app.use(connectRoute(initRoute));

    function initRoute(router) {
        setBaseUrl(router);

        //post relative apis
        router.get('posts', post.getPostList);
        router.get('post/:id', post.getPost);
        router.put('post/:id', post.updatePost);
        router.delete('post/:id', post.deletePost);
        router.post('post', post.createPost);
    }

    //rewrite function
    function setBaseUrl(router) {
        var methods = ['get', 'post', 'delete', 'put'];

        _.each(methods, function(name) {
            var tmpMethod = router[name];
            router[name] = function(path, cb) {
                var rules = null;
                if (_.isFunction(cb) === false) {
                    rules = cb.rules;
                    cb = cb.func;
                }

                return tmpMethod.call(router, baseUrl + path, function(req, res) {
                    var errors = null;
                    if (rules != null && (errors = validate(req, rules))) {
                        return res.send(400, 'There have been validation errors: ' + util.inspect(errors));
                    }
                    cb(req, res, hexo);
                });
            }
        });
    }

    function validate(req, rules) {
        //key: [body], [params], [query] => checkBody, checkParams, checkQuery
        _.each(rules, function(rule, key) {
            var methodName = 'check' + key.slice(0, 1).toUpperCase() + key.slice(1);
            if (req[methodName]) {
                _.each(rule, function(r) {
                    var validate = req[methodName](r.name, r.message);
                    for (var assertKey in r.assertions) {
                        validate = validate[assertKey]();
                    }
                });
            }
        });

        return req.validationErrors();
    }
};
