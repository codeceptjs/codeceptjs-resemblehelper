const DebugCatcher = require('../tools/debugCatcher');

Feature('Global set: prepareBaseImage: false');

Scenario(
  'R16 config = false, options = true, baseImageExists = false ',
  async ({ I }) => {
    I.say('New base image will be created');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');

    I.saveScreenshot('3.png');
    await I.seeVisualDiff('3.png', { prepareBaseImage: true });
    const messageOutput = debugCatcher.messages;
    I.assertContain(
      messageOutput,
      'Existing base image with name 3.png was not found.',
    );
    I.assertContain(messageOutput, 'Base image: 3.png is created.');
  },
);

Scenario(
  'R13 config = false, options = undefined, baseImageExists = true ',
  async ({ I }) => {
    I.say('Images will be compared');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('3.png');
    await I.seeVisualDiff('3.png');
    const messageOutput = debugCatcher.messages;
    I.assertContain(messageOutput, 'Diff Image File Saved');
  },
);

Scenario(
  'R15 config = false, options = true, baseImageExists = true',
  async ({ I }) => {
    I.say('New base image will be created');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('3.png');
    await I.seeVisualDiff('3.png', { prepareBaseImage: true });
    const messageOutput = debugCatcher.messages;
    I.assertContain(
      messageOutput,
      'Test option is set as: prepareBaseImage = true',
    );
    I.assertContain(messageOutput, 'Base image: 3.png is created.');
  },
);

Scenario(
  'R17 config = false, options = false, baseImageExists = true',
  async ({ I }) => {
    I.say('Images will be compared');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('3.png');
    await I.seeVisualDiff('3.png', { prepareBaseImage: false });
    const messageOutput = debugCatcher.messages;
    I.assertContain(messageOutput, 'Diff Image File Saved');
  },
);

Scenario(
  'R14 config = false, options = undefined, baseImageExists = false',
  async ({ I }) => {
    I.say('Error will be shown');

    const path = './tests/screenshots/base/3.png';

    await I.deleteScreenshot(path);

    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('3.png');
    await I.seeVisualDiff('3.png');
  },
);

Scenario(
  'R18 config = false, options = false, baseImageExists = false',
  async ({ I }) => {
    I.say('Error will be shown');

    const path = './tests/screenshots/base/3.png';

    await I.deleteScreenshot(path);

    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('3.png');
    await I.seeVisualDiff('3.png', { prepareBaseImage: false });
  },
);
