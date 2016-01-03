'use strict';
//add done method to res in router.get router.post method
//add hexo tags or categories stringify strategy
function json(req, res, next) {
    res.json = function(code, val) {
        if (!val) {
            val = code;
            code = null;
        }

        if (!val) {
            res.statusCode = 204;
            return res.end('');
        }

        if (code) {
            res.statusCode = code;
        }

        res.setHeader('Content-type', 'application/json');
        res.end(JSON.stringify(val, function(k, v) {
            // tags and cats have posts reference resulting in circular json..
            if (k === 'tags' || k === 'categories') {
                // convert object to simple array
                return v.toArray ? v.toArray().map(function(obj) {
                    return obj.name
                }) : v;
            }
            return v;
        }));
    };
    res.send = function(num, data) {
        res.statusCode = num;
        res.end(data);
    };

    next();
}

module.exports = json;
