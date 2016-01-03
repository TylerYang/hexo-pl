'use strict';
var gulp = require('gulp');
var eslint = require('gulp-eslint');

//var config = require('./package.json');

gulp.task('eslint', function() {
    return gulp.src(['**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('test', function(cb) {
    return console.log('test');
});

gulp.task('default', ['eslint']);
