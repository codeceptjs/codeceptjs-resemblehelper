const DebugCatcher = require('../tools/debugCatcher');

Feature('Global set: prepareBaseImage: false');

Scenario(
  'TestState:16 config = false, options = true, baseImageExists = false ',
  async ({ I }) => {
    I.say('New base image will be created');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');

    I.saveScreenshot('3.png');
    await I.seeVisualDiff('3.png', { prepareBaseImage: true });
    const messageOutput = debugCatcher.messages;
    I.assertStringIncludes(
      messageOutput,
      'Existing base image with name 3.png was not found.',
    );
    I.assertStringIncludes(messageOutput, 'Base image: 3.png is created.');
  },
);

Scenario(
  'TestState:13 config = false, options = undefined, baseImageExists = true ',
  async ({ I }) => {
    I.say('Images will be compared');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('3.png');
    await I.seeVisualDiff('3.png');
    const messageOutput = debugCatcher.messages;
    I.assertStringIncludes(messageOutput, 'Diff Image File Saved');
  },
);

Scenario(
  'TestState:15 config = false, options = true, baseImageExists = true',
  async ({ I }) => {
    I.say('New base image will be created');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('3.png');
    await I.seeVisualDiff('3.png', { prepareBaseImage: true });
    const messageOutput = debugCatcher.messages;
    I.assertStringIncludes(
      messageOutput,
      'Test option is set as: prepareBaseImage = true',
    );
    I.assertStringIncludes(messageOutput, 'Base image: 3.png is created.');
  },
);

Scenario(
  'TestState:17 config = false, options = false, baseImageExists = true',
  async ({ I }) => {
    I.say('Images will be compared');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('3.png');
    await I.seeVisualDiff('3.png', { prepareBaseImage: false });
    const messageOutput = debugCatcher.messages;
    I.assertStringIncludes(messageOutput, 'Diff Image File Saved');
  },
);

xScenario(
  'TestState:14 config = false, options = undefined, baseImageExists = false',
  async ({ I }) => {
    I.say('Error will be shown');

    const path = './tests/screenshots/base/3.png';

    await I.deleteScreenshot(path);

    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('3.png');
    await I.seeVisualDiff('3.png');
  },
);

xScenario(
  'TestState:18 config = false, options = false, baseImageExists = false',
  async ({ I }) => {
    I.say('Error will be shown');

    const path = './tests/screenshots/base/3.png';

    await I.deleteScreenshot(path);

    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('3.png');
    await I.seeVisualDiff('3.png', { prepareBaseImage: false });
  },
);
