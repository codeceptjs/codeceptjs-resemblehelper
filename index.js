const resemble = require('resemblejs');
const fs = require('fs');
const assert = require('assert');
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;
const AWS = require('aws-sdk');
const path = require('path');
const sizeOf = require('image-size');

/**
 * Resemble.js helper class for CodeceptJS, this allows screen comparison
 * @author Puneet Kala
 */

class ResembleHelper extends Helper {
  constructor(config) {
    super(config);
    this.baseFolder = this.resolvePath(config.baseFolder);
    this.diffFolder = this.resolvePath(config.diffFolder);
    this.screenshotFolder = `${global.output_dir}/`;
    this.prepareBaseImage = config.prepareBaseImage;
    this.tolerance = config.tolerance;
  }

  resolvePath(folderPath) {
    if (!path.isAbsolute(folderPath)) {
      return `${path.resolve(global.codecept_dir, folderPath)}/`;
    }
    return folderPath;
  }

  /**
   * Compare Images
   *
   * @param image
   * @param diffImage
   * @param options
   * @returns {Promise<resolve | reject>}
   */
  async _compareImages(image, diffImage, options) {
    const baseImage = this.baseFolder + image;
    const actualImage = this.screenshotFolder + image;

    // check whether the base and the screenshot images are present.
    fs.access(baseImage, fs.constants.F_OK | fs.constants.R_OK, (err) => {
      if (err) {
        throw new Error(
          `${baseImage} ${err.code === 'ENOENT' ? 'base image does not exist'
            : 'base image has an access error'}`,
        );
      }
    });

    fs.access(actualImage, fs.constants.F_OK | fs.constants.R_OK, (err) => {
      if (err) {
        throw new Error(
          `${actualImage} ${err.code === 'ENOENT' ? 'screenshot image does not exist'
            : 'screenshot image has an access error'}`,
        );
      }
    });

    return new Promise((resolve, reject) => {
      if (!options.outputSettings) {
        options.outputSettings = {};
      }
      resemble.outputSettings({
        boundingBox: options.boundingBox,
        ignoredBox: options.ignoredBox,
        ignoredBoxes: options.ignoredBoxes,
        ...options.outputSettings,
      });

      this.debug(`Tolerance Level Provided ${options.tolerance}`);
      const tolerance = options.tolerance;

      resemble.compare(baseImage, actualImage, options, (err, data) => {
        if (err) {
          reject(err);
        } else {
          if (!data.isSameDimensions) {
            let dimensions1 = sizeOf(baseImage);
            let dimensions2 = sizeOf(actualImage);
            reject(new Error(`The base image is of ${dimensions1.height} X ${dimensions1.width} and actual image is of ${dimensions2.height} X ${dimensions2.width}. Please use images of same dimensions so as to avoid any unexpected results.`));
          }
          resolve(data);
          if (data.misMatchPercentage >= tolerance) {
            if (!fs.existsSync(getDirName(this.diffFolder + diffImage))) {
              fs.mkdirSync(getDirName(this.diffFolder + diffImage));
            }
            fs.writeFileSync(`${this.diffFolder + diffImage}.png`, data.getBuffer());
            const diffImagePath = path.join(process.cwd(), `${this.diffFolder + diffImage}.png`);
            this.debug(`Diff Image File Saved to: ${diffImagePath}`);
          }
        }
      });
    });
  }

  /**
   * Get actual date and time in format MMMM-MM-MMTHH:MM:SS
   * @returns <void>
   */
  _getTimestamp() {
    let now = new Date();
    return now.toISOString().slice(0, 19);
  }

  /**
   *
   * @param image
   * @param options
   * @returns {Promise<*>}
   */
  async _fetchMisMatchPercentage(image, options) {
    const diffImage = `Diff_${image.split('.')[0]}_${this._getTimestamp()}`;
    const result = this._compareImages(image, diffImage, options);
    const data = await Promise.resolve(result);
    return data.misMatchPercentage;
  }

