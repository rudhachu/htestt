const fs = require('fs');
const { fromBuffer } = require('file-type');
const path = require('path');
const axios = require('axios');
const { writeExifImg, writeExifVid, imageToWebp, videoToWebp } = require('./exif');

async function serialize(conn) {
  /**
   * Get file data from various sources (buffer, base64, URL, or file path)
   * @param {string|Buffer} PATH
   * @returns {{ data: Buffer, mime: string, ext: string }}
   */
   conn.getFile = async (PATH) => {
    let data;
    if (Buffer.isBuffer(PATH)) {
      data = PATH;
    } else if (/^data:.*?\/.*?;base64,/i.test(PATH)) {
      data = Buffer.from(PATH.split(',')[1], 'base64');
    } else if (/^https?:\/\//.test(PATH)) {
      const res = await axios.get(PATH, { responseType: 'arraybuffer' });
      data = Buffer.from(res.data, 'binary');
    } else if (fs.existsSync(PATH)) {
      data = await fs.readFile(PATH);
    } else {
      data = Buffer.alloc(0);
    }
    if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');
    const type = (await fromBuffer(data)) || {
      mime: 'application/octet-stream',
      ext: '.bin',
    };
    return { data, ...type };
  };

  /**
   * Send image as sticker
   * @param {string} jid
   * @param {Buffer} buff
   * @param {object} options
   */
   conn.sendImageAsSticker = async (jid, buff, options = {}) => {
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifImg(buff, options);
    } else {
      buffer = await imageToWebp(buff);
    }
    await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, options);
  };

  /**
   * Send video as sticker
   * @param {string} jid
   * @param {Buffer} buff
   * @param {object} options
   */
   conn.sendVideoAsSticker = async (jid, buff, options = {}) => {
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifVid(buff, options);
    } else {
      buffer = await videoToWebp(buff);
    }
    await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, options);
  };

  return conn;
};

module.exports = { serialize };
