const lib = require("../lib/");
const util = require("util");
const config = require("../config");


lib.rudhra({ pattern:'eval', on: "text", fromMe: true, desc :'Runs a server code'}, async (message, match) => {
  if (message.text.startsWith(">")) {
    const m = message;
    try {
      let evaled = await eval(`(async () => { ${message.text.replace(">", "")}})()`);
      if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
      await message.reply(evaled);
    } catch (err) {
      await message.reply(util.format(err));
    }
  }
});

lib.rudhra({ pattern:'eval2', on: "text", fromMe: true, desc :'Runs a server code'}, async (message, match) => {
  if (message.text.startsWith("~")) {
    const m = message;
    try {
      let evaled = await eval(`${message.text.replace("~", "")}`);
      if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
      await message.reply(evaled);
    } catch (err) {
      await message.reply(util.format(err));
    }
  }
});
