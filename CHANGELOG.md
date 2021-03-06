## 1.1.4
- When using `options.incrementalOverwrite`, always overwrite target files on first successful build
- Updated devDependencies to use `broccoli-sass-source-maps` and `sass` rather than the practically abandoned `broccoli-sass` package
- Updated test suite to also test watch task

## 1.1.3
- Fixed a bug where watch command wouldn't write anything if dest directory didn't already exist

## 1.1.2
- Updated findup-sync dependency to ^2.0.0

## 1.1.1

- Fixed a bug in `options.incrementalOverwrite` that would prevent items that previously hadn't been included in the build tree from being written.
- Fixed a bug where a single rebuild would be logged multiple times when `options.incrementalOverwrite` was enabled

## 1.1.0

Added `options.tmpdir`. Primarily useful if you depend on a Broccoli plugin that still assumes temporary build files to be placed in a `tmp` directory next to the Brocfile.

## 1.0.0

A complete rewrite with inspiration and code from [broccoli](https://www.npmjs.com/package/broccoli)'s own CLI module.

Broccoli ^1.0.0 is now used, and tests load Grunt ^1.0.0.

#### API changes

Please note that apart from `dest`, all options now live in the `options` object. This is to align more closely with Grunt convention, and enables you to specify global options that can be locally overridden. Just like with any other Grunt plugin!

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
