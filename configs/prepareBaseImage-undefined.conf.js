const { setHeadlessWhen } = require('@codeceptjs/configure');

// turn on headless mode when running with HEADLESS=true environment variable
// export HEADLESS=true && npx codeceptjs run
setHeadlessWhen(process.env.HEADLESS);

exports.config = {
  tests: '../tests/prepareBaseImage-undefined_test.js',
  output: '../output',
  helpers: {
    WebDriver: {
      url: 'http://localhost',
      host: 'selenoid',
      browser: 'chrome',
      windowSize: '1200x800',
    },
    ResembleHelper: {
      require: '../index',
      screenshotFolder: '../tests/output/',
      baseFolder: '../tests/screenshots/base/',
      diffFolder: '../tests/screenshots/diff/',
    },
    AssertWrapper: {
      require: 'codeceptjs-assert',
    },
  },
  include: {
    I: '../steps_file.js',
  },
  bootstrap: null,
  mocha: {},
  name: 'codeceptjs-resemblehelper',
  plugins: {
    selenoid: {
      enabled: true,
      deletePassed: true,
      autoCreate: false,
      autoStart: false,
      sessionTimeout: '30m',
      enableVideo: false,
      enableLog: true,
    },
    pauseOnFail: {},
    tryTo: {
      enabled: true,
    },
    screenshotOnFail: {
      enabled: true,
    },
  },
};
