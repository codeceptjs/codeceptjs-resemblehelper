const DebugCatcher = require('../tools/debugCatcher');

Feature('Global set: prepareBaseImage: true');

Scenario(
  'R8 config = true, options = undefined, baseImageExists = false',
  async ({ I }) => {
    I.say('New base image will be created');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');

    I.saveScreenshot('2.png');
    await I.seeVisualDiff('2.png');
    const messageOutput = debugCatcher.messages;
    I.assertContain(
      messageOutput,
      'Existing base image with name 2.png was not found.',
    );
    I.assertContain(messageOutput, 'Base image: 2.png is created.');
  },
);

Scenario(
  'R7 config = true, options = undefined, baseImageExists = true',
  async ({ I }) => {
    I.say('New base image will be created');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('2.png');
    await I.seeVisualDiff('2.png');
    const messageOutput = debugCatcher.messages;
    I.assertContain(
      messageOutput,
      'Global config is set as: prepareBaseImage = true',
    );
    I.assertContain(messageOutput, 'Base image: 2.png is created.');
  },
);

Scenario(
  'R9 config = true, options = true, baseImageExists = true',
  async ({ I }) => {
    I.say('New base image will be created');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('2.png');
    await I.seeVisualDiff('2.png', { prepareBaseImage: true });
    const messageOutput = debugCatcher.messages;
    I.assertContain(
      messageOutput,
      'Test option is set as: prepareBaseImage = true',
    );
    I.assertContain(messageOutput, 'Base image: 2.png is created.');
  },
);

Scenario(
  'R11 config = true, options = false, baseImageExists = true',
  async ({ I }) => {
    I.say('Images will be compared');
    const debugCatcher = new DebugCatcher();
    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('2.png');
    await I.seeVisualDiff('2.png', { prepareBaseImage: false });
    const messageOutput = debugCatcher.messages;
    I.assertContain(messageOutput, 'Diff Image File Saved');
  },
);

Scenario(
  'R10 config = true, options = true, baseImageExists = false',
  async ({ I }) => {
    I.say('New base image will be created');
    const debugCatcher = new DebugCatcher();

    const path = './tests/screenshots/base/2.png';

    await I.deleteScreenshot(path);

    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('2.png');
    await I.seeVisualDiff('2.png', { prepareBaseImage: true });
    const messageOutput = debugCatcher.messages;
    I.assertContain(
      messageOutput,
      'Existing base image with name 2.png was not found.',
    );
    I.assertContain(messageOutput, 'Base image: 2.png is created.');
  },
);

Scenario(
  'R12 config = true, options = false, baseImageExists = false',
  async ({ I }) => {
    I.say('Error will be shown');

    const path = './tests/screenshots/base/2.png';

    await I.deleteScreenshot(path);

    I.amOnPage('https://the-internet.herokuapp.com');
    I.saveScreenshot('2.png');
    await I.seeVisualDiff('2.png', { prepareBaseImage: false });
  },
);
