const DebugCatcher = require('../tools/debugCatcher');

Feature('Global set: prepareBaseImage: undefined');

Scenario(
  'TestState:2 config = undefined, options = undefined, baseImageExists = false',
  async ({ I }) => {
    I.say('New base image will be created');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('1.png');
    await I.seeVisualDiff('1.png');
    const messageOutput = debugCatcher.messages;
    I.assertStringIncludes(
      messageOutput,
      'Existing base image with name 1.png was not found.',
    );
    I.assertStringIncludes(messageOutput, 'Base image: 1.png is created.');
  },
);

Scenario(
  'TestState:1 config = undefined, options = undefined, baseImageExists = true',
  async ({ I }) => {
    I.say('Images will be compared');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('1.png');
    await I.seeVisualDiff('1.png');
    const messageOutput = debugCatcher.messages;
    I.assertStringIncludes(
      messageOutput,
      'Found existing base image: 1.png and use it for compare.',
    );
  },
);

Scenario(
  'TestState:3 config = undefined, options = true, baseImageExists = true',
  async ({ I }) => {
    I.say('New base image will be created');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('1.png');
    await I.seeVisualDiff('1.png', { prepareBaseImage: true });
    const messageOutput = debugCatcher.messages;
    I.assertStringIncludes(
      messageOutput,
      'Test option is set as: prepareBaseImage = true',
    );
    I.assertStringIncludes(messageOutput, 'Base image: 1.png is created.');
  },
);

Scenario(
  'TestState:5 config = undefined, options = false, baseImageExists = true',
  async ({ I }) => {
    I.say('Images will be compared');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('1.png');
    await I.seeVisualDiff('1.png', { prepareBaseImage: false });
    const messageOutput = debugCatcher.messages;
    I.assertStringIncludes(messageOutput, 'Diff Image File Saved');
  },
);

Scenario(
  'TestState:4 config = undefined, options = true, baseImageExists = false',
  async ({ I }) => {
    I.say('New base image will be created');
    const debugCatcher = new DebugCatcher();
    const path = './tests/screenshots/base/1.png';

    await I.deleteScreenshot(path);

    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('1.png');
    await I.seeVisualDiff('1.png', { prepareBaseImage: true });
    const messageOutput = debugCatcher.messages;
    I.assertStringIncludes(
      messageOutput,
      'Existing base image with name 1.png was not found.',
    );
    I.assertStringIncludes(messageOutput, 'Base image: 1.png is created.');
  },
);

Scenario(
  'TestState:6 config = undefined, options = false, baseImageExists = false',
  async ({ I }) => {
    I.say('Error will be shown');

    const path = './tests/screenshots/base/1.png';
    await I.deleteScreenshot(path);

    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('1.png');
    await I.seeVisualDiff('1.png', { prepareBaseImage: false });
  },
);
