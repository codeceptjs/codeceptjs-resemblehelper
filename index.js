const resemble = require("resemblejs");
const fs = require('fs');
const assert = require('assert');
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;
const AWS = require('aws-sdk');
const path = require('path');

/**
 * Resemble.js helper class for CodeceptJS, this allows screen comparison
 * @author Puneet Kala
 */

class ResembleHelper extends Helper {

  /**
   * Compare Images
   * 
   * @param image1
   * @param image2
   * @param diffImage
   * @param options
   * @returns {Promise<any | never>}
   */
  async _compareImages(image1, image2, diffImage, options) {
    image1 = this.config.baseFolder + image1;
    image2 = this.config.screenshotFolder + image2;

    return new Promise((resolve, reject) => {
      
      resemble.outputSettings({
        boundingBox: options.boundingBox,
        ignoredBox: options.ignoredBox
      });

      this.debug("Tolerance Level Provided " + options.tolerance);
      const tolerance = options.tolerance;

      resemble.compare(image1, image2, options, (err, data) => {
        if (err) {
          reject(err);
        } else {
          if(!data.isSameDimensions) throw new Error("The images are not of same dimensions. Please use images of same dimensions so as to avoid any unexpected results.")
          resolve(data);
          if (data.misMatchPercentage >= tolerance) {
            mkdirp(getDirName(this.config.diffFolder + diffImage), function (err) {
              if (err) return cb(err);
            });
            fs.writeFile(this.config.diffFolder + diffImage + '.png', data.getBuffer(), (err, data) => {
              if (err) {
                throw new Error(this.err);
              }
              else {
                  const diffImagePath = path.join(process.cwd(), this.config.diffFolder + diffImage + '.png');
                  this.debug("Diff Image File Saved to: " + diffImagePath);
              }
            });
          }
        }
      });
    });
  }

