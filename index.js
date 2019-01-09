'use strict';

// use any assertion library you like
const resemble = require("resemblejs");
const fs = require('fs');
let assert = require('assert');
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;
/**
 * Resemble.js helper class for CodeceptJS, this allows screen comparison
 * @author Puneet Kala
 */
class ResembleHelper extends Helper {

    constructor(config) {
        super(config);
    }

    /**
     *
     * @param image1
     * @param image2
     * @param diffImage
     * @param tolerance
     * @param options
     * @returns {Promise<any | never>}
     */
    async _compareImages (image1, image2, diffImage, tolerance, options) {
        image1 = this.config.baseFolder + image1;
        image2 = this.config.screenshotFolder + image2;

        return new Promise((resolve, reject) => {
            if (options !== undefined)
            {
                resemble.outputSettings({
                    boundingBox: options.boundingBox
                });
            }
            resemble.compare(image1, image2, options, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                    if (data.misMatchPercentage >= tolerance) {
                        mkdirp(getDirName(this.config.diffFolder + diffImage), function (err) {
                            if (err) return cb(err);
                        });
                        fs.writeFile(this.config.diffFolder + diffImage + '.png', data.getBuffer(), (err, data) => {
                            if (err) {
                                throw new Error(this.err);
                            }
                        });
                    }
                }
            });
        }).catch((error) => {
            console.log('caught', error.message);
        });
    }

    /**
     *
     * @param image1
     * @param image2
     * @param diffImage
     * @param tolerance
     * @param options
     * @returns {Promise<*>}
     */
    async _fetchMisMatchPercentage (image1, image2, diffImage, tolerance, options) {
        var result = this._compareImages(image1, image2, diffImage, tolerance, options);
        var data = await Promise.resolve(result);
        return data.misMatchPercentage;
    }

    /**
     * Mis Match Percentage Verification
     * @param baseImage         Name of the Base Image (Base Image path is taken from Configuration)
     * @param screenShotImage   Name of the screenshot Image (Screenshot Image Path is taken from Configuration)
     * @param diffImageName     Name of the Diff Image which will be saved after comparison (Diff Image path is taken from Configuration)
     * @param tolerance         Tolerance Percentage, default value 10
     * @param prepareBase       True | False, depending on the requirement if the base images are missing
     * @param selector          If set, passed selector will be used to fetch Bouding Box and compared on two images
     * @param options           Resemble JS Options, read more here: https://github.com/rsmbl/Resemble.js
     * @returns {Promise<void>}
     */
    async verifyMisMatchPercentage(baseImage, screenShotImage, diffImageName, tolerance = 10, prepareBase = false, selector, options){
        if (prepareBase)
        {
            await this.prepareBaseImage(baseImage, screenShotImage);
        }

        if (selector !== undefined)
        {
            if (options !== undefined)
            {
                options.boundingBox = await this.getBoundingBox(selector);
            }
            else
            {
                var options = {};
                options.boundingBox = await this.getBoundingBox(selector);
            }
        }

        var misMatch = await this._fetchMisMatchPercentage(baseImage, screenShotImage, diffImageName, tolerance, options);
        console.log("MisMatch Percentage Calculated is " + misMatch);
        assert.ok(misMatch < tolerance, "MissMatch Percentage " + misMatch);
    }

    /**
     * Function to prepare Base Images from Screenshots
     *
     * @param baseImage        Name of the Base Image (Base Image path is taken from Configuration)
     * @param screenShotImage  Name of the screenshot Image (Screenshot Image Path is taken from Configuration)
     */
    async prepareBaseImage(baseImage, screenShotImage) {
        var configuration = this.config;

        await this._createDir(configuration.baseFolder + baseImage);

        fs.access(configuration.screenshotFolder + screenShotImage, fs.constants.F_OK | fs.constants.W_OK, (err) => {
            if (err) {
                console.error(
                    `${configuration.screenshotFolder + screenShotImage} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}`);
            }
        });

        fs.access(configuration.baseFolder, fs.constants.F_OK | fs.constants.W_OK, (err) => {
            if (err) {
                console.error(
                    `${configuration.baseFolder} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}`);
            }
        });

        fs.copyFileSync(configuration.screenshotFolder + screenShotImage, configuration.baseFolder + baseImage);
    }

    /**
     * Function to create Directory
     * @param directory
     * @returns {Promise<void>}
     * @private
     */
    async _createDir (directory) {
        mkdirp.sync(getDirName(directory));
    }

    /**
     * Function to fetch Bounding box for an element, fetched using selector
     *
     * @param selector CSS|XPath|ID selector
     * @returns {Promise<{boundingBox: {left: *, top: *, right: *, bottom: *}}>}
     */
    async getBoundingBox(selector){
        const browser = this._getBrowser();

        var ele = await browser.element(selector)
            .then((res) => {
                return res;
            })
            .catch((err) => {
                // Catch the error because webdriver.io throws if the element could not be found
                // Source: https://github.com/webdriverio/webdriverio/blob/master/lib/protocol/element.js
                return null;
            });
        var location = await browser.getLocation(selector);
        var size = await browser.getElementSize(selector);
        var bottom = size.height + location.y;
        var right = size.width + location.x;
        var boundingBox = {
            left: location.x,
            top: location.y,
            right: right,
            bottom: bottom
        };

        return boundingBox;
    }

    _getBrowser() {
        if (this.helpers['WebDriver']) {
            return this.helpers['WebDriver'].browser;
        }
        if (this.helpers['Appium']) {
            return this.helpers['Appium'].browser;
        }
        if (this.helpers['WebDriverIO']) {
            return this.helpers['WebDriverIO'].browser;
        }
        throw new Error('No matching helper found. Supported helpers: WebDriver/Appium/WebDriverIO');
    }
}

module.exports = ResembleHelper;
