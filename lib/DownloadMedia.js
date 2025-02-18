const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs").promises;
const { fromBuffer } = require("file-type");
const path = require("path");

const mimeMap = {
  imageMessage: "image",
  videoMessage: "video",
  stickerMessage: "sticker",
  documentMessage: "document",
  audioMessage: "audio",
};

async function downloadMedia(message, pathFile) {
  try {
    let type = Object.keys(message)[0];
    let mes = message;

    if (type === "templateMessage") {
      mes = message.templateMessage.hydratedFourRowTemplate;
      type = Object.keys(mes)[0];
    } else if (type === "interactiveResponseMessage") {
      mes = message.interactiveResponseMessage;
      type = Object.keys(mes)[0];
    } else if (type === "buttonsMessage") {
      mes = message.buttonsMessage;
      type = Object.keys(mes)[0];
    }

    const stream = await downloadContentFromMessage(mes[type], mimeMap[type]);
    const buffer = [];

    for await (const chunk of stream) {
      buffer.push(chunk);
    }

    const fileBuffer = Buffer.concat(buffer);

    if (pathFile) {
      await fs.writeFile(pathFile, fileBuffer);
      return pathFile;
    } else {
      return fileBuffer;
    }
  } catch (error) {
    console.error("Error in downloadMedia:", error);
    throw error;
  }
}

module.exports = { downloadMedia };
