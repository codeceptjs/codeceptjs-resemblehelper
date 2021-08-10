# codeceptjs-resemblehelper
Helper for resemble.js, used for image comparison in tests with Playwright, Webdriver, Puppeteer, Appium, TestCafe! 

codeceptjs-resemblehelper is a [CodeceptJS](https://codecept.io/) helper which can be used to compare screenshots and make the tests fail/pass based on the tolerance allowed.

If two screenshot comparisons have difference greater then the tolerance provided, the test will fail.

NPM package: https://www.npmjs.com/package/codeceptjs-resemblehelper

To install the package, just run `npm install codeceptjs-resemblehelper`.

### Configuration

This helper should be added in codecept.json/codecept.conf.js

Example:

```json
{
   "helpers": {
     "ResembleHelper" : {
       "require": "codeceptjs-resemblehelper",
       "baseFolder": "./tests/screenshots/base/",
       "diffFolder": "./tests/screenshots/diff/",
       "prepareBaseImage": true
     }
   }
}
```

To use the Helper, users may provide the parameters:

`baseFolder`: Mandatory. This is the folder for base images, which will be used with screenshot for comparison.

`diffFolder`: Mandatory. This will the folder where resemble would try to store the difference image, which can be viewed later.

`prepareBaseImage`: Optional. When `true` then the system replaces all of the baselines related to the test case(s) you ran. This is equivalent of setting the option `prepareBaseImage: true` in all verifications of the test file.

`compareWithImage`: Optional. A custom filename to compare the screenshot with. The `compareWithImage` file must be located inside the `baseFolder`.

### Usage

These are the major functions that help in visual testing:

First one is the `seeVisualDiff` which basically takes two parameters
1) `baseImage` Name of the base image, this will be the image used for comparison with the screenshot image. It is mandatory to have the same image file names for base and screenshot image.
2) `options` options can be passed which include `prepaseBaseImage` and `tolerance`.

```js
    /**
     * Check Visual Difference for Base and Screenshot Image
     * @param baseImage         Name of the Base Image (Base Image path is taken from Configuration)
     * @param options           Options ex {prepareBaseImage: true, tolerance: 5} along with Resemble JS Options, read more here: https://github.com/rsmbl/Resemble.js
     * @returns {Promise<void>}
     */
    async seeVisualDiff(baseImage, options) {}
```
Second one is the `seeVisualDiffForElement` which basically compares elements on the screenshot, selector for element must be provided.

It is exactly same as `seeVisualDiff` function, only an additional `selector` CSS|XPath|ID locators is provided
```js
    /**
     * See Visual Diff for an Element on a Page
     *
     * @param selector   Selector which has to be compared, CSS|XPath|ID
     * @param baseImage  Base Image for comparison
     * @param options    Options ex {prepareBaseImage: true, tolerance: 5} along with Resemble JS Options, read more here: https://github.com/rsmbl/Resemble.js
     * @returns {Promise<void>}
     */
    async seeVisualDiffForElement(selector, baseImage, options){}
```
> Note:
`seeVisualDiffForElement` only works when the page for baseImage is open in the browser, so that WebdriverIO can fetch coordinates of the provided selector.

Third one is the `screenshotElement` which basically takes screenshot of the element. Selector for the element must be provided. It saves the image in the output directory as mentioned in the config folder.

```js
I.screenshotElement("selectorForElement", "nameForImage");
```
> Note: This method only works with puppeteer.

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

    // setting tolerance and prepareBaseImage in the options array
    I.seeVisualDiff("Complete_Metric_Image.png", {prepareBaseImage: false, tolerance: 5});

    // passing a selector, to only compare that element on both the images now

    // We need to navigate to that page first, so that webdriver can fetch coordinates for the selector
    adminPage.navigateToDashboard("OS", "System Overview");
    I.seeVisualDiffForElement("//div[@class='panel-container']", "Complete_Dashboard_Image.png", {prepareBaseImage: false, tolerance: 3});
});
```
> Note: `seeVisualDiff` and `seeVisualDiffElement` work only when the dimensions of the screenshot as well as the base image are same so as to avoid unexpected results.

### Ignored Box
You can also exclude part of the image from comparison, by specifying the excluded area in pixels from the top left.
Just declare an object and pass it in options as `ignoredBox`:
```js
const box = {
    left: 0,
    top: 10,
    right: 0,
    bottom: 10
};

I.seeVisualDiff("image.png", {prepareBaseImage: true, tolerance: 1, ignoredBox: box});
```
After this, that specific mentioned part will be ignored while comparison.
This works for `seeVisualDiff` and `seeVisualDiffForElement`.

### resemble.js Output Settings
You can set further output settings used by resemble.js. Declare an object specifying them and pass it in the options as `outputSettings`:

```js
const outputSettings = {
    ignoreAreasColoredWith: {r: 250, g: 250, b: 250, a: 0},
    // read more here: https://github.com/rsmbl/Resemble.js
};
I.seeVisualDiff("image.png", {prepareBaseImage: true, tolerance: 1, outputSettings: outputSettings});
```

Refer to the [resemble.js](https://github.com/rsmbl/Resemble.js) documentation for available output settings.

### Skip Failure
You can avoid the test fails for a given threshold but yet generates the difference image.
Just declare an object and pass it in options as `skipFailure`:
```
I.seeVisualDiff("image.png", {prepareBaseImage: true, tolerance: 1, skipFailure: true});
```
After this, the system generates the difference image but does not fail the test.
This works for `seeVisualDiff` and `seeVisualDiffForElement`.


### Allure Reporter
Allure reports may also be generated directly from the tool. To do so, add

```
"plugins": {
	  "allure": {}
}
```

in the config file.
The attachments will be added to the report only when the calulated mismatch is greater than the given tolerance. 
Set `output` to where the generated report is to be stored. Default is the output directory of the project.

### AWS Support
AWS S3 support to upload and download various images is also provided.
It can be used by adding the *aws* code inside `"ResembleHelper"` in the `"helpers"` section in config file. The final result should look like:    
```json
{
    "helpers": {
        "ResembleHelper" : {
            "require": "codeceptjs-resemblehelper",
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
When this option has been provided, the helper will download the base image from the S3 bucket.
This base image has to be located inside a folder named "*base*".
The resultant output image will be uploaded in a folder named "*output*" and diff image will be uploaded to a folder named "*diff*" in the S3 bucket.
If the `prepareBaseImage` option is marked `true`, then the generated base image will be uploaded to a folder named "*base*" in the S3 bucket.
> Note: The tests may take a bit longer to run when the AWS configuration is provided as determined by the internet speed to upload/download images.

### Compare with custom image
Usually, every screenshot needs to have the same filename as an existing image inside the `baseFolder` directory. To change this behavior, you can use the `compareWithImage` option and specify a different image inside the `baseFolder` directory.

This is useful, if you want to compare a single screenshot against multiple base images - for example, when you want to validate that the main menu element is identical on all app pages.
```js
I.seeVisualDiffForElement("#element", "image.png", {compareWithImage: "dashboard.png"});
I.seeVisualDiffForElement("#element", "image.png", {compareWithImage: "account.png"});
```

Or, in some cases there are intended visual differences for different browsers or operating systems:
```js
const os = "win32" === process.platform ? "win" : "mac";

// Compare "image.png" either with "image-win.png" or "image-mac.png":
I.seeVisualDiff("image.png", {compareWithImage: `image-${os}.png`});
```

### Known Issues:

> Issue in Windows where the image comparison is not carried out, and therefore no Mismatch Percentage is shown. See 'loadImageData' function in resemble.js
