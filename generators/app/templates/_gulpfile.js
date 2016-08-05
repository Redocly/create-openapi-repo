var gulp = require('gulp');
var connect = require('gulp-connect');
var cors = require('cors');
var path = require('path');
var exec = require('child_process').exec;
var portfinder = require('portfinder');
portfinder.basePort = 3000;

var DIST_DIR = 'web_deploy';

gulp.task('serve', ['build', 'watch'], function() {
  portfinder.getPort(function (err, port) {
    connect.server({
      root: [DIST_DIR],
      livereload: true,
      port: port,
      middleware: function (connect, opt) {
        return [
          cors()
        ]
      }
    });
  });
});

gulp.task('build', function (cb) {
  exec('npm run build', function (err, stdout, stderr) {
    console.log(stderr);
    cb(err);
  });
});

gulp.task('reload', ['build'], function () {
  gulp.src(DIST_DIR).pipe(connect.reload())
});

gulp.task('watch', function () {
  gulp.watch(['spec/**/*', 'web/**/*'], ['reload']);
});
