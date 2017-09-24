# grunt-broccoli
[![Build Status](https://travis-ci.org/quandl/grunt-broccoli.svg?branch=master)](https://travis-ci.org/quandl/grunt-broccoli)

[Broccoli](http://broccolijs.com/) is a performant and well maintained build tool that has been blessed by the Ember community. [Grunt](https://gruntjs.com/) is the task manager that we all know and love (you know you still do). They fill their respective niches well, and using them together makes a lot of sense.

This Grunt plugin lets you specify different Broccoli tasks in the same Gruntfile, and then use either the `build`, `watch` or `serve` command with each of them.

## Upgrading from 0.4.2

The latest version of grunt-broccoli upgrades the Broccoli dependency to ^1.0.0. All previously existing options still remain, but to align better with Grunt convention, they are now specified in the `options` object of your task. This also enables you to specify global options for all Broccoli tasks that can then be overriden for individual tasks.

For more details, see the [changelog](https://github.com/EmberSherpa/grunt-broccoli/blob/master/CHANGELOG.md).

## Get started

Install it by running `npm i -D grunt-broccoli`.

We've included a sample Gruntfile configuration below. You can use any name for your targets and then, in the terminal, pass either `build`, `watch` or `serve` as the final command. For instance:

```sh
grunt broccoli:prod:build
# or
grunt broccoli:dev:watch
# or
grunt broccoli:inline-config:serve
```

```js
module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-broccoli');

  grunt.initConfig({
    broccoli: {
      dev: {
        dest: 'public/assets',
        // These are the default option values. You only have to specify the
        // properties that you want to change
        options: {
          // By default, grunt-broccoli will walk up the directory tree until it
          // finds a file named "Brocfile.js". But if you specify a custom
          // path, it will be used "as is". It's also possible to specify a
          // function that returns a Broccoli node if you prefer to keep your
          // whole build config in Gruntfile.js
          config: 'Brocfile.js',
          // Can be either a string or an object. If a string, it specifies the
          // value of process.env.BROCCOLI_ENV. If an object, each key and value
          // will be merged with process.env
          env: 'development',
          // Which host to use with the 'serve' task
          host: '127.0.0.1',
          // If true, grunt-broccoli will only overwrite the files that
          // actually have changed after every rebuild. If false, the 'dest'
          // directory will be removed completely, and then rewritten, after
          // every rebuild
          incrementalOverwrite: true,
          // Which port to use with the 'serve' task
          port: 4200,
          // This option dictates where temporary files are placed while
          // Broccoli executes a build. Before Broccoli 1.0.0, they were placed
          // in a directory called `tmp` next to the Brocfile. After 1.0.0,
          // they're normally placed in the OS's global tmp directory
          tmpdir: undefined
        }
      },
      prod: {
        dest: 'public/assets',
        options: {
          env: {
            BROCCOLI_ENV: 'production'
          }
        }
      },
      'inline-config': {
        dest: 'public/assets',
        options: {
          // Here's an example of an inlined config. It's identical to what you
          // would put in a Brocfile, aside from the fact that a Brocfile would
          // use `module.exports` instead of `return` for the output node
          config: function() {
            var Sass = require('broccoli-sass');
            var PostCSS = require('broccoli-postcss');
            var Funnel = require('broccoli-funnel');
            var MergeTrees = require('broccoli-merge-trees');

            var css = new Sass(['src/scss'], 'site.scss', 'css/site.css');

            css = new PostCSS(css, {
              plugins: [
                {
                  module: require('autoprefixer'),
                  options: { browsers: ['defaults', 'last 4 versions', 'IE 9'] }
                }
              ]
            });

            var img = new Funnel('src/img', { destDir: 'img' });

            return new MergeTrees([css, img]);
          }
        }
      }
    }
  });

  grunt.registerTask('build', ['broccoli:prod:build']);
  grunt.registerTask('watch', ['broccoli:dev:watch']);
  grunt.registerTask('serve', ['broccoli:dev:serve']);

  grunt.registerTask('default', ['watch']);
};
```

For a more exhaustive example of what a `Brocfile.js` might look like, see [broccoli-sample-app](https://github.com/broccolijs/broccoli-sample-app).
