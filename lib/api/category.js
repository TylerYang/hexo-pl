'use strict';
var categoryService = require('../service/categoryService');

exports.getList = function(req, res, hexo) {
    return res.json({
        succeed: true,
        data: categoryService.getList(hexo)
    });
};
