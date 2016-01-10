'use strict';
var tagService = require('../service/tagService');

exports.getList = function(req, res, hexo) {
    return res.json({
        succeed: true,
        data: tagService.getList(hexo)
    });
};
