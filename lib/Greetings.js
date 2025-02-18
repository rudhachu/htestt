const os = require('os');
const { MODE } = require('../config')
const package = require('../package.json');
const { getStatus, getMessage } = require("./database");

function MediaUrls(text) {
        let array = [];
        const regexp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()'@:%_\+.~#?!&//=]*)/gi;
        let urls = text.match(regexp);
        if (urls) {
                urls.map(url => {
                        if (['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webp'].includes(url.split('.').pop().toLowerCase())) {
                                array.push(url);
                        }
                });
                return array;
        } else {
                return false;
        }
}

async function Greetings(data, client) {
    try {
    const participants = data.participants;

    for (const user of participants) {
      switch (data.action) {
        case "add": {
            await send(data, client, data.id, user, "welcome")
          break;
        }
  
        case "remove": {
            await send(data, client, data.id, user, "goodbye")
          break;
        }
      }
    }
    } catch (error) {
    console.log(error)
    }
  }
  

async function send(m, conn, groupId, user, actionType) {
    const status = await getStatus(groupId, actionType);
    if (!status) return;
        const message = await getMessage(groupId, actionType);
        let text = message.message
        let {
                id,
                subject,
                desc,
                size,
                participants
        } = await conn.groupMetadata(groupId)
        let admins = participants.filter(v => v.admin !== null).map(v => v.id).length;
        let msg = {
                contextInfo: {}
        }
        let extractions = text.match(/#(.*?)#/g);
        let URL;
        if (extractions) {
                text = text.replace(/#(.*?)#/g,'');
                extractions = extractions.map(m => m.slice(1, -1));
                URL = MediaUrls(text)[0];
                msg.contextInfo.externalAdReply = {
                        containsAutoReply: true,
                        mediaType: 1,
                        previewType: "PHOTO"
                };
                extractions.map(extraction => {
                        extraction = extraction.replace('\\','');
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
                URL = MediaUrls(text)[0]
        }
        let date = new Date().toLocaleDateString("EN", {
                year: "numeric",
                month: "long",
                day: "numeric",
        });
        let [td, time] = new Date()
            .toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            .split(",");
        const platform = os.platform();
        if (text.includes('&mention')) msg.contextInfo.mentionedJid = [user]
        text = text.replace(/&version/gi, `${package.version}`).replace(/&jid/gi, `${id}`).replace(/&gname/gi, `${subject}`).replace(/&mode/gi, `${MODE}`).replace(/&desc/gi, `${desc}`).replace(/&size/gi, `${size}`).replace(/&admins/gi, `${admins}`).replace(/&platform/gi, `${platform}`).replace(/&mention/gi, `@${m.participants[0].replace(/[^0-9]/g,'')}`).replace(/&date/gi, `${date}`).replace(/&time/gi, `${time}`);
        if (text.includes('&gif')) {
                msg.gifPlayback = true;
                text = text.replace(/&gif/g, '');
        }
        if (URL && URL.endsWith('.mp4')) {
                msg.video = {
                                url: URL
                        },
                        msg.caption = text.replace(URL, '').trim();
        } else if (URL) {
                msg.image = {
                                url: URL
                        },
                        msg.caption = text.replace(URL, '').trim();
        } else if (text.includes('&pp') && !text.includes('&gpp')) {
                text = text.replace(/&pp/g, '');
                try {
                        msg.image = {url:await conn.profilePictureUrl(user, 'image')};
                } catch (e){
                        msg.image = {url:"https://i.ibb.co/sFjZh7S/6883ac4d6a92.jpg"};
                }
                msg.caption = text.trim();
        } else if (text.includes('&gpp')) {
                text = text.replace(/&gpp/g, '');
                try {
        msg.image = {url:await conn.profilePictureUrl(groupId, 'image')};
                } catch (e){
                        msg.image = {url:"https://i.ibb.co/sFjZh7S/6883ac4d6a92.jpg"};
                }
                msg.caption = text.trim();
        } else msg.text = text.trim();
        return await conn.sendMessage(groupId, msg);
}

module.exports = Greetings;
