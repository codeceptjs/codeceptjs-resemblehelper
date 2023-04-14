export const config: CodeceptJS.MainConfig = {
  tests: './*_test.ts',
  output: './output',
  helpers: {
    Playwright: {
      url: 'https://codecept.io/',
      show: false,
      browser: 'chromium'
    },
    "ResembleHelper" : {
      "require": "../src/index",
      "baseFolder": "./screenshots/base/",
      "diffFolder": "./screenshots/diff/",
      "prepareBaseImage": false
    }
  },
  include: {
    I: './steps_file'
  },
  name: '__test__'
}
