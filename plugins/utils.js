const { Badan, mode, sendUrl } = require('../lib/');
const { setMessage, getMessage, delMessage, getStatus, toggleStatus } = require("../lib/database");

Badan({
	pattern: "alive",
        fromMe: mode,
        desc: "alive message",
        type: "user",
}, async (message, match) => {
	let msg = await getMessage(message.client.user.id, "alive");
	if (match.toLowerCase() == 'get') {
		if (!msg) return await message.reply("_there is no alive set_");
		return await message.reply(msg.message);
	} else if (match.toLowerCase() == 'delete') {
		if (!msg) return await message.reply("_there is no alive set for delete_");
		await delMessage(message.client.user.id, "alive");
		return await message.reply("_alive deleted successfully_");
	} else if (match) {
		await setMessage(message.client.user.id, "alive", match);
        return await message.reply("_alive set successfully_");
	} else if (!match) {
		if (!msg) return await message.reply(`_there is no alive set_\nexample: `);
		return await message.sendAlive(message.jid)
	}
});

Badan({
    pattern: "mention",
    fromMe: true,
    desc: "mention message",
    type: "user",
}, async (message, match) => {
    let status = await getStatus(message.client.user.id, "mention");
    let stat = status ? "on" : "off";
    let replyMsg = `Bot Mention Manager\n\nStatus: ${stat}\n\nAvailable Actions:\n\n- mention get: Get the mention message\n- mention on: Enable mention message\n- mention off: Disable mention message\n- mention delete: Delete the mention message`;

    if (!match) {
      return await message.reply(replyMsg);
    }
    if (match.toLowerCase() == 'get') {
      let msg = await getMessage(message.client.user.id, "mention");
      if (!msg) return await message.reply("_there is no mention set_");
      return message.reply(msg.message);
    }
    if (match.toLowerCase() == 'on' && stat == "off") {
      await toggleStatus(message.client.user.id, "mention", true);
      return await message.reply("_mention enabled_");
    }
    if (match.toLowerCase() == 'off' && stat == "on") {
      await toggleStatus(message.client.user.id, "mention", false);
      return await message.reply("_mention disabled_");
    }
    if (match.toLowerCase() == 'delete') {
      await delMessage(message.client.user.id, "mention");
      return await message.reply("_mention deleted successfully_");
    }
    await setMessage(message.client.user.id, "mention", match);
    return await message.reply("_mention set successfully_");
  }
);

Badan({
	on: "all",
	fromMe: false,
	dontAddCommandList: true,
   },
   async(message) => {
	   try{
		   let admins = message.sudo
		   let mention = message.data.message[message.type]?.contextInfo?.mentionedJid || [];
		   let isOwner = (admins.map((v) => mention.includes(v))).includes(true)
		   if(isOwner == true) {
			   await message.sendMention(message.jid)
		   }
	   }catch(error) {
		   return message.reply(error)
	   }
   });

Badan({
	pattern: "url",
        fromMe: mode,
        desc: "alive message",
        type: "user",
},
async(message)=> {
if (!["videoMessage", "imageMessage", "stickerMessage", "audioMessage"].includes(message.reply_message.type)) return await message.reply("_reply to audio, video, sticker or image_")
await sendUrl(message, message.reply_message)
});

Badan({
    pattern: "welcome",
    fromMe: true,
    desc: "welcome message",
    type: "user",
}, async (message, match) => {
    let status = await getStatus(message.jid, "welcome");
    let stat = status ? "on" : "off";
    if (!match) {
      return await message.reply("check formats: badan-ser.xyz");
    }
    if (match.toLowerCase() == 'get') {
      let msg = await getMessage(message.jid, "welcome");
      if (!msg) return await message.reply("_there is no welcome set_");
      return message.reply(msg.message);
    }
    if (match.toLowerCase() == 'on') {
    if (stat == "on") return await message.reply("_already enabled_")
      await toggleStatus(message.jid, "welcome", true);
      return await message.reply("_welcome enabled_");
    }
    if (match.toLowerCase() == 'off') {
    if (stat == "off") return await message.reply("_already disabled_")
      await toggleStatus(message.jid, "welcome", false);
      return await message.reply("_welcome disabled_");
    }
    if (match.toLowerCase() == 'delete') {
      await delMessage(message.jid, "welcome");
      return await message.reply("_welcome deleted successfully_");
    }
    await setMessage(message.jid, "welcome", match);
    return await message.reply("_welcome set successfully_");
  }
);

Badan({
    pattern: "goodbye",
    fromMe: true,
    desc: "goodbye message",
    type: "user",
}, async (message, match) => {
    let status = await getStatus(message.jid, "goodbye");
    let stat = status ? "on" : "off";
    if (!match) {
      return await message.reply("check formats: badan-ser.xyz");
    }
    if (match.toLowerCase() == 'get') {
      let msg = await getMessage(message.jid, "goodbye");
      if (!msg) return await message.reply("_there is no goodbye set_");
      return message.reply(msg.message);
    }
    if (match.toLowerCase() == 'on') {
    if (stat == "on") return await message.reply("_already enabled_")
      await toggleStatus(message.jid, "goodbye", true);
      return await message.reply("_goodbye enabled_");
    }
    if (match.toLowerCase() == 'off') {
    if (stat == "off") return await message.reply("_already disabled_")
      await toggleStatus(message.jid, "goodbye", false);
      return await message.reply("_goodbye disabled_");
    }
    if (match.toLowerCase() == 'delete') {
      await delMessage(message.jid, "goodbye");
      return await message.reply("_goodbye deleted successfully_");
    }
    await setMessage(message.jid, "goodbye", match);
    return await message.reply("_goodbye set successfully_");
  }
);
