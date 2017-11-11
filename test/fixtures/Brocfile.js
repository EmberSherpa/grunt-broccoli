var Sass = require('broccoli-sass');
var PostCSS = require('broccoli-postcss');
var Funnel = require('broccoli-funnel');
var MergeTrees = require('broccoli-merge-trees');

var css = new Sass(['src/scss'], 'site.scss', 'css/site.css');

css = new PostCSS(css, {
  plugins: [
    {
      module: require('autoprefixer'),
      options: { browsers: ['IE 10'] }
    }
  ]
});

var img = new Funnel('src/img', { destDir: 'img' });

var static = new Funnel('src', {
  exclude: ['img', 'scss']
});

module.exports = new MergeTrees([css, img, static]);