  /**
   * Take screenshot of individual element.
   * @param selector selector of the element to be screenshotted
   * @param name name of the image
   * @returns {Promise<void>}
   */
  async screenshotElement(selector, name) {
    const helper = this._getHelper();
    if (this.helpers['Puppeteer'] || this.helpers['Playwright']) {
      await helper.waitForVisible(selector);
      const els = await helper._locate(selector);
      if (!els.length) throw new Error(`Element ${selector} couldn't be located`);
      const el = els[0];

      await el.screenshot({ path: `${global.output_dir}/${name}` });
    } else if (this.helpers['WebDriver']) {
      await helper.waitForVisible(selector);
      const els = await helper._locate(selector);
      if (!els.length) throw new Error(`Element ${selector} couldn't be located`);
      const el = els[0];

      await el.saveScreenshot(`${this.screenshotFolder + name}`);
    } else if (this.helpers['TestCafe']) {
      await helper.waitForVisible(selector);
      const els = await helper._locate(selector);
      if (!await els.count) throw new Error(`Element ${selector} couldn't be located`);
      const { t } = this.helpers['TestCafe'];

      await t.takeElementScreenshot(els, name);
    } else throw new Error('Method only works with Playwright, Puppeteer, WebDriver or TestCafe helpers.');
  }

  /**
   * This method attaches image attachments of the base, screenshot and diff to the allure reporter when the mismatch exceeds tolerance.
   * @param baseImage
   * @param misMatch
   * @param tolerance
   * @returns {Promise<void>}
   */

  async _addAttachment(baseImage, misMatch, tolerance) {
    const allure = codeceptjs.container.plugins('allure');
    const diffImage = `Diff_${baseImage.split('.')[0]}.png`;

    if (allure !== undefined && misMatch >= tolerance) {
      allure.addAttachment('Base Image', fs.readFileSync(this.baseFolder + baseImage), 'image/png');
      allure.addAttachment('Screenshot Image', fs.readFileSync(this.screenshotFolder + baseImage), 'image/png');
      allure.addAttachment('Diff Image', fs.readFileSync(this.diffFolder + diffImage), 'image/png');
    }
  }

  /**
   * This method attaches context, and images to Mochawesome reporter when the mismatch exceeds tolerance.
   * @param baseImage
   * @param misMatch
   * @param tolerance
   * @returns {Promise<void>}
   */

  async _addMochaContext(baseImage, misMatch, tolerance) {
    const mocha = this.helpers['Mochawesome'];
    const diffImage = `Diff_${baseImage.split('.')[0]}.png`;

    if (mocha !== undefined && misMatch >= tolerance) {
      await mocha.addMochawesomeContext('Base Image');
      await mocha.addMochawesomeContext(this.baseFolder + baseImage);
      await mocha.addMochawesomeContext('ScreenShot Image');
      await mocha.addMochawesomeContext(this.screenshotFolder + baseImage);
      await mocha.addMochawesomeContext('Diff Image');
      await mocha.addMochawesomeContext(this.diffFolder + diffImage);
    }
  }

  /**
   * This method uploads the diff and screenshot images into the bucket with diff image under bucketName/diff/diffImage and the screenshot image as
   * bucketName/output/ssImage
   * @param accessKeyId
   * @param secretAccessKey
   * @param region
   * @param bucketName
   * @param baseImage
   * @param ifBaseImage - tells if the prepareBaseImage is true or false. If false, then it won't upload the baseImage. However, this parameter is not considered if the config file has a prepareBaseImage set to true.
   * @returns {Promise<void>}
   */

