const { Helper } = require("codeceptjs");
const resemble = require("resemblejs");
const fs = require("fs");
const assert = require("assert");
const mkdirp = require("mkdirp");
const getDirName = require("path").dirname;
const AWS = require("aws-sdk");
const path = require("path");
const sizeOf = require("image-size");
const Container = require("codeceptjs/lib/container");
const supportedHelper = ["Playwright", "Puppeteer", "WebDriver", "TestCafe", "Appium"];
let outputDir: string;

/**
 * Resemble.js helper class for CodeceptJS, this allows screen comparison
 * @author Puneet Kala
 */

interface Config {
	baseFolder: string;
	diffFolder: string;
	screenshotFolder: string;
	prepareBaseImage: string;
}

interface Options {
	tolerance?: any;
	ignoredBox?: any;
	boundingBox?: any;
	needsSameDimension?: boolean;
	outputSettings?: any;
	prepareBaseImage?: boolean;
	compareWithImage?: any;
}

interface Endpoint {
	/**
	 * The host portion of the endpoint including the port, e.g., example.com:80.
	 */
	host: string;
	/**
	 * The host portion of the endpoint, e.g., example.com.
	 */
	hostname: string;
	/**
	 * The full URL of the endpoint.
	 */
	href: string;
	/**
	 * The port of the endpoint.
	 */
	port: number;
	/**
	 * The protocol (http or https) of the endpoint URL.
	 */
	protocol: string;
}

class ResembleHelper extends Helper {
	baseFolder: string;
	diffFolder: string;
	screenshotFolder?: string;
	prepareBaseImage?: boolean;
	config?: any;

	constructor(config: any) {
		// @ts-ignore
		super(config);
		outputDir = require("codeceptjs").config.get().output || "output";
		this.baseFolder = this.resolvePath(config.baseFolder);
		this.diffFolder = this.resolvePath(config.diffFolder);
		this.screenshotFolder = this.resolvePath(config.screenshotFolder || "output");
		this.prepareBaseImage = config.prepareBaseImage;
	}

	resolvePath(folderPath: string) {
		if (!path.isAbsolute(folderPath)) {
			return `${path.resolve(folderPath)}/`;
		}
		return folderPath;
	}

	_resolveRelativePath(folderPath: string) {
		let absolutePathOfImage = folderPath;
		if (!path.isAbsolute(absolutePathOfImage)) {
			absolutePathOfImage = `${path.resolve(outputDir, absolutePathOfImage)}/`;
		}
		let absolutePathOfReportFolder = outputDir;
		// support mocha
		if (Container.mocha() && typeof Container.mocha().options.reporterOptions.reportDir !== "undefined") {
			absolutePathOfReportFolder = Container.mocha().options.reporterOptions.reportDir;
		}
		// support mocha-multi-reporters
		if (
			Container.mocha() &&
			typeof Container.mocha().options.reporterOptions.mochawesomeReporterOptions?.reportDir !== "undefined"
		) {
			absolutePathOfReportFolder = Container.mocha().options.reporterOptions.mochawesomeReporterOptions.reportDir;
		}
		return path.relative(absolutePathOfReportFolder, absolutePathOfImage);
	}

