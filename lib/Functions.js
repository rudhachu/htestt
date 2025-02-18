const {
    generateWAMessageFromContent,
    proto,
} = require("@whiskeysockets/baileys");
const { saveWarn, resetWarn } = require("./database");
const ID3Writer = require('browser-id3-writer');
const { getBuffer } = require("./utils");
const fs = require('fs');
const Crypto = require("crypto");
const path = require("path");
const FormData = require('form-data');
const axios = require('axios');
const {
	spawn
} = require('child_process')
const ff = require('fluent-ffmpeg')
const tmpFileOut = path.join(
    './media',
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.`
  );
  const tmpFileIn = path.join(
    './media',
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.`
  );
function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
	return new Promise(async (resolve, reject) => {
		try {
			let tmp = tmpFileIn + ext
			let out = tmpFileOut + ext2
			console.log(tmp,out)
			await fs.promises.writeFile(tmp, buffer)
			spawn('ffmpeg', ['-y', '-i', tmp, ...args,
				out
			]).on('error', reject).on('close', async (code) => {
				try {
					//await fs.promises.unlink(tmp)
					if (code !== 0) return reject(code)
					resolve(await fs.promises.readFile(out))
					await fs.promises.unlink(out)
				} catch (e) {
					reject(e)
				}
			})
		} catch (e) {
			reject(e)
		}
	})
}
function cutAudio(buff,start,end){
	let buf;
const media = fs.writeFileSync('./media/cut.mp3',buff)
	ff(media)
  .setStartTime('00:'+start)
  .setDuration(end)
  .output('./media/ouputcut.mp3')
  .on('end', function(err) {
    if(!err) {
	buf = fs.readFileSync('./media/ouputcut.mp3')
	}
  })
  .on('error', err => buf = false)
  return buf
}

function cutVideo(buff,start,end){
	let buf;
const media = fs.writeFileSync('./media/cut.mp4',buff)
	ff(media)
  .setStartTime('00:'+start)
  .setDuration(end)
  .output('./media/ouputcut.mp4')
  .on('end', function(err) {
    if(!err) {
	buf = fs.readFileSync('./media/ouputcut.mp4')
	}
  })
  .on('error', err => buf = false)
  return buf
}
function toAudio(buffer, ext) {
	return ffmpeg(buffer, ['-vn', '-ac', '2', '-b:a', '128k', '-ar', '44100', '-f', 'mp3'], ext || 'mp3', 'mp3')
}

function toPTT(buffer, ext) {
	return ffmpeg(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-compression_level', '10'], ext || 'mp3', 'opus')
      }

async function wawe(buff) {
    fs.writeFileSync("./temp.mp4", buff);
    return await fs.readFileSync("./temp.mp4");
    }
    
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

function createInteractiveMessage(data, options = {}) {
        const { jid, button, header, footer, body } = data;
        let buttons = [];
        for (let i = 0; i < button.length; i++) {
          let btn = button[i];
          let Button = {};
          Button.buttonParamsJson = JSON.stringify(btn.params);
          switch (btn.type) {
            case "copy":
              Button.name = "cta_copy";
              break;
            case "url":
              Button.name = "cta_url";
              break;
            case "location":
              Button.name = "send_location";
              break;
            case "address":
              Button.name = "address_message";
              break;
            case "call":
              Button.name = "cta_call";
              break;
            case "reply":
              Button.name = "quick_reply";
              break;
            case "list":
              Button.name = "single_select";
              break;
            default:
              Button.name = "quick_reply";
              break;
          }
          buttons.push(Button);
        }
        const mess = {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage: proto.Message.InteractiveMessage.create({
                body: proto.Message.InteractiveMessage.Body.create({ ...body }),
                footer: proto.Message.InteractiveMessage.Footer.create({ ...footer }),
                header: proto.Message.InteractiveMessage.Header.create({ ...header }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create(
                  {
                    buttons: buttons,
                  }
                ),
              }),
            },
          },
        };
        let optional = generateWAMessageFromContent(jid, mess, options);
        return optional;
      }

      async function AudioMetaData(audio, info = {}) {
        let title = info.title || "new-bot";
        let body = info.body ? [info.body] : [];
        let img = info.image || 'https://i.ibb.co/sFjZh7S/6883ac4d6a92.jpg';
        if (!Buffer.isBuffer(img)) img = await getBuffer(img);
        if (!Buffer.isBuffer(audio)) audio = await getBuffer(audio);
        const writer = new ID3Writer(audio);
        writer
          .setFrame("TIT2", title)
          .setFrame("TPE1", body)
          .setFrame("APIC", {
            type: 3,
            data: img,
            description: "NEW-BOT-MD",
          });
        writer.addTag();
        return Buffer.from(writer.arrayBuffer);
      }



