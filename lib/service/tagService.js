'use strict';

exports.getList = function(hexo) {
    return hexo.model('Tag').toArray();
};
