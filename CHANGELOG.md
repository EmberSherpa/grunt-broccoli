## 1.0.0

A complete rewrite with inspiration and code from [broccoli](https://www.npmjs.com/package/broccoli)'s own CLI module.

Broccoli ^1.0.0 is now used, and tests load Grunt ^1.0.0.

#### API changes

Please note that apart from `dest`, all options now live in the `options` object. This is to align more closely with Grunt convention, and enables you to specify global options that can be locally overriden. Just like with any other Grunt plugin!

```js
// Old config
grunt.initConfig({
  broccoli: {
    dev: {
      env 'production',
      dest: 'build/assets'
    }
  }
});

// New config
grunt.initConfig({
  broccoli: {
    dev: {
      dest: 'build/assets',
      options: {
        env 'production'
      }
    }
  }
});
```

#### New features

##### Incremental overwrite

The `options.incrementalOverwrite` property has been added! Previously, the plugin would mimic `broccoli-cli` in that the `dest` directory would be completely removed, then completely rewritten with every incremental rebuild. This works surprisingly well from a performance standpoint, but when integrating with other tools that watch the output directory, it can become overly noisy.

**Please note!** This option is turned on by default for `watch` and `serve` tasks.

##### Option validation

The task configuration is now validated against a schema. This should hopefully make it easier to get the configuration right.
