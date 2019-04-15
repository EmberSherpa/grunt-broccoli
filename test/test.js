var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var spawn = require('child_process').spawn;
var walkSync = require('walk-sync');

var initialSiteScss = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'src', 'scss', 'site.scss'),
  {
    encoding: 'utf8'
  }
);

function assertBuildDir(buildDir, test, cssFilename, callback) {
  var destItems = walkSync(buildDir);

  test.deepEqual(destItems, [
    'css/',
    'css/site.css',
    'img/',
    'img/USDA_Broccolini.jpg',
    'index.html'
  ]);

  var builtCSS = fs.readFileSync(path.join(buildDir, 'css', 'site.css'), {
    encoding: 'utf8'
  });

  var fixtureCSS = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'expected', cssFilename),
    {
      encoding: 'utf8'
    }
  );

  test.equal(builtCSS.trim(), fixtureCSS.trim());
  callback();
}

function runBuildTask(taskName) {
  return function(test) {
    test.expect(2);

    var buildDir = path.join(__dirname, 'build', taskName);
    rimraf.sync(buildDir);

    var child = spawn('grunt', ['broccoli:' + taskName + ':build']);

    child.on('close', function() {
      assertBuildDir(buildDir, test, 'initial.css', test.done);
    });
  };
}

// This test only tests that the watch task is able to trigger an initial build
// and that it rebuilds files after they have changed. It does not yet test when
// files are added or removed.
function runWatchTask(taskName) {
  return function(test) {
    test.expect(5);

    var buildDir = path.join(__dirname, 'build', taskName);
    rimraf.sync(buildDir);

    var child = spawn('grunt', ['broccoli:' + taskName + ':watch']);

    // Wait for the initial build
    child.stdout.on('data', function(data) {
      if (/Built \(\d+ items? changed\)/i.test(data.toString())) {
        child.stdout.removeAllListeners('data');

        // Assert that the initial build matches the usual build output
        assertBuildDir(buildDir, test, 'initial.css', function() {
          // Wait for a second build
          child.stdout.on('data', function(data) {
            // This method of checking the stdout output is a very crude way of
            // testing the options.incrementalOverwrite feature, but at least
            // it's something
            test.ok(/Built \(1 item changed\)/i.test(data.toString()));

            assertBuildDir(buildDir, test, 'second.css', function() {
              // Revert fixtures/src/scss/site.scss to its original state
              fs.writeFileSync(
                path.join(__dirname, 'fixtures', 'src', 'scss', 'site.scss'),
                initialSiteScss
              );

              child.kill('SIGINT');
              test.done();
            });
          });

          // Since options.incrementalOverwrite rounds file mtimes to the whole
          // seconds, we need to wait a little before triggering a file change
          // to site.scss
          setTimeout(function() {
            // Trigger a second build by appending a line to
            // fixtures/src/scss/site.scss
            fs.appendFileSync(
              path.join(__dirname, 'fixtures', 'src', 'scss', 'site.scss'),
              'a { text-decoration: none; }'
            );
          }, 1000);
        });
      }
    });
  };
}

exports.buildBrocfile = runBuildTask('brocfile');
exports.buildDefault = runBuildTask('default');
exports.buildFunction = runBuildTask('function');

exports.watchBrocfile = runWatchTask('brocfile');
exports.watchDefault = runWatchTask('default');
exports.watchFunction = runWatchTask('function');