  async _upload(accessKeyId, secretAccessKey, region, bucketName, baseImage, ifBaseImage) {
    console.log('Starting Upload... ');
    const s3 = new AWS.S3({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region,
    });
    fs.readFile(this.screenshotFolder + baseImage, (err, data) => {
      if (err) throw err;
      let base64data = new Buffer(data, 'binary');
      const params = {
        Bucket: bucketName,
        Key: `output/${baseImage}`,
        Body: base64data,
      };
      s3.upload(params, (uErr, uData) => {
        if (uErr) throw uErr;
        console.log(`Screenshot Image uploaded successfully at ${uData.Location}`);
      });
    });
    fs.readFile(`${this.diffFolder}Diff_${baseImage}`, (err, data) => {
      if (err) console.log('Diff image not generated');
      else {
        let base64data = new Buffer(data, 'binary');
        const params = {
          Bucket: bucketName,
          Key: `diff/Diff_${baseImage}`,
          Body: base64data,
        };
        s3.upload(params, (uErr, uData) => {
          if (uErr) throw uErr;
          console.log(`Diff Image uploaded successfully at ${uData.Location}`);
        });
      }
    });
    if (ifBaseImage) {
      fs.readFile(this.baseFolder + baseImage, (err, data) => {
        if (err) throw err;
        else {
          let base64data = new Buffer(data, 'binary');
          const params = {
            Bucket: bucketName,
            Key: `base/${baseImage}`,
            Body: base64data,
          };
          s3.upload(params, (uErr, uData) => {
            if (uErr) throw uErr;
            console.log(`Base Image uploaded at ${uData.Location}`);
          });
        }
      });
    } else {
      console.log('Not Uploading base Image');
    }
  }

  /**
   * This method downloads base images from specified bucket into the base folder as mentioned in config file.
   * @param accessKeyId
   * @param secretAccessKey
   * @param region
   * @param bucketName
   * @param baseImage
   * @returns {Promise<void>}
   */

  _download(accessKeyId, secretAccessKey, region, bucketName, baseImage) {
    console.log('Starting Download...');
    const s3 = new AWS.S3({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region,
    });
    const params = {
      Bucket: bucketName,
      Key: `base/${baseImage}`,
    };
    return new Promise((resolve) => {
      s3.getObject(params, (err, data) => {
        if (err) console.error(err);
        console.log(this.baseFolder + baseImage);
        fs.writeFileSync(this.baseFolder + baseImage, data.Body);
        resolve('File Downloaded Successfully');
      });
    });
  }

  /**
   * Check Visual Difference for Base and Screenshot Image
   * @param baseImage         Name of the Base Image (Base Image path is taken from Configuration)
   * @param options           Options ex {prepareBaseImage: true, tolerance: 5} along with Resemble JS Options, read more here: https://github.com/rsmbl/Resemble.js
   * @returns {Promise<void>}
   */
  async seeVisualDiff(baseImage, options) {
    await this._assertVisualDiff(undefined, baseImage, options);
  }

  /**
   * See Visual Diff for an Element on a Page
   *
   * @param selector   Selector which has to be compared expects these -> CSS|XPath|ID
   * @param baseImage  Base Image for comparison
   * @param options    Options ex {prepareBaseImage: true, tolerance: 5} along with Resemble JS Options, read more here: https://github.com/rsmbl/Resemble.js
   * @returns {Promise<void>}
   */
  async seeVisualDiffForElement(selector, baseImage, options) {
    await this._assertVisualDiff(selector, baseImage, options);
  }

