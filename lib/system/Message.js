const { getContentType, jidNormalizedUser } = require('@whiskeysockets/baileys');
const Base = require('../Base');
const ReplyMessage = require('../ReplyMessage');
const config = require('../../config');
const { writeExifWebp } = require("../exif");
const { fromBuffer } = require('file-type');
const { getBuffer } = require("../utils");
const { getStatus, getMessage } = require("../database");
const { wawe, MediaUrls, createInteractiveMessage } = require("../functions");

class Message extends Base {
    constructor(client, data) {
        super(client);
        if (data) { this.patch(data);
        }
    }

    patch(data) {
        this.id = data.key?.id;
        this.jid = this.chat = data.key?.remoteJid;
        this.fromMe = data.key?.fromMe;
        this.sender = jidNormalizedUser(this.fromMe && this.client.user.id || this.participant || data.key.participant || this.chat || '');
        this.pushName = data.pushName || this.client.user.name || '';
        this.message = this.text = data.message?.extendedTextMessage?.text || data.message?.imageMessage?.caption || data.message?.videoMessage?.caption || data.message?.listResponseMessage?.singleSelectReply?.selectedRowId || data.message?.buttonsResponseMessage?.selectedButtonId || data.message?.templateButtonReplyMessage?.selectedId || data.message?.editedMessage?.message?.protocolMessage?.editedMessage?.conversation || data.message?.conversation;
        this.data = data;
        this.type = getContentType(data.message);
        this.msg = data.message[this.type];
        this.reply_message = this.quoted = this.msg?.contextInfo?.quotedMessage ? new ReplyMessage(this.client, { chat: this.chat, msg: this.msg, ...this.msg.contextInfo }) : false;
        this.mention = this.data.message[this.type]?.contextInfo?.mentionedJid || false;
        this.isGroup = this.chat.endsWith('@g.us');
        this.isPm = this.chat.endsWith('@s.whatsapp.net');
        this.isBot = this.id.startsWith('BAE5') && this.id.length === 16;
        const sudo = config.SUDO.split(',') || config.SUDO + ',0';
	this.sudo = [jidNormalizedUser(this.client.user.id),...sudo].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
	this.isSudo = this.sudo.includes(this.sender);
        return super.patch(data);
    }

    async reply(text, options) {
        const message = await this.client.sendMessage(this.jid, { text }, { quoted: this.data, ...options });
        return new Message(this.client, message);
    }

    async delete() {
        return await this.client.sendMessage(this.jid, { delete: { ...this.data.key, participant: this.sender } });
    }

    async edit(conversation) {
        return await this.client.relayMessage(this.jid, { protocolMessage: { key: this.data.key, type: 14, editedMessage: { conversation } } }, {});
    }

    async forwardMessage(jid, content, opt = {}) {
	    return await this.client.sendMessage(jid, { forward: content, ...opt }, { quoted: opt.quoted });
    };

    async sendSticker(jid, content, opt = { packname: "Badan", author: "Ser", fileName: "Badan-Ser" }) {
	    const { data, mime } = await this.client.getFile(content);
	    if (mime === "image/webp") {
		    const buff = await writeExifWebp(data, opt);
		    await this.client.sendMessage(
			    jid,
			    { sticker: { url: buff },...opt },
			    opt
			    );
	    } else {
		    const mimePrefix = mime.split("/")[0];
		    if (mimePrefix === "video" || mimePrefix === "image") {
			    await this.client.sendImageAsSticker(jid, content, opt);
		    } else {
			    throw new Error(`Unsupported MIME type: ${mime}`);
		    }
	    };
    }

    async sendFromUrl(url, options = {}) {
        let buff = await getBuffer(url);
        let mime = await fromBuffer(buff);
        let type = mime.mime.split("/")[0];
        if (type === "audio") {
          options.mimetype = "audio/mpeg";
        }
        if (type === "application") type = "document";
        return this.client.sendMessage(
          this.jid,
          { [type]: buff, ...options },
          { ...options }
        );
    }

    async sendMention(jid) {
        let m = this;
        const status = await getStatus(m.client.user.id, "mention");
        if (!status) return;
        const kk = await getMessage(m.client.user.id, "mention");
        let text = kk.message
        const types = ['type/image', 'type/video', 'type/audio', 'type/gif']
        const jsonArray = text.match(/({.*})/g);
        let msg = text.replace(jsonArray, '');
        let type = 'text',
         message = {
          contextInfo: {}
         };
        for (const i in types) {
         if (msg.match(types[i])) {
          type = msg.match(types[i])[0].replace('type/', '');
          break;
         }
        }
        if (jsonArray) message = JSON.parse(jsonArray[0]);
        if (message.linkPreview) {
         message.contextInfo = message.contextInfo ? message.contextInfo : {};
         message.contextInfo.externalAdReply = message.linkPreview;
        }
        if (message.contextInfo?.externalAdReply?.thumbnail) {
          message.contextInfo.externalAdReply.thumbnailUrl = message?.contextInfo?.externalAdReply?.thumbnail;
          delete message.contextInfo.externalAdReply.thumbnail;
        }
        delete message.linkPreview;
        let URLS = MediaUrls(msg);
        if (type != 'text' && URLS[0]) {
         URLS.map(url => msg = msg.replace(url, ''));
         msg = msg.replace('type/', '').replace(type, '').replace(/,/g, '').trim();
         let URL = URLS[Math.floor(Math.random() * URLS.length)];
         if (type == 'image') {
          message.mimetype = 'image/jpg'
          message.image = {
           url: URL
          }
          return await m.client.sendMessage(jid, message, { quoted: message.quoted })
         } else if (type == 'video') {
          message.mimetype = 'video/mp4'
          message.video = {
           url: URL
          }
          return await m.client.sendMessage(jid, message, { quoted: message.quoted })
         } else if (type == 'audio') {
          message.mimetype = 'audio/mpeg'
          let buff = await getBuffer(URL)
          let b = await wawe(buff);
          message.audio = b
          return await m.client.sendMessage(jid, message, { quoted: message.quoted })
         } else if (type == 'gif') {
          message.gifPlayback = true;
          message.video = {
           url: URL
          }
          return await m.client.sendMessage(jid, message, { quoted: message.quoted })
         }
        } else {
         if (msg.includes('&sender')) {
          msg = msg.replace('&sender', '@' + m.number);
          message.contextInfo.mentionedJid = [m.sender];
         }
         message.text = msg;
         return await m.client.sendMessage(jid, message, { quoted: message.quoted })
        }
       }