  /**
   *
   * @param image1
   * @param options
   * @returns {Promise<*>}
   */
  async _fetchMisMatchPercentage(image1, options) {
    const image2 = image1;
    const diffImage = "Diff_" + image1.split(".")[0];
    const result = this._compareImages(image1, image2, diffImage, options);
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
    if(this.helpers['Puppeteer']){
      const configuration = this.config;

      await helper.waitForVisible(selector);
      const els = await helper._locate(selector);
      if (!els.length) throw new Error(`Element ${selector} couldn't be located`);
      const el = els[0];

      await el.screenshot({
        path: configuration.screenshotFolder + name + '.png'
      });
    } else if (this.helpers['WebDriver']) {
      const configuration = this.config;

      await helper.waitForVisible(selector);
      const els = await helper._locate(selector);
      if (!els.length) throw new Error(`Element ${selector} couldn't be located`);
      const el = els[0];

      await el.saveScreenshot(configuration.screenshotFolder + name + '.png');
  }
    else throw new Error("Method only works with Puppeteer and WebDriver helpers.");
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
    const diffImage = "Diff_" + baseImage.split(".")[0] + ".png";

    if(allure !== undefined && misMatch >= tolerance) {
      allure.addAttachment('Base Image', fs.readFileSync(this.config.baseFolder + baseImage), 'image/png');
      allure.addAttachment('Screenshot Image', fs.readFileSync(this.config.screenshotFolder + baseImage), 'image/png');
      allure.addAttachment('Diff Image', fs.readFileSync(this.config.diffFolder + diffImage), 'image/png');
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
   * @param ifBaseImage - tells if the prepareBaseImage is true or false. If false, then it won't upload the baseImage.
   * @returns {Promise<void>}
   */

  async _upload(accessKeyId, secretAccessKey, region, bucketName, baseImage, ifBaseImage) {
      console.log("Starting Upload... ");
      const s3 = new AWS.S3({
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
          region: region
      });
      fs.readFile(this.config.screenshotFolder + baseImage, (err, data) => {
          if(err) throw err;
          let base64data = new Buffer(data, 'binary');
          const params = {
              Bucket: bucketName,
              Key: `output/${baseImage}`,
              Body: base64data
          };
          s3.upload(params, (uerr, data) => {
              if(uerr) throw uerr;
              console.log(`Screenshot Image uploaded successfully at ${data.Location}`);
          });
      });
      fs.readFile(this.config.diffFolder + "Diff_" + baseImage, (err, data) => {
          if(err) console.log("Diff image not generated");
          else {
              let base64data = new Buffer(data, 'binary');
              const params = {
                  Bucket: bucketName,
                  Key: `diff/Diff_${baseImage}`,
                  Body: base64data
              };
              s3.upload(params, (uerr, data) => {
                  if(uerr) throw uerr;
                  console.log(`Diff Image uploaded successfully at ${data.Location}`)
              });
          }
      });
      if(ifBaseImage) {
          fs.readFile(this.config.baseFolder + baseImage, (err, data) => {
              if(err) throw err;
              else {
                  let base64data = new Buffer(data, 'binary');
                  const params = {
                      Bucket: bucketName,
                      Key: `base/${baseImage}`,
                      Body: base64data
                  };
                  s3.upload(params, (uerr, data) => {
                      if(uerr) throw uerr;
                      console.log(`Base Image uploaded at ${data.Location}`)
                  });
              }
          });
      }
      else {
          console.log("Not Uploading base Image");
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
      console.log("Starting Download...");
      const s3 = new AWS.S3({
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
          region: region
      });
      const params = {
          Bucket: bucketName,
          Key: `base/${baseImage}`
      };
      return new Promise((resolve, reject) => {
          s3.getObject(params, (err, data) => {
              if(err) console.error(err);
              console.log(this.config.baseFolder + baseImage);
              fs.writeFileSync(this.config.baseFolder + baseImage, data.Body);
              resolve("File Downloaded Successfully");
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
    if (options == undefined) {
      options = {};
      options.tolerance = 0;
    }

    const awsC = this.config.aws;

    if (awsC !== undefined && options.prepareBaseImage === false) {
        await this._download(awsC.accessKeyId, awsC.secretAccessKey, awsC.region, awsC.bucketName, baseImage);
    }

    if (options.prepareBaseImage !== undefined && options.prepareBaseImage) {
      await this._prepareBaseImage(baseImage);
    }

    const misMatch = await this._fetchMisMatchPercentage(baseImage, options);

    this._addAttachment(baseImage, misMatch, options.tolerance);

    if(awsC !== undefined) {
        let ifUpload = options.prepareBaseImage === false ? false : true;
        await this._upload(awsC.accessKeyId, awsC.secretAccessKey, awsC.region, awsC.bucketName, baseImage, ifUpload)
    }

    this.debug("MisMatch Percentage Calculated is " + misMatch);
    assert(misMatch <= options.tolerance, "MissMatch Percentage " + misMatch);
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

    if (options == undefined) {
      options = {};
      options.tolerance = 0;
    }

    const awsC = this.config.aws;

    if (awsC !== undefined && options.prepareBaseImage === false) {
        await this._download(awsC.accessKeyId, awsC.secretAccessKey, awsC.region, awsC.bucketName, baseImage);
    }

    if (options.prepareBaseImage !== undefined && options.prepareBaseImage) {
      await this._prepareBaseImage(baseImage);
    }

    options.boundingBox = await this._getBoundingBox(selector);
    const misMatch = await this._fetchMisMatchPercentage(baseImage, options);

    this._addAttachment(baseImage, misMatch, options.tolerance);
    
    if(awsC !== undefined) {
        let ifUpload = options.prepareBaseImage === false ? false : true;
        await this._upload(awsC.accessKeyId, awsC.secretAccessKey, awsC.region, awsC.bucketName, baseImage, ifUpload)
    }

    this.debug("MisMatch Percentage Calculated is " + misMatch);
    assert(misMatch <= options.tolerance, "MissMatch Percentage " + misMatch);
  }

  /**
   * Function to prepare Base Images from Screenshots
   *
   * @param screenShotImage  Name of the screenshot Image (Screenshot Image Path is taken from Configuration)
   */
  async _prepareBaseImage(screenShotImage) {
    const configuration = this.config;

    await this._createDir(configuration.baseFolder + screenShotImage);

    fs.access(configuration.screenshotFolder + screenShotImage, fs.constants.F_OK | fs.constants.W_OK, (err) => {
      if (err) {
        throw new Error(
          `${configuration.screenshotFolder + screenShotImage} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}`);
      }
    });

    fs.access(configuration.baseFolder, fs.constants.F_OK | fs.constants.W_OK, (err) => {
      if (err) {
        throw new Error(
          `${configuration.baseFolder} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}`);
      }
    });

    fs.copyFileSync(configuration.screenshotFolder + screenShotImage, configuration.baseFolder + screenShotImage);
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
   * Function to fetch Bounding box for an element, fetched using selector
   *
   * @param selector CSS|XPath|ID selector
   * @returns {Promise<{boundingBox: {left: *, top: *, right: *, bottom: *}}>}
   */
  async _getBoundingBox(selector) {
    const helper = this._getHelper();
    await helper.waitForVisible(selector);
    const els = await helper._locate(selector);
    if (!els.length) throw new Error(`Element ${selector} couldn't be located`);
    const el = els[0];

    let location, size;

    if (this.helpers['Puppeteer']) {
      const box = await el.boundingBox();      
      size = location = box;
    }

    if (this.helpers['WebDriver'] || this.helpers['Appium']) {
      location = await el.getLocation();
      size = await el.getSize();
    } 
    
    if (this.helpers['WebDriverIO']) {
      location = await helper.browser.getLocation(selector);
      size = await helper.browser.getElementSize(selector);
    }

    const bottom = size.height + location.y;
    const right = size.width + location.x;
    const boundingBox = {
      left: location.x,
      top: location.y,
      right: right,
      bottom: bottom
    };

    this.debugSection('Area', JSON.stringify(boundingBox));

    return boundingBox;
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

    throw new Error('No matching helper found. Supported helpers: WebDriver/Appium/Puppeteer');
  }
}
module.exports = ResembleHelper;