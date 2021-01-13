const Helper = require('@codeceptjs/helper');

class DebugCatcher {
  constructor() {
    this.messages = '';
    const orig = Helper.prototype.debug;

    Helper.prototype.debug = (msg) => {
      this.messages += `${msg}\n`;
      orig(msg);
    };
  }
}

module.exports = DebugCatcher;
