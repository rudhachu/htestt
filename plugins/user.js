const { Badan, mode, formatTime, numToJid, setWarn, removeWarn } = require('../lib/');
const { ANTI_DELETE, SUDO, WARN_COUNT } = require("../config")

Badan({
	pattern: 'ping ?(.*)',
	fromMe: mode,
	desc: 'Bot response in milliseconds.',
	type: 'info'
}, async (message) => {
	const start = new Date().getTime();
	const msg = await message.reply('*ρīnɠ*');
	const end = new Date().getTime();
	const responseTime = end - start;
	await msg.edit(`*ρonɠ*\n*${responseTime} ɱș*`);
});

Badan({
	pattern: 'jid',
	fromMe: mode,
	desc: 'To get remoteJid',
	type: 'whatsapp'
}, async (message) => {
	await message.reply(message.mention[0] ? message.mention[0] : message.reply_message ? message.reply_message.sender : message.jid)
});


Badan({
	pattern: 'uptime',
	fromMe: mode,
	desc: 'Get bots runtime',
	type: 'info'
}, async (message) => {
	await message.reply(formatTime(process.uptime()));
})

Badan({
	on: "delete",
	fromMe: false,
	desc: 'anti delete',
	type: 'whatsapp'
}, async (message) => {
	if (ANTI_DELETE) {
		let msg = await message.client.store.loadMessage(message.messageId);
		let { pushName } = msg.message;
		let name = pushName.trim().replace(/\s+/g, ' ') || "unable to find the name";
		let sudo = numToJid(SUDO.split(',')[0]) || message.client.user.id;
		await message.forwardMessage(sudo, msg.message , { contextInfo: { isFrowarded: false, externalAdReply: { title: "deleted message", body: `from: ${name}`, mediaType: 1, thumbnailUrl: "https://i.imgur.com/xItorgn.jpeg", mediaUrl: "https://github.com/Kingbadan321/Zeta-XD", sourceUrl: "https://github.com/Kingbadan321/Zeta-XD" }}, quoted: msg.message })
	}
});

Badan({
	pattern: 'warn',
	fromMe: true,
	desc: 'To get remoteJid',
	type: 'whatsapp'
}, async (message, match) => {
	await setWarn(message, match, WARN_COUNT)
});

Badan({
	pattern: 'resetwarn',
	fromMe: true,
	desc: 'To get remoteJid',
	type: 'whatsapp'
}, async (message, match) => {
	await removeWarn(message)
});