async function uploadFileToZeta(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error("File not found: " + filePath);
        }
        const form = new FormData();
        form.append('uploadedFile', fs.createReadStream(filePath));
        const response = await axios.post('https://zeta-ser.xyz/upload', form, {
            headers: {
                ...form.getHeaders(),
            },
        });
        return response.data;
    } catch (err) {
        return err;
    }
}

async function sendUrl(message, mrply) {
if(mrply.type == "stickerMessage") {
	const imageBuffer = await mrply.download();
	const form = new FormData();
	form.append('image', imageBuffer, 'bt.jpg');
	form.append('key', "76a050f031972d9f27e329d767dd988f");
	const response = await axios.post('https://api.imgbb.com/1/upload', form, {
		headers: form.getHeaders()
	}).catch(e=>e.response);
	return await message.reply(response.data.data.image.url);
	} else if (mrply.type == "imageMessage" || mrply.type == "videoMessage") {
	let p = await mrply.downloadMediaMessage()
let u = await uploadFileToZeta(p)
return message.reply(u)
	} else if (mrply.type == "audioMessage") {
let urvideo = await mrply.downloadMediaMessage()
		await ff(urvideo)
			.outputOptions(["-y", "-filter_complex", "[0:a]showvolume=f=1:b=4:w=720:h=68,format=yuv420p[vid]", "-map", "[vid]", "-map 0:a"])
			.save('output.mp4')
			.on('end', async () => {
				const url = await uploadFileToZeta('./output.mp4')
return message.reply(url)
});
	}
}

async function parsedJid(text = "") {
    return [...text.matchAll(/([0-9]{5,16}|0)/g)].map(
      (v) => v[1] + "@s.whatsapp.net"
    );
}

async function setWarn(message, match, WARN_COUNT) {
    const userId = message.mention[0] || message.reply_message.sender;
    if (!userId) return message.reply("_Mention or reply to someone_");
    let reason = message?.reply_message.text || match;
    reason = reason.replace(/@(\d+)/, "");
    reason = reason ? reason.length <= 1 : "Reason not Provided";

    const warnInfo = await saveWarn(userId, reason);
    let userWarnCount = warnInfo ? warnInfo.warnCount : 0;
    userWarnCount++;
    await message.client.sendMessage(message.jid, { text: `_User_ @${userId.split("@")[0]} _warned._ \n_Warn Count: ${userWarnCount}._ \n_Reason: ${reason}_`, mentions: [userId] });
    if (userWarnCount > WARN_COUNT) {
      await message.reply("Warn limit exceeded kicking user");
      return await message.client.groupParticipantsUpdate(message.jid, userId, "remove");
    }
    return;
}

async function removeWarn(message) {
const userId = message.mention[0] || message.reply_message.sender;
    if (!userId) return message.reply("_Mention or reply to someone_");
    await resetWarn(userId);
    return await message.client.sendMessage(message.jid, { text: `_Warnings for @${userId.split("@")[0]} reset_`, mentions: [userId] });
}

module.exports = { wawe, MediaUrls, createInteractiveMessage, AudioMetaData, ffmpeg, cutAudio, cutVideo, toAudio, toPTT, sendUrl, setWarn, removeWarn, parsedJid };
