var gulp = require('gulp');
var react = require('gulp-react');
var watch = require('gulp-watch');
var webserver = require('gulp-webserver');
var ghPages = require('gulp-gh-pages');
var copy = require("gulp-copy")

gulp.task('webserver', function(){
	gulp.src('.')
		.pipe(webserver());
});

gulp.task('watch', function(){
	watch('assets/weatherMap.jsx')
		.pipe(react())
		.pipe(gulp.dest('assets'));
});

gulp.task('react', function(){
	gulp.src('assets/weatherMap.jsx')
		.pipe(react())
		.pipe(gulp.dest('assets'));
});

gulp.task('copy', function(){
    gulp.src(['./index.html','./assets/', './bower_components']).pipe(gulp.dest('./dist/'))
    gulp.src(['./assets/**/*']).pipe(gulp.dest('./dist/assets/'))
    gulp.src(['./bower_components/**/*']).pipe(gulp.dest('./dist/bower_components/'))
});

gulp.task('deploy', function(){
    return gulp.src('./dist/**/*').pipe(ghPages());
});
gulp.task('default', ['webserver', 'react', 'watch']);