	/**
	 * Compare Images
	 *
	 * @param image
	 * @param options
	 * @returns {Promise<resolve | reject>}
	 */
	async _compareImages(image: any, options: Options) {
		const baseImage = this._getBaseImagePath(image, options);
		const actualImage = this._getActualImagePath(image);
		const diffImage = this._getDiffImagePath(image);

		// check whether the base and the screenshot images are present.
		fs.access(baseImage, fs.constants.F_OK | fs.constants.R_OK, (err: any) => {
			if (err) {
				throw new Error(
					`${baseImage} ${err.code === "ENOENT" ? "base image does not exist" : "base image has an access error"}`,
				);
			}
		});

		fs.access(actualImage, fs.constants.F_OK | fs.constants.R_OK, (err: any) => {
			if (err) {
				throw new Error(
					`${actualImage} ${
						err.code === "ENOENT" ? "screenshot image does not exist" : "screenshot image has an access error"
					}`,
				);
			}
		});

		return new Promise((resolve, reject) => {
			if (!options.outputSettings) {
				options.outputSettings = {};
			}
			if (typeof options.needsSameDimension === "undefined") {
				options.needsSameDimension = true;
			}
			resemble.outputSettings({
				boundingBox: options.boundingBox,
				ignoredBox: options.ignoredBox,
				...options.outputSettings,
			});

			this.debug(`Tolerance Level Provided ${options.tolerance}`);
			const tolerance = options.tolerance;

			resemble.compare(actualImage, baseImage, options, (err: any, data: any) => {
				if (err) {
					reject(err);
				} else {
					if (options.needsSameDimension && !data.isSameDimensions) {
						const dimensions1 = sizeOf(baseImage);
						const dimensions2 = sizeOf(actualImage);
						reject(
							new Error(
								`The base image is of ${dimensions1.height} X ${dimensions1.width} and actual image is of ${dimensions2.height} X ${dimensions2.width}. Please use images of same dimensions so as to avoid any unexpected results.`,
							),
						);
					}
					resolve(data);
					if (data.misMatchPercentage >= tolerance) {
						if (!fs.existsSync(getDirName(diffImage))) {
							fs.mkdirSync(getDirName(diffImage));
						}
						fs.writeFileSync(diffImage, data.getBuffer());
						const diffImagePath = path.join(process.cwd(), diffImage);
						this.debug(`Diff Image File Saved to: ${diffImagePath}`);
					}
				}
			});
		});
	}

	/**
	 *
	 * @param image
	 * @param options
	 * @returns {Promise<*>}
	 */
	async _fetchMisMatchPercentage(image: any, options: Options) {
		const result = this._compareImages(image, options);
		const data: any = await Promise.resolve(result);
		return data.misMatchPercentage;
	}

	/**
	 * Take screenshot of individual element.
	 * @param selector selector of the element to be screenshotted
	 * @param name name of the image
	 * @returns {Promise<void>}
	 */
	async screenshotElement(selector: any, name: string) {
		const helper = this._getHelper();

		if (!helper) throw new Error("Method only works with Playwright, Puppeteer, WebDriver or TestCafe helpers.");

		await helper.waitForVisible(selector);
		const els = await helper._locate(selector);

		if (this.helpers["Puppeteer"] || this.helpers["Playwright"] || this.helpers["WebDriver"]) {
			if (!els.length) throw new Error(`Element ${selector} couldn't be located`);
			const el = els[0];

			if (this.helpers["Puppeteer"] || this.helpers["Playwright"]) {
				await el.screenshot({ path: `${outputDir}/${name}.png` });
			}

			if (this.helpers["WebDriver"]) {
				await el.saveScreenshot(`${this.screenshotFolder}${name}.png`);
			}
		}

		if (this.helpers["TestCafe"]) {
			if (!(await els.count)) throw new Error(`Element ${selector} couldn't be located`);
			const { t } = this.helpers["TestCafe"];

			await t.takeElementScreenshot(els, name);
		}
	}

	/**
	 * This method attaches image attachments of the base, screenshot and diff to the allure reporter when the mismatch exceeds tolerance.
	 * @param baseImage
	 * @param misMatch
	 * @param options
	 * @returns {Promise<void>}
	 */

	async _addAttachment(baseImage: any, misMatch: any, options: Options) {
		const allure: any = require("codeceptjs").container.plugins("allure");

		if (allure !== undefined && misMatch >= options.tolerance) {
			allure.addScreenDiff(
				"Screen Diff",
				fs.readFileSync(this._getBaseImagePath(baseImage, options), { encoding: "base64" }),
				fs.readFileSync(this._getActualImagePath(baseImage), { encoding: "base64" }),
				fs.readFileSync(this._getDiffImagePath(baseImage), { encoding: "base64" }),
			);
		}
	}

	/**
	 * This method attaches context, and images to Mochawesome reporter when the mismatch exceeds tolerance.
	 * @param baseImage
	 * @param misMatch
	 * @param options
	 * @returns {Promise<void>}
	 */

