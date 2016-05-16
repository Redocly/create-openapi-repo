var gulp = require('gulp');
var connect = require('gulp-connect');
var cors = require('cors');
var path = require('path');
var exec = require('child_process').exec;

var DIST_DIR = 'web_deploy';
var SWAGGER_UI_DIST = path.dirname(require.resolve('swagger-ui'));

gulp.task('serve', ['build', 'watch'], function() {
  connect.server({
    root: [DIST_DIR],
    livereload: true,
    port: 3000<% if (installSwaggerUI) { %>,
    middleware: function (connect, opt) {
      return [
        connect().use('/swagger-ui', connect.static(SWAGGER_UI_DIST)),
        cors()
      ]
    }<% } %>
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
