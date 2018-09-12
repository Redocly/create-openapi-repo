var gulp = require('gulp');
var colors = require('ansi-colors');
var log = require('fancy-log');
var gulpConnect = require('gulp-connect');
var connect = require('connect');
var cors = require('cors');
var exec = require('child_process').exec;
var portfinder = require('portfinder');
var swaggerRepo = require('swagger-repo');

var DIST_DIR = 'web_deploy';

function edit(done) {
  portfinder.getPort({port: 5000}, function (err, port) {
    var app = connect();
    app.use(swaggerRepo.swaggerEditorMiddleware());
    app.listen(port);
    log(colors.green('swagger-editor started http://localhost:' + port));
  });
  done();
}

function build(done) {
  exec('npm run build', function (err, stdout, stderr) {
    console.log(stderr);
    done(err);
  });
}

function reload(done) {
  gulp.src(DIST_DIR).pipe(gulpConnect.reload());
  done();
}

function watch(done) {
  gulp.watch(['spec/**/*', 'web/**/*'], gulp.series(build, reload));
  done();
}

function start(done) {
  portfinder.getPort({port: 3000}, function (err, port) {
    gulpConnect.server({
      root: [DIST_DIR],
      livereload: true,
      port: port,
      middleware: function (gulpConnect, opt) {
        return [
          cors()
        ]
      }
    });
  });
  done();
};

exports.serve = gulp.series(build, start, watch, edit);
