module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadTasks('tasks');
  grunt.registerTask('test', ['eslint', 'nodeunit']);

  grunt.initConfig({
    eslint: {
      target: ['*.js', 'tasks/*.js', 'test/*.js']
    },
    nodeunit: {
      tests: ['test/*.js']
    },
    broccoli: {
      brocfile: {
        dest: 'test/build/brocfile',
        options: {
          config: './test/fixtures/Brocfile.js',
          tmpdir: 'tmp'
        }
      },
      function: {
        dest: 'test/build/function',
        options: {
          config: function() {
            var path = require('path');

            process.chdir(path.resolve(__dirname, 'test/fixtures'));
            return require('./test/fixtures/Brocfile.js');
          }
        }
      },
      default: {
        dest: 'test/build/default'
      }
    }
  });
};
