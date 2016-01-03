'use strict';
var postService = require('../service/postService');

exports.createPost = {
    rules: {
        body: [{
            name: 'title',
            message: 'body.title should not be empty.',
            assertions: {
                notEmpty: true
            }
        }, {
            name: '_content',
            message: 'body._content should not be empty.',
            assertions: {
                notEmpty: true
            }
        }]
    },
    func: function(req, res, hexo) {
        return postService.create(req.body, hexo).then(function(postData) {
            return res.json({
                succeed: true,
                data: postService.getList(hexo)
            });
        }, handleError);
    }
};
exports.getPostList = function(req, res, hexo) {
    return res.json({
        succeed: true,
        data: postService.getList(hexo)
    });
};

exports.getPost = function(req, res, hexo) {
    var post = hexo.model('Post').get(req.params.id);
    if (!post) {
        return res.json(404, {
            succeed: false,
            message: 'Cannot find post with id: ' + req.params.id
        });
    }
    res.json({
        succeed: true,
        data: post.toObject()
    });
};

exports.deletePost = function(req, res, hexo) {
    return postService.remove(req.params.id, hexo).then(function() {
        return res.json({
            succeed: true
        });
    }, handleError.bind(null, req, res));
};

exports.updatePost = function(req, res, hexo) {
    if (req.body.hasOwnProperty('published') === true) {
        var funcName = req.body.published === 'true' ? 'publish' : 'unpublish';
        return postService[funcName](req.params.id, hexo).then(function(postData) {
            return res.json({
                succeed: true,
                data: postData
            });
        }, handleError.bind(null, req, res));
    }
    return postService.update(req.params.id, req.body, hexo).then(function(postData) {
        return res.json({
            succeed: true,
            data: postData
        });
    }, handleError.bind(null, req, res));
};

function handleError(req, res, errorObj) {
    var json = res.json.bind(null, errorObj.statusCode);
    if (errorObj.statusCode === 404) {
        return json({
            succeed: false,
            message: 'Cannot find post with id: ' + req.params.id
        });
    }
    return json({
        succeed: false,
        message: errorObj.message
    });
}
