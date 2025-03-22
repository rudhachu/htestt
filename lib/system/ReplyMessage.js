const { getContentType, jidNormalizedUser } = require('@whiskeysockets/baileys');
const Base = require('../Base');
const config = require('../../config');
const Message = require('./Message');
const fileType = require("file-type");
const { tmpdir } = require("os");
const fs = require("fs");
const { downloadMedia } = require("../DownloadMedia");

class ReplyMessage extends Base {
    constructor(client, data) {
        super(client);
        if (data) this.patch(data);
    }

    patch(data) {
        this.id = data.stanzaId;
        this.sender = jidNormalizedUser(data.participant);
        this.fromMe = this.sender === jidNormalizedUser(this.client.user.id);
        this.chat = this.jid = data.remoteJid || data.chat;
        this.type = getContentType(data.quotedMessage);
        this.msg = data.quotedMessage;
	this.zeta = data;
        this.data = { key: { remoteJid: this.chat, fromMe: this.fromMe, id: this.id, ...(this.isGroup && { participant: this.sender }) }, message: data.quotedMessage };
        this.text = (this.msg[this.type]?.text || this.msg[this.type]?.caption || this.msg.conversation || this.msg[this.type]?.contentText || this.msg[this.type]?.selectedDisplayText || this.msg[this.type]?.title || false);
        this.isGroup = this.chat.endsWith('@g.us');
        this.isPm = this.chat.endsWith('@s.whatsapp.net');
        const sudo = config.SUDO.split(',') || config.SUDO + ',0';
	    this.isSudo = [jidNormalizedUser(this.client.user.id), ...sudo].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(this.sender);
        return super.patch(data);
    }
    
    async download(file) {
        const buffer = await downloadMedia(this.data.message, file);
	return buffer; 
    }

    async delete() {
        return await this.client.sendMessage(this.chat, { delete: this.data.key });
    }
	
    async downloadMediaMessage() {
        const buff = await this.download();
        const type = await fileType.fromBuffer(buff);
        await fs.promises.writeFile("./media." + type.ext, buff);
        return "./media." + type.ext;
  }
}

module.exports = ReplyMessage;