  async _assertVisualDiff(selector, baseImage, options) {
    if (!options) {
      options = {};
      options.tolerance = 0;
    }

    if (this.tolerance !== undefined) {
      if (options.tolerance === undefined) {
        options.tolerance = this.tolerance;
      }
    }

    if (!options.tolerance && options.tolerance !== 0) {
      options.tolerance = 0;
    }

    if (options.ignoredElement !== undefined) {
      options.ignoredBox = await this._getElementCoordinates(options.ignoredElement);
    }

    if (options.ignoredElements !== undefined) {
      options.ignoredBoxes = await this._getIgnoredBoxesFromElements(options.ignoredElements);
    }

    const prepareBaseImage = options.prepareBaseImage !== undefined
      ? options.prepareBaseImage
      : (this.prepareBaseImage === true);
    const awsC = this.config.aws;
    if (awsC !== undefined && prepareBaseImage === false) {
      await this._download(awsC.accessKeyId, awsC.secretAccessKey, awsC.region, awsC.bucketName, baseImage);
    }

    if ((this.prepareBaseImage === true && options.prepareBaseImage === undefined)
    || (options.prepareBaseImage === true)
    || (this.prepareBaseImage === undefined && options.prepareBaseImage === undefined)) {
      await this._prepareBaseImage(baseImage, options);
    }

    if (selector) {
      options.boundingBox = await this._getBoundingBox(selector);
    }
    const misMatch = await this._fetchMisMatchPercentage(baseImage, options);
    await this._addAttachment(baseImage, misMatch, options.tolerance);
    await this._addMochaContext(baseImage, misMatch, options.tolerance);
    if (awsC !== undefined) {
      await this._upload(awsC.accessKeyId, awsC.secretAccessKey, awsC.region, awsC.bucketName, baseImage, options.prepareBaseImage);
    }

    this.debug(`MisMatch Percentage Calculated is ${misMatch} for baseline ${baseImage}`);

    if (!options.skipFailure) {
      assert(misMatch <= options.tolerance, `Screenshot does not match with the baseline ${baseImage} when MissMatch Percentage is ${misMatch}`);
    }
  }

  /**
   * Function to prepare Base Images from Screenshots
   *
   * @param screenShotImage  Name of the screenshot Image (Screenshot Image Path is taken from Configuration)
   * @param options Options ex {prepareBaseImage: true, tolerance: 5} along with Resemble JS Options, read more here: https://github.com/rsmbl/Resemble.js
   */
  async _prepareBaseImage(screenShotImage, options) {
    await this._createDir(this.baseFolder + screenShotImage);

    fs.access(this.screenshotFolder + screenShotImage, fs.constants.F_OK | fs.constants.W_OK, (err) => {
      if (err) {
        throw new Error(
          `${this.screenshotFolder + screenShotImage} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}`,
        );
      }
    });

    fs.access(this.baseFolder, fs.constants.F_OK | fs.constants.W_OK, (err) => {
      if (err) {
        throw new Error(
          `${this.baseFolder} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}`,
        );
      }
    });

    try {
      await fs.promises.access(this.baseFolder + screenShotImage, fs.constants.F_OK | fs.constants.W_OK);

      if (options.prepareBaseImage === true) {
        this.debug('Test option is set as: prepareBaseImage = true');
        this.debug('Creating base image ...');
        fs.copyFileSync(this.screenshotFolder + screenShotImage, this.baseFolder + screenShotImage);
        this.debug(`Base image: ${screenShotImage} is created.`);
      } else if (this.prepareBaseImage === true && options.prepareBaseImage === undefined) {
        this.debug('Global config is set as: prepareBaseImage = true');
        this.debug('Creating base image ...');
        fs.copyFileSync(this.screenshotFolder + screenShotImage, this.baseFolder + screenShotImage);
        this.debug(`Base image: ${screenShotImage} is created.`);
      } else {
        this.debug(`Found existing base image: ${screenShotImage} and use it for compare.`);
      }
    } catch (e) {
      this.debug(`Existing base image with name ${screenShotImage} was not found.`);
      this.debug('Creating base image ...');
      fs.copyFileSync(this.screenshotFolder + screenShotImage, this.baseFolder + screenShotImage);
      this.debug(`Base image: ${screenShotImage} is created.`);
    }
  }

  /**
   * Function to create Directory
   * @param directory
   * @returns {Promise<void>}
   * @private
   */
  _createDir(directory) {
    mkdirp.sync(getDirName(directory));
  }

  /**
   * Function for delete screenshot image
   * @example
   * I.deleteScreenshot('./folder/image.png')
   * @param pathToFile string
   * @returns {Promise<void>}
   */
  async deleteScreenshot(pathToFile) {
    fs.unlink(pathToFile, (err) => {
      if (err && err.code === 'ENOENT') {
        console.info(`Current directory: " ${process.cwd()}`);
        console.info('File doesn\'t exist, can\'t remove it.');
      } else if (err) {
        console.error('Error occurred while trying to remove file');
      } else {
        console.info(`File ${pathToFile} removed.`);
      }
    });
  }