	async _addMochaContext(baseImage: any, misMatch: any, options: any) {
		const mocha = this.helpers["Mochawesome"];

		if (mocha !== undefined && misMatch >= options.tolerance) {
			await mocha.addMochawesomeContext("Base Image");
			await mocha.addMochawesomeContext(this._resolveRelativePath(this._getBaseImagePath(baseImage, options)));
			await mocha.addMochawesomeContext("ScreenShot Image");
			await mocha.addMochawesomeContext(this._resolveRelativePath(this._getActualImagePath(baseImage)));
			await mocha.addMochawesomeContext("Diff Image");
			await mocha.addMochawesomeContext(this._resolveRelativePath(this._getDiffImagePath(baseImage)));
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
	 * @param options
	 * @param {string | Endpoint } [endpoint]
	 * @returns {Promise<void>}
	 */

	async _upload(
		accessKeyId: any,
		secretAccessKey: any,
		region: any,
		bucketName: any,
		baseImage: any,
		options: any,
		endpoint: Endpoint,
	) {
		console.log("Starting Upload... ");
		const s3 = new AWS.S3({
			accessKeyId: accessKeyId,
			secretAccessKey: secretAccessKey,
			region: region,
			endpoint,
		});
		fs.readFile(this._getActualImagePath(baseImage), (err: any, data: any) => {
			if (err) throw err;
			const base64data = new Buffer(data, "binary");
			const params = {
				Bucket: bucketName,
				Key: `output/${baseImage}`,
				Body: base64data,
			};
			s3.upload(params, (uErr: any, uData: { Location: any }) => {
				if (uErr) throw uErr;
				console.log(`Screenshot Image uploaded successfully at ${uData.Location}`);
			});
		});
		fs.readFile(this._getDiffImagePath(baseImage), (err: any, data: any) => {
			if (err) console.log("Diff image not generated");
			else {
				const base64data = new Buffer(data, "binary");
				const params = {
					Bucket: bucketName,
					Key: `diff/Diff_${baseImage}`,
					Body: base64data,
				};
				s3.upload(params, (uErr: any, uData: { Location: any }) => {
					if (uErr) throw uErr;
					console.log(`Diff Image uploaded successfully at ${uData.Location}`);
				});
			}
		});

		// If prepareBaseImage is false, then it won't upload the baseImage. However, this parameter is not considered if the config file has a prepareBaseImage set to true.
		if (this._getPrepareBaseImage(options)) {
			const baseImageName = this._getBaseImageName(baseImage, options);

			fs.readFile(this._getBaseImagePath(baseImage, options), (err: any, data: any) => {
				if (err) throw err;
				else {
					const base64data = new Buffer(data, "binary");
					const params = {
						Bucket: bucketName,
						Key: `base/${baseImageName}`,
						Body: base64data,
					};
					s3.upload(params, (uErr: any, uData: { Location: any }) => {
						if (uErr) throw uErr;
						console.log(`Base Image uploaded at ${uData.Location}`);
					});
				}
			});
		} else {
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
	 * @param options
	 * @param {string | Endpoint } [endpoint]
	 * @returns {Promise<void>}
	 */

	_download(
		accessKeyId: any,
		secretAccessKey: any,
		region: any,
		bucketName: any,
		baseImage: any,
		options: any,
		endpoint: Endpoint,
	) {
		console.log("Starting Download...");
		const baseImageName = this._getBaseImageName(baseImage, options);
		const s3 = new AWS.S3({
			accessKeyId: accessKeyId,
			secretAccessKey: secretAccessKey,
			region: region,
			endpoint,
		});
		const params = {
			Bucket: bucketName,
			Key: `base/${baseImageName}`,
		};
		return new Promise((resolve) => {
			s3.getObject(params, (err: any, data: { Body: any }) => {
				if (err) console.error(err);
				console.log(this._getBaseImagePath(baseImage, options));
				fs.writeFileSync(this._getBaseImagePath(baseImage, options), data.Body);
				resolve("File Downloaded Successfully");
			});
		});
	}

	/**
	 * Check Visual Difference for Base and Screenshot Image
	 * @param baseImage         Name of the Base Image (Base Image path is taken from Configuration)
	 * @param {any} [options]           Options ex {prepareBaseImage: true, tolerance: 5} along with Resemble JS Options, read more here: https://github.com/rsmbl/Resemble.js
	 * @returns {Promise<void>}
	 */
	async seeVisualDiff(baseImage: any, options?: Options) {
		await this._assertVisualDiff(undefined, baseImage, options);
	}

	/**
	 * See Visual Diff for an Element on a Page
	 *
	 * @param selector   Selector which has to be compared expects these -> CSS|XPath|ID
	 * @param baseImage  Base Image for comparison
	 * @param {any} [options]    Options ex {prepareBaseImage: true, tolerance: 5} along with Resemble JS Options, read more here: https://github.com/rsmbl/Resemble.js
	 * @returns {Promise<void>}
	 */
	async seeVisualDiffForElement(selector: any, baseImage: any, options: Options) {
		await this._assertVisualDiff(selector, baseImage, options);
	}

	async _assertVisualDiff(
		selector: undefined,
		baseImage: string,
		options?: { tolerance?: any; boundingBox?: any; skipFailure?: any },
	) {
		let newOptions = options;

		if (!newOptions) {
			newOptions = {};
			newOptions.tolerance = 0;
		}

		const awsC = this.config.aws;

		if (this._getPrepareBaseImage(newOptions)) {
			await this._prepareBaseImage(baseImage, newOptions);
		} else if (awsC !== undefined) {
			await this._download(
				awsC.accessKeyId,
				awsC.secretAccessKey,
				awsC.region,
				awsC.bucketName,
				baseImage,
				options,
				awsC.endpoint,
			);
		}

		// BoundingBox for Playwright not necessary
		if (selector && !this.helpers["Playwright"]) {
			newOptions.boundingBox = await this._getBoundingBox(selector);
		}
		const misMatch = await this._fetchMisMatchPercentage(baseImage, newOptions);
		await this._addAttachment(baseImage, misMatch, newOptions);
		await this._addMochaContext(baseImage, misMatch, newOptions);
		if (awsC !== undefined) {
			await this._upload(
				awsC.accessKeyId,
				awsC.secretAccessKey,
				awsC.region,
				awsC.bucketName,
				baseImage,
				options,
				awsC.endpoint,
			);
		}

		this.debug(`MisMatch Percentage Calculated is ${misMatch} for baseline ${baseImage}`);

		if (!newOptions.skipFailure) {
			assert(
				misMatch <= newOptions.tolerance,
				`Screenshot does not match with the baseline ${baseImage} when MissMatch Percentage is ${misMatch}`,
			);
		}
	}

	/**
	 * Function to prepare Base Images from Screenshots
	 *
	 * @param screenShotImage  Name of the screenshot Image (Screenshot Image Path is taken from Configuration)
	 * @param options
	 */
	async _prepareBaseImage(screenShotImage: string, options: { tolerance?: any; boundingBox?: any; skipFailure?: any }) {
		const baseImage = this._getBaseImagePath(screenShotImage, options);
		const actualImage = this._getActualImagePath(screenShotImage);

		await this._createDir(baseImage);

		fs.access(actualImage, fs.constants.F_OK | fs.constants.W_OK, (err: any) => {
			if (err) {
				throw new Error(`${actualImage} ${err.code === "ENOENT" ? "does not exist" : "is read-only"}`);
			}
		});

		fs.access(this.baseFolder, fs.constants.F_OK | fs.constants.W_OK, (err: any) => {
			if (err) {
				throw new Error(`${this.baseFolder} ${err.code === "ENOENT" ? "does not exist" : "is read-only"}`);
			}
		});

		fs.copyFileSync(actualImage, baseImage);
	}

	/**
	 * Function to create Directory
	 * @param directory
	 * @returns {Promise<void>}
	 * @private
	 */
	_createDir(directory: any) {
		mkdirp.sync(getDirName(directory));
	}

	/**
	 * Function to fetch Bounding box for an element, fetched using selector
	 *
	 * @param selector CSS|XPath|ID selector
	 * @returns {Promise<{boundingBox: {left: *, top: *, right: *, bottom: *}}>}
	 */
	async _getBoundingBox(selector: any) {
		const helper = this._getHelper();
		await helper.waitForVisible(selector);
		const els = await helper._locate(selector);

		if (this.helpers["TestCafe"]) {
			if ((await els.count) !== 1)
				throw new Error(`Element ${selector} couldn't be located or isn't unique on the page`);
		} else {
			if (!els.length) throw new Error(`Element ${selector} couldn't be located`);
		}

		let location;
		let size;

		if (this.helpers["Puppeteer"] || this.helpers["Playwright"]) {
			const el = els[0];
			const box = await el.boundingBox();
			size = location = box;
		}

		if (this.helpers["WebDriver"] || this.helpers["Appium"]) {
			const el = els[0];
			location = await el.getLocation();
			size = await el.getSize();
		}

		if (this.helpers["WebDriverIO"]) {
			location = await helper.browser.getLocation(selector);
			size = await helper.browser.getElementSize(selector);
		}
		if (this.helpers["TestCafe"]) {
			return await els.boundingClientRect;
		}

		if (!size) {
			throw new Error("Cannot get element size!");
		}

		const bottom = size.height + location.y;
		const right = size.width + location.x;
		const boundingBox = {
			left: location.x,
			top: location.y,
			right: right,
			bottom: bottom,
		};

		this.debugSection("Area", JSON.stringify(boundingBox));

		return boundingBox;
	}

	_getHelper() {
		if (this.helpers["Puppeteer"]) {
			return this.helpers["Puppeteer"];
		}

		if (this.helpers["WebDriver"]) {
			return this.helpers["WebDriver"];
		}
		if (this.helpers["Appium"]) {
			return this.helpers["Appium"];
		}
		if (this.helpers["WebDriverIO"]) {
			return this.helpers["WebDriverIO"];
		}
		if (this.helpers["TestCafe"]) {
			return this.helpers["TestCafe"];
		}

		if (this.helpers["Playwright"]) {
			return this.helpers["Playwright"];
		}

		throw Error(`No matching helper found. Supported helpers: ${supportedHelper.join("/")}`);
	}

	/**
	 * Returns the final name of the expected base image, without a path
	 * @param image Name of the base-image, without path
	 * @param options Helper options
	 * @returns {string}
	 */
	_getBaseImageName(image: any, options: { compareWithImage?: any }) {
		return options.compareWithImage ? options.compareWithImage : image;
	}

	/**
	 * Returns the path to the expected base image
	 * @param image Name of the base-image, without path
	 * @param options Helper options
	 * @returns {string}
	 */
	_getBaseImagePath(image: string, options: Options) {
		return this.baseFolder + this._getBaseImageName(image, options);
	}

	/**
	 * Returns the path to the actual screenshot image
	 * @param image Name of the image, without path
	 * @returns {string}
	 */
	_getActualImagePath(image: string) {
		return this.screenshotFolder + image;
	}

	/**
	 * Returns the path to the image that displays differences between base and actual image.
	 * @param image Name of the image, without path
	 * @returns {string}
	 */
	_getDiffImagePath(image: string) {
		const diffImage = `Diff_${image.split(".")[0]}.png`;
		return this.diffFolder + diffImage;
	}

	/**
	 * Returns the final `prepareBaseImage` flag after evaluating options and config values
	 * @param options Helper options
	 * @returns {boolean}
	 */
	_getPrepareBaseImage(options: Options) {
		if ("undefined" !== typeof options.prepareBaseImage) {
			// Cast to bool with `!!` for backwards compatibility
			return !!options.prepareBaseImage;
		} else {
			// Compare with `true` for backwards compatibility
			return true === this.prepareBaseImage;
		}
	}
}

export = ResembleHelper;