    async sendAlive(jid) {
    const start = new Date().getTime();
    const kk = await getMessage(this.client.user.id, "alive");
    let ALIVE_DATA = kk.message 
     let msg = {
      contextInfo: {}
     }
     let extractions = ALIVE_DATA.match(/#(.*?)#/g);
     let URLS;
     if (extractions) {
      ALIVE_DATA = ALIVE_DATA.replace(/#([^#]+)#/g, '').trim();
      extractions = extractions.map(m => m.slice(1, -1));
      let arra = [];
      URLS = MediaUrls(ALIVE_DATA);
      msg.contextInfo.externalAdReply = {
       containsAutoReply: true,
       mediaType: 1,
       previewType: "PHOTO"
      };
      extractions.map(extraction => {
       extraction = extraction.replace('\\', '');
       if (extraction.match(/adattribution/gi)) msg.contextInfo.externalAdReply.showAdAttribution = true;
       if (extraction.match(/adreply/gi)) msg.contextInfo.externalAdReply.showAdAttribution = true;
       if (extraction.match(/largerthumbnail/gi)) msg.contextInfo.externalAdReply.renderLargerThumbnail = true;
       if (extraction.match(/largethumb/gi)) msg.contextInfo.externalAdReply.renderLargerThumbnail = true;
       if (extraction.match(/title/gi)) msg.contextInfo.externalAdReply.title = extraction.replace(/title/gi, '');
       if (extraction.match(/body/gi)) msg.contextInfo.externalAdReply.body = extraction.replace(/body/gi, '');
       if (extraction.match(/thumbnail/gi) && !extraction.match(/largerthumbnail/gi)) msg.contextInfo.externalAdReply.thumbnailUrl = extraction.replace(/thumbnail/gi, '');
       if (extraction.match(/thumb/gi) && !extraction.match(/largerthumbnail/gi) && !extraction.match(/largethumb/gi) && !extraction.match(/thumbnail/gi)) msg.contextInfo.externalAdReply.thumbnailUrl = extraction.replace(/thumb/gi, '');
       if (extraction.match(/sourceurl/gi)) msg.contextInfo.externalAdReply.sourceUrl = extraction.replace(/sourceurl/gi, '');
       if (extraction.match(/mediaurl/gi)) msg.contextInfo.externalAdReply.mediaUrl = extraction.replace(/mediaurl/gi, '');
      });
     } else {
      URLS = MediaUrls(ALIVE_DATA);
     }
     const URL = URLS[Math.floor(Math.random() * URLS.length)];
     let [date, time] = new Date()
            .toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            .split(",");
        const end = new Date().getTime();
        let speed = end - start;
    
        let user = this.pushName;
        let sender = this.sender
     let text = ALIVE_DATA.replace(/&sender/gi, `@${sender.replace(/[^0-9]/g,'')}`).replace(/&user/gi, `${user}`).replace(/&version/gi, `${require("../package.json").version}`).replace(/&prefix/gi, `${config.HANDLER}`).replace(/&mode/gi, `${config.MODE}`).replace(/&time/gi, `${time}`).replace(/&date/gi, `${date}`).replace(/&speed/gi, `${speed}`).replace(/&gif/g, '');
     if (ALIVE_DATA.includes('&sender')) msg.contextInfo.mentionedJid = [sender];
     if (ALIVE_DATA.includes('&gif')) msg.gifPlayback = true;
     if (URL && URL.endsWith('.mp4')) {
     let capt = URLS.map(url => text = text.replace(url, ''));
     let cyp = `${capt}`.trim();
      msg.video = {
        url: URL
       },
       msg.caption = cyp
    
     } else if (URL) {
     let capt = URLS.map(url => text = text.replace(url, ''));
     let cyp = `${capt}`.trim();
      msg.image = {
        url: URL
       },
       msg.caption = cyp
    
     } else msg.text = text.trim();
     return await this.client.sendMessage(jid, msg);
    }

    async sendButton(jid, content) {
    const genMessage = createInteractiveMessage(content);
        await this.client.relayMessage(jid, genMessage.message, {
          messageId: genMessage.key.id,
        });
    }

	    
}

module.exports = Message;
