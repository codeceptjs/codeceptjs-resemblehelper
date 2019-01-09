# codeceptjs-resemblehelper
Helper for resemble.js, used for Image comparison in Tests with WebdriverIO

codeceptjs-resemblehelper is [CodeceptJS](https://codecept.io/) helper which can be used to compare screenshots and make the tests fail/pass based on the tolerance allowed

If two screenshot comparisons have difference greater then the tolerance provided, the test will fail.

NPM package: https://www.npmjs.com/package/codeceptjs-resemblehelper

To install the package, just run `npm install codeceptjs-resemblehelper`

### Configuration

This helper should be added in codecept.json/codecept.conf.js

Example:

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
To use the Helper, users must provide the three parameters:
`screenshotFolder` : This will always have the same value as `output` in Codecept configuration, this is the folder where webdriverIO
saves a screenshot when using `I.saveScreenshot` method

`baseFolder`: This is the folder for base images, which will be used with screenshot for comparison

`diffFolder`: This will the folder where resemble would try to store the difference image, which can be viewed later,
Please remember to create empty folder if you don't have one already

Usage, these are major functions that help in visual testing

First one is the `verifyMisMatchPercentage` which basically takes several parameters including tolerance and PrepareBase
```js
    /**
     * Mis Match Percentage Verification
     * @param baseImage         Name of the Base Image (Base Image path is taken from Configuration)
     * @param screenShotImage   Name of the screenshot Image (Screenshot Image Path is taken from Configuration)
     * @param diffImageName     Name of the Diff Image which will be saved after comparison (Diff Image path is taken from Configuration)
     * @param tolerance         Tolerance Percentage, default value 10
     * @param prepareBase       True | False, depending on the requirement if the base images are missing
     * @param selector          CSS|XPath|id, If provided locator will be used to fetch Bounding Box of the element and only that element is compared on two images
     * @param options           Resemble JS Options, read more here: https://github.com/rsmbl/Resemble.js
     * @returns {Promise<void>}
     */
    async verifyMisMatchPercentage(baseImage, screenShotImage, diffImageName, tolerance = 10, prepareBase = false, selector, options){
```
Second one is the `PrepareBase` which basically prepares all the base images in case they are not available
```js
    /**
     * Function to prepare Base Images from Screenshots
     *
     * @param baseImage        Name of the Base Image (Base Image path is taken from Configuration)
     * @param screenShotImage  Name of the screenshot Image (Screenshot Image Path is taken from Configuration)
     */
    prepareBaseImage(baseImage, screenShotImage) {}
```
Third function is to fetch the boundingBox of an element using selector, this boundingBox is then provided to resemble
so that only that element is compared on the images.

```js
    /**
     * Function to fetch Bounding box for an element, fetched using selector
     *
     * @param selector CSS|XPath|ID locators
     * @returns {Promise<{boundingBox: {left: *, top: *, right: *, bottom: *}}>}
     */
    async getBoundingBox(selector){
```
Users can make use of the boundingBox feature by providing a selector to `verifyMisMatchPercentage` function, it will internally
check if a locator is provided, fetch it's bounding-box and compare only that element on both the images.

Finally to use the helper in your test, you can write something like this:

```
Feature('to verify monitoried Remote Db instances');

Scenario('Open the System Overview Dashboard', async (I, adminPage, loginPage) => {
    adminPage.navigateToDashboard("OS", "System Overview");
    adminPage.applyTimer("1m");
    adminPage.viewMetric("CPU Usage");
    I.saveScreenshot("System_Overview_CPU_Usage.png");
});

Scenario('Compare CPU Usage Images', async (I) => {

    // passing TRUE to let the helper know to prepare base images
    I.verifyMisMatchPercentage("System_Overview_CPU_Usage.png", "System_Overview_CPU_Usage.png", "DiffImage_SystemOverview_CPU_USAGE_Dashboard", 10, true);

    // passing a selector, to only compare that element on both the images now
    I.verifyMisMatchPercentage("System_Overview_CPU_Usage.png", "System_Overview_CPU_Usage.png", "DiffImage_SystemOverview_CPU_USAGE_Panel", 10, false, "//div[@class='panel-container']");
});
```