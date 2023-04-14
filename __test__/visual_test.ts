const { I } = inject()
Feature('visual tests');

Before(() => {
    I.amOnPage('https://codecept.io/helpers/Playwright/')
})

Scenario('seeVisualDiff',  () => {
    I.saveScreenshot('Playwright_doc.png');
    I.seeVisualDiff('Playwright_doc.png', {prepareBaseImage: false, tolerance: 0})
});

Scenario('seeVisualDiffForElement',  () => {
    I.saveElementScreenshot('h2#playwright','element.png');
    I.seeVisualDiffForElement('h2#playwright','element.png', {prepareBaseImage: false, tolerance: 0})
});
