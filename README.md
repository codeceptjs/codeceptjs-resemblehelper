# codeceptjs-resemblehelper

>Helper wrapping resemble.js, used for image comparison in tests with WebdriverIO.

Codeceptjs-resemblehelper is a [CodeceptJS](https://codecept.io/) helper, which can be used to compare screenshots and make tests fail/pass based on a tolerance level. If two compared screenshot have a difference greater than the tolerance specifeid, the test will fail. The package is available from npm: https://www.npmjs.com/package/codeceptjs-resemblehelper. To install, just run `npm i --save codeceptjs-resemblehelper`

## Configuration

This helper should be added in `codecept.json` / `codecept.conf.js`. Example (in JSON):

```json
{
   "helpers": {
     "ResembleHelper" : {
       "require": "codeceptjs-resemblehelper",
       "screenshotFolder" : "./tests/output/",
       "baseFolder": "./tests/screenshots/base/",
       "diffFolder": "./tests/screenshots/diff/"
     }
   }
}
```
To use the helper, users must provide the three parameters:

| Parameter          | Effect                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `screenshotFolder` | This will always have the same value as `output` in Codecept configuration, this is the folder where webdriverIO saves a screenshot when using `I.saveScreenshot()` method |
| `baseFolder` | This is the folder for base images, which will be used with screenshot for comparison |
| `diffFolder` | This will the folder where resemble would try to store the difference image, which can be viewed later |

## Usage

### I.**`seeVisualDiff`**()

```js
    /**
     * Check for visual difference between base and screenshot image.
     *
     * @param baseImage         Name of images to compare (paths are taken from config). There needs to be a file with the name @param baseImage in both paths.
     * @param options           Options e.g.: { prepareBaseImage: true, tolerance: 5 } along with ResembleJS options, read more here: https://github.com/rsmbl/Resemble.js.
     * @returns {Promise<void>}
     */
    async seeVisualDiff(baseImage, options);
```

>Note: This method only works reliably, if the dimensions of the compared imags are the same. Otherwise it may lead to unexpected results. The helper will warn you about this.

### I.**`seeVisualDiffForElement`**()

```js
    /**
     * See visual difference for an element on the page.
     *
     * @param selector   Selector of element be compared (CSS | XPath | ID).
     * @param baseImage  Name of images to compare (paths are taken from config). There needs to be a file with the name @param baseImage in both paths.
     * @param options    Options ex { prepareBaseImage: true, tolerance: 5 } along with ResembleJS options, read more here: https://github.com/rsmbl/Resemble.js.
     * @returns {Promise<void>}
     */
    async seeVisualDiffForElement(selector, baseImage, options);
```

> Note: `seeVisualDiffForElement` only works when the page where the `baseImage` originated from is open in the browser. The webdriver needs to calculate the coordinates of the element with the provided selector.

### I.**`screenshotElement`**()

```js
    /**
     * Takes screenshot of element described by selector.
     *
     * @param selector   Selector of element (CSS | XPath | ID).
     * @param fileName   Filename for saved image.
     * @returns {Promise<void>}
     */
    async I.screenshotElement(selector, fileName);
```

>Note: This method only works with Puppeteer. As of version 1.7.0 it also works with WebDriver.

### Example

Finally to use the helper in your test, you can write something like this:

```js
Feature('to verify monitoried Remote Db instances');

Scenario('Open the System Overview Dashboard', async (I, adminPage, loginPage) => {
    adminPage.navigateToDashboard("OS", "System Overview");
    I.saveScreenshot("Complete_Dashboard_Image.png");
    adminPage.applyTimer("1m");
    adminPage.viewMetric("CPU Usage");
    I.saveScreenshot("Complete_Metric_Image.png");
});

Scenario('Compare CPU Usage Images', async (I) => {

    // Setting tolerance and prepareBaseImage in the options array
    I.seeVisualDiff("Complete_Metric_Image.png", {prepareBaseImage: false, tolerance: 5});

    // Passing a selector, to only compare that element on both the images now

    // We need to navigate to that page first, so that webdriver can fetch coordinates for the selector
    adminPage.navigateToDashboard("OS", "System Overview");
    I.seeVisualDiffForElement("//div[@class='panel-container']", "Complete_Dashboard_Image.png", {prepareBaseImage: false, tolerance: 3});
});
```

## Additional features

### Ignored box

You can also exclude part of the image from comparison, by specifying the excluded area in pixels. Just declare an object and pass it in options with the key `ignoredBox`:

```js
const box = {
    left: 0,
    top: 10,
    right: 0,
    bottom: 10
};

I.seeVisualDiff("image.png", { prepareBaseImage: true, tolerance: 1, ignoredBox: box });
```

After this, that specific mentioned part will be ignored while comparison.
This works for `seeVisualDiff` and `seeVisualDiffForElement`.

### Allure reporter

Allure reports may also be generated directly from the tool. To do so, add

```json
"plugins": {
	  "allure": {
          "output": "<location for allure reports>"
      }
}
```

in the `codecept.json` / `codecept.conf.js` config file. An attachments will be added to the report only when the calulated mismatch is greater than the given tolerance. Set `output` to where the generated report is to be stored. Default is the output directory of the project.

### AWS support

**Amazon Web Service** S3 is supported to up- and download various images . It can be used by adding the `aws` key inside `"ResembleHelper"` in the `"helpers"` section in the config file. The complete  configuration should look like this:

```json
{
    "helpers": {
        "ResembleHelper" : {
            "require": "codeceptjs-resemblehelper",
            "screenshotFolder" : "<location of output folder>",
            "baseFolder": "<location of base folder>",
            "diffFolder": "<location of diff folder>",
            "aws": {
                "accessKeyId" : "<Your AccessKeyId>",
                "secretAccessKey": "<Your secretAccessKey>",
                "region": "<Region of Bucket>",
                "bucketName": "<Bucket Name>"
            }
        }
    }
}

```

When this option is provided, the helper will download the base image from the S3 bucket. This base image has to be located inside a folder named `"base"`. The resulting output image will be uploaded in a folder named `"output"` and diff image will be uploaded to a folder named `"diff"` in the S3 bucket.
If the `prepareBaseImage` option is set to `true`, then the generated base image will be uploaded to a folder named `"base"` in the S3 bucket.

>Note: The tests may take a bit longer to run when the AWS configuration is provided as determined by the internet speed to up/download the images.

## Known issues:

- [ ] Issue with **Microsoft Windows**, where the image comparison is not carried out, and therefore no mismatch percentage is shown. See `loadImageData` function in ResembleJS.
