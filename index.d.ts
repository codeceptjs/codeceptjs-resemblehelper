export = ResembleHelper;
/**
 * Resemble.js helper class for CodeceptJS, this allows screen comparison
 * @author Puneet Kala
 */
declare class ResembleHelper {
    constructor(config: any);
    baseFolder: any;
    diffFolder: any;
    screenshotFolder: string;
    prepareBaseImage: any;
    resolvePath(folderPath: any): any;
    /**
     * Compare Images
     *
     * @param image
     * @param options
     * @returns {Promise<resolve | reject>}
     */
    _compareImages(image: any, options: any): Promise<any | any>;
    /**
     *
     * @param image
     * @param options
     * @returns {Promise<*>}
     */
    _fetchMisMatchPercentage(image: any, options: any): Promise<any>;
    /**
     * Take screenshot of individual element.
     * @param selector selector of the element to be screenshotted
     * @param name name of the image
     * @returns {Promise<void>}
     */
    screenshotElement(selector: any, name: any): Promise<void>;
    /**
     * This method attaches image attachments of the base, screenshot and diff to the allure reporter when the mismatch exceeds tolerance.
     * @param baseImage
     * @param misMatch
     * @param options
     * @returns {Promise<void>}
     */
    _addAttachment(baseImage: any, misMatch: any, options: any): Promise<void>;
    /**
     * This method attaches context, and images to Mochawesome reporter when the mismatch exceeds tolerance.
     * @param baseImage
     * @param misMatch
     * @param options
     * @returns {Promise<void>}
     */
    _addMochaContext(baseImage: any, misMatch: any, options: any): Promise<void>;
    /**
     * This method uploads the diff and screenshot images into the bucket with diff image under bucketName/diff/diffImage and the screenshot image as
     * bucketName/output/ssImage
     * @param accessKeyId
     * @param secretAccessKey
     * @param region
     * @param bucketName
     * @param baseImage
     * @param options
     * @returns {Promise<void>}
     */
    _upload(accessKeyId: any, secretAccessKey: any, region: any, bucketName: any, baseImage: any, options: any): Promise<void>;
    /**
     * This method downloads base images from specified bucket into the base folder as mentioned in config file.
     * @param accessKeyId
     * @param secretAccessKey
     * @param region
     * @param bucketName
     * @param baseImage
     * @param options
     * @returns {Promise<void>}
     */
    _download(accessKeyId: any, secretAccessKey: any, region: any, bucketName: any, baseImage: any, options: any): Promise<void>;
    /**
     * Check Visual Difference for Base and Screenshot Image
     * @param baseImage         Name of the Base Image (Base Image path is taken from Configuration)
     * @param {any} [options]           Options ex {prepareBaseImage: true, tolerance: 5} along with Resemble JS Options, read more here: https://github.com/rsmbl/Resemble.js
     * @returns {Promise<void>}
     */
    seeVisualDiff(baseImage: any, options?: any): Promise<void>;
    /**
     * See Visual Diff for an Element on a Page
     *
     * @param selector   Selector which has to be compared expects these -> CSS|XPath|ID
     * @param baseImage  Base Image for comparison
     * @param {any} [options]    Options ex {prepareBaseImage: true, tolerance: 5} along with Resemble JS Options, read more here: https://github.com/rsmbl/Resemble.js
     * @returns {Promise<void>}
     */
    seeVisualDiffForElement(selector: any, baseImage: any, options?: any): Promise<void>;
    _assertVisualDiff(selector: any, baseImage: any, options: any): Promise<void>;
    /**
     * Function to prepare Base Images from Screenshots
     *
     * @param screenShotImage  Name of the screenshot Image (Screenshot Image Path is taken from Configuration)
     * @param options
     */
    _prepareBaseImage(screenShotImage: any, options: any): Promise<void>;
    /**
     * Function to create Directory
     * @param directory
     * @returns {Promise<void>}
     * @private
     */
    private _createDir;
    /**
     * Function to fetch Bounding box for an element, fetched using selector
     *
     * @param selector CSS|XPath|ID selector
     * @returns {Promise<{boundingBox: {left: *, top: *, right: *, bottom: *}}>}
     */
    _getBoundingBox(selector: any): Promise<{
        boundingBox: {
            left: any;
            top: any;
            right: any;
            bottom: any;
        };
    }>;
    _getHelper(): any;
    /**
     * Returns the final name of the expected base image, without a path
     * @param image Name of the base-image, without path
     * @param options Helper options
     * @returns {string}
     */
    _getBaseImageName(image: any, options: any): string;
    /**
     * Returns the path to the expected base image
     * @param image Name of the base-image, without path
     * @param options Helper options
     * @returns {string}
     */
    _getBaseImagePath(image: any, options: any): string;
    /**
     * Returns the path to the actual screenshot image
     * @param image Name of the image, without path
     * @returns {string}
     */
    _getActualImagePath(image: any): string;
    /**
     * Returns the path to the image that displays differences between base and actual image.
     * @param image Name of the image, without path
     * @returns {string}
     */
    _getDiffImagePath(image: any): string;
    /**
     * Returns the final `prepareBaseImage` flag after evaluating options and config values
     * @param options Helper options
     * @returns {boolean}
     */
    _getPrepareBaseImage(options: any): boolean;
}
