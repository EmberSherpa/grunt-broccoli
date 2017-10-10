var _ = require('lodash');
var broccoli = require('broccoli');
var copyDereferenceSync = require('copy-dereference').sync;
var findup = require('findup-sync');
var fs = require('fs');
var Joi = require('joi');
var mkdirp = require('mkdirp');
var path = require('path');
var rimraf = require('rimraf');
var walkSync = require('walk-sync');

module.exports = function(grunt) {
  grunt.registerMultiTask(
    'broccoli',
    'Execute custom Broccoli task',
    broccoliTask
  );

  function broccoliTask() {
    var options = this.options({
      config: findup('Brocfile.js', { nocase: true }),
      env: 'development',
      host: '127.0.0.1',
      incrementalOverwrite: true,
      port: 4200
    });

    var command = this.args[0];

    var dataSchema = Joi.object().keys({
      dest: Joi.string(),
      options: Joi.object().optional()
    });

    var optionsSchema = Joi.object().keys({
      config: [Joi.string(), Joi.func()],
      env: ['development', 'production', Joi.object()],
      host: Joi.string().hostname(),
      incrementalOverwrite: Joi.boolean(),
      port: Joi.number(),
      tmpdir: Joi.string().optional()
    });

    Joi.attempt(
      this.data,
      dataSchema,
      'If you recently upgraded grunt-broccoli to ^1.0.0, please ensure that you moved all options into the options object.\n'
    );

    Joi.attempt(options, optionsSchema);

    Joi.attempt(
      command,
      ['build', 'watch', 'serve'],
      'grunt-broccoli supports the following commands: "build", "watch" and "serve".\n'
    );

    if (_.isString(options.env)) {
      process.env.BROCCOLI_ENV = options.env;
    } else if (_.isPlainObject(options.env)) {
      _.forEach(options.env, function(value, key) {
        process.env[key] = value;
      });
    }

    if (options.tmpdir) {
      options.tmpdir = path.resolve(process.cwd(), options.tmpdir);
      mkdirp.sync(options.tmpdir);
    }

    var originalCwd = process.cwd();
    var dest = path.resolve(process.cwd(), this.data.dest);
    var done = this.async();
    var outputNode;

    if (_.isString(options.config)) {
      var configPath = path.resolve(process.cwd(), options.config);
      process.chdir(path.dirname(configPath));

      outputNode = require(configPath);
    } else if (_.isFunction(options.config)) {
      outputNode = options.config();
    }

    var builder = new broccoli.Builder(outputNode, { tmpdir: options.tmpdir });

    if (command === 'build') {
      builder
        .build()
        .then(function() {
          var logMessage = 'Build successful';

          if (builder.outputNodeWrapper.buildState.totalTime) {
            var buildTime = Math.round(
              builder.outputNodeWrapper.buildState.totalTime
            );
            logMessage += ' (' + buildTime + 'ms)';
          }

          rimraf.sync(dest);
          mkdirp.sync(path.join(dest, '..'));
          copyDereferenceSync(builder.outputPath, dest);

          grunt.log.ok(logMessage);
          done();
        })
        .finally(function() {
          process.chdir(originalCwd);

          return builder.cleanup();
        })
        .catch(function(error) {
          if (error.file) {
            grunt.log.error('File: ' + error.file);
          }

          grunt.log.error(error.stack);
          grunt.log.error('\nBuild failed');

          done(false);
        });

      return;
    }

    // From here on out, we can assume that command is either "watch" or "serve"
    var watcher = new broccoli.Watcher(builder);
    var changedItems = [];

    function cleanupAndExit() {
      return watcher.quit();
    }

    process.on('SIGINT', cleanupAndExit);
    process.on('SIGTERM', cleanupAndExit);

    watcher.on('buildSuccess', function() {
      var buildTime = Math.round(
        builder.outputNodeWrapper.buildState.totalTime
      );

      if (options.incrementalOverwrite) {
        var srcItems = walkSync(builder.outputPath);
        var destItems = walkSync(dest);

        var removedDestItems = _.difference(destItems, srcItems);

        removedDestItems.forEach(function(item) {
          var itemDestPath = path.join(dest, item);
          rimraf.sync(itemDestPath);
        });

        changedItems = removedDestItems.slice(0);

        srcItems.forEach(function(item) {
          var destMtime;

          var itemSrcPath = path.join(builder.outputPath, item);
          var srcStats = fs.statSync(itemSrcPath);
          var srcMtime = 1000 * Math.floor(srcStats.mtime.getTime() / 1000);

          try {
            var itemDestPath = path.join(dest, item);
            var destStats = fs.statSync(itemDestPath);
            destMtime = 1000 * Math.floor(destStats.mtime.getTime() / 1000);

            // The mtime of a directory is updated when the mtime of one of its
            // contained items are updated. By not copying whole directories, we
            // avoid overwriting other contained items that haven't changed
            if (srcStats.isDirectory() && destStats.isDirectory()) {
              return;
            }
          } catch (error) {
            destMtime = Number.NEGATIVE_INFINITY;
          }

          if (srcMtime > destMtime) {
            changedItems.push(item);
            rimraf.sync(itemDestPath);
            mkdirp.sync(path.dirname(itemDestPath));

            copyDereferenceSync(itemSrcPath, itemDestPath);
          }
        });

        var changedItemsLog =
          changedItems.length +
          (changedItems.length === 1 ? ' item' : ' items') +
          ' changed';

        grunt.log.ok(
          'Built (' +
            changedItemsLog +
            ') - ' +
            buildTime +
            ' ms @ ' +
            new Date().toString()
        );
      } else {
        rimraf.sync(dest);
        mkdirp.sync(dest);

        copyDereferenceSync(builder.outputPath, dest);

        grunt.log.ok('Built - ' + buildTime + ' ms @ ' + new Date().toString());
      }
    });

    watcher.on('buildFailure', function(error) {
      grunt.log.error('Built with error:');
      grunt.log.error(error.message);

      if (!error.broccoliPayload || !error.broccoliPayload.location.file) {
        grunt.log.error(error.stack);
      }
    });

    var watcherPromise = watcher.start();

    watcherPromise
      .catch(function(error) {
        grunt.log.error((error && error.stack) || error);
      })
      .finally(function() {
        builder.cleanup();
      })
      .catch(function(error) {
        grunt.log.error('Cleanup error:');
        grunt.log.error((error && error.stack) || error);
      })
      .finally(function() {
        process.exit(1);
      });

    if (command === 'serve') {
      var connect = require('connect');
      var http = require('http');
      var middleware = require('broccoli/lib/middleware');
      var tinylr = require('tiny-lr');

      var tinylrServer = new tinylr.Server();
      tinylrServer.listen();

      var app = connect().use(middleware(watcher));
      var server = http.createServer(app);
      server.listen(options.port, options.host);

      watcher.on('buildSuccess', function() {
        tinylrServer.changed({ body: { files: changedItems } });
      });

      watcher.on('buildFailure', function() {
        tinylrServer.changed({ body: { files: [] } });
      });

      watcherPromise.finally(function() {
        tinylrServer.close();
        server.close();
      });
    }
  }
};