  /**
   * Function to fetch Bounding box for an element, fetched using selector
   *
   * @param selector CSS|XPath|ID selector
   * @returns {Promise<{boundingBox: {left: *, top: *, right: *, bottom: *}}>}
   */
  async _getBoundingBox(selector) {
    const helper = this._getHelper();
    await helper.waitForVisible(selector);
    const els = await helper._locate(selector);

    if (this.helpers['TestCafe']) {
      if (await els.count !== 1) throw new Error(`Element ${selector} couldn't be located or isn't unique on the page`);
    } else if (!els.length) throw new Error(`Element ${selector} couldn't be located`);

    let location; let size;

    if (this.helpers['Puppeteer'] || this.helpers['Playwright']) {
      const el = els[0];
      const box = await el.boundingBox();
      size = location = box;
    }

    if (this.helpers['WebDriver'] || this.helpers['Appium']) {
      const el = els[0];
      location = await el.getLocation();
      size = await el.getSize();
    }

    if (this.helpers['WebDriverIO']) {
      location = await helper.browser.getLocation(selector);
      size = await helper.browser.getElementSize(selector);
    }
    if (this.helpers['TestCafe']) {
      return await els.boundingClientRect;
    }

    if (!size) {
      throw new Error('Cannot get element size!');
    }

    const bottom = size.height + location.y;
    const right = size.width + location.x;
    const boundingBox = {
      left: location.x,
      top: location.y,
      right: right,
      bottom: bottom,
    };

    this.debugSection('Area', JSON.stringify(boundingBox));

    return boundingBox;
  }

  /**
   * Function for get element coordinates, which should be later excluded from diff comparison
   *
   * @param selector CSS|XPath|ID selector
   * @returns {Promise<{ignoredBox: {left: *, top: *, right: *, bottom: *}}>}
   */
  async _getElementCoordinates(selector) {
    const helper = this._getHelper();
    await helper.waitForVisible(selector);
    const els = await helper._locate(selector);
    let location; let size;

    if (this.helpers['WebDriver'] || this.helpers['Appium']) {
      const el = els[0];
      location = await el.getLocation();
      size = await el.getSize();
    }

    if (!size) {
      throw new Error('Cannot get element size!');
    }

    const bottom = size.height + location.y;
    const right = size.width + location.x;
    const ignoredBox = {
      left: location.x,
      top: location.y,
      right: right,
      bottom: bottom,
    };

    this.debug(`Element: "${selector}" has coordinates: ${JSON.stringify(ignoredBox)}`);

    return ignoredBox;
  }

  /**
   * Function for translate elements coordinates to ignoredBoxes
   *
   * @param options Options ex {ignoredElements: ['#name', '#email']} along with Resemble JS Options, read more here: https://github.com/rsmbl/Resemble.js
   * @returns {Promise<{ignoredBoxes: [{left: *, top: *, right: *, bottom: *},{...}]>}
   */
  async _getIgnoredBoxesFromElements(options) {
    return await Promise.all(options.map(async (item) => await this._getElementCoordinates(item)));
  }

  _getHelper() {
    if (this.helpers['Puppeteer']) {
      return this.helpers['Puppeteer'];
    }

    if (this.helpers['WebDriver']) {
      return this.helpers['WebDriver'];
    }
    if (this.helpers['Appium']) {
      return this.helpers['Appium'];
    }
    if (this.helpers['WebDriverIO']) {
      return this.helpers['WebDriverIO'];
    }
    if (this.helpers['TestCafe']) {
      return this.helpers['TestCafe'];
    }

    if (this.helpers['Playwright']) {
      return this.helpers['Playwright'];
    }

    throw new Error('No matching helper found. Supported helpers: Playwright/WebDriver/Appium/Puppeteer/TestCafe');
  }
}

module.exports = ResembleHelper;
