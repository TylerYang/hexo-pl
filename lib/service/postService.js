'use strict';

var Q = require('q');
var hfm = require('hexo-front-matter');
var moment = require('moment');
var _ = require('underscore');
var extend = require('extend');
var fs = require('fs');
var hexoFS = require('hexo-fs');

var safeKeys = ['title', 'date', 'tags', 'categories', '_content'];

function _update(modelName, id, data, hexo) {
    var item = hexo.model(modelName).get(id);
    if (!item) {
        return itemNotFoundError(id, modelName);
    }
    var deferred = Q.defer();
    var postObj = hfm.split(item.raw);
    var postData = hfm.parse([postObj.data, '---', postObj.content].join('\n'));

    var prevSource = item.full_source;
    var source = prevSource;

    if (data.source && data.source !== item.source) {
        source = hexo.source_dir + data.source;
    }

    //only update safeKeys
    _.each(safeKeys, function(key, i) {
        if (key in data) {
            postData[key] = data[key];
        }
    });
    delete data._content;

    var raw = hfm.stringify(postData);
    data.raw = raw;
    data.updated = moment();

    if (_.isUndefined(data.tags) === false) {
        item.setTags(data.tags);
        delete data.tags;
    }

    if (_.isUndefined(data.categories) === false) {
        item.setCategories(data.categories);
        delete data.categories;
    }
    extend(item, data);

    item.save(function() {
        hexoFS.writeFile(source, raw, function(err) {
            if (err) {
                return deferred.reject({
                    errorCode: 500,
                    message: err
                });
            }
            if (source !== prevSource) {
                fs.unlinkSync(prevSource);
            }
            hexo.source.process([item.source]).then(function() {
                var newPost = hexo.model(modelName).get(id);
                return deferred.resolve(_addIsDraft(newPost));
            });
        });
    });
    return deferred.promise;
}

function _addIsDraft(post) {
    post.isDraft = post.source.indexOf('_draft') > -1 ? true : false;
    post.isDiscarded = post.source.indexOf('_discarded') > -1 ? true : false;
    return post;
}

var _updatePost = _update.bind(null, 'Post');

exports.create = function(postData, hexo) {
    var deferred = Q.defer();
    extend(postData, {
        date: postData.date || new Date(),
        layout: 'draft'
    });
    hexo.post.create(postData)
        .error(function(err) {
            console.error(err, err.stack)
            return deferred.reject({
                statusCode: 500,
                message: 'Failed to create post'
            });
        })
        .then(function(file) {
            var source = file.path.slice(hexo.source_dir.length)
            return hexo.source.process([source]).then(function() {
                var newPost = hexo.model('Post').findOne({
                    source: source
                })
                return deferred.resolve(_addIsDraft(newPost));
            }, function(error) {
                console.error(error);
                deferred.reject({
                    statusCode: 500,
                    message: 'Failed to create post'
                });
            });
        });
    return deferred.promise;
}
exports.update = _updatePost;

exports.getList = function(hexo) {
    return hexo.model('Post').toArray().map(_addIsDraft);
};

exports.remove = function(id, hexo) {
    var post = hexo.model('Post').get(id);
    if (!post) {
        var msg = 'Cannot find id: ' + id + ' in Model: Post';

        return Q.reject({
            statusCode: 404,
            message: msg
        });
    }
    var path = '_discarded/';
    if (post.source.indexOf('_posts') > -1) {
        path += post.source.slice('_posts/'.length);
    } else {
        path += post.source.slice('_drafts/'.length);
    }
    return _updatePost(id, {
        source: path
    }, hexo);
};

exports.unpublish = function(id, hexo) {
    var post = hexo.model('Post').get(id);
    if (!post) {
        return itemNotFoundError();
    }
    var path = '_drafts/';
    if (post.source.indexOf('_drafts') > -1) {
        path += post.source.slice('_drafts/'.length);
    } else if (post.source.indexOf('_discarded/') > -1) {
        path += post.source.slice('_discarded/'.length);
    } else {
        path += post.source.slice('_posts/'.length);
    }

    return _updatePost(id, {
        published: false,
        source: path
    }, hexo);
};

function itemNotFoundError(id, modelName) {
    var msg = 'Cannot find id: ' + id + ' in Model: ' + modelName;
    console.error(msg);
    return Q.reject({
        statusCode: 404,
        message: msg
    });
}

exports.publish = function(id, hexo) {
    var post = hexo.model('Post').get(id);
    if (!post) {
        return itemNotFoundError(id, 'Post');
    }
    var path = '_posts/';
    if (post.source.indexOf('_drafts') > -1) {
        path += post.source.slice('_drafts/'.length);
    } else if (post.source.indexOf('_discarded/') > -1) {
        path += post.source.slice('_discarded/'.length);
    } else {
        path += post.source.slice('_posts/'.length);
    }

    return _updatePost(id, {
        published: true,
        source: path
    }, hexo);
};
