require('dotenv').config();
const { Sequelize } = require("sequelize");
const fs = require("fs");

const DATABASE_URL = process.env.DATABASE_URL || "./database.db";

const toBool = (x) => x == 'true'
module.exports = {
  HANDLER: process.env.HANDLER  || 'null',
  HEROKU_APP_NAME: process.env.HEROKU_APP_NAME || '',
  HEROKU_API_KEY: process.env.HEROKU_API_KEY || '',
  MODE: (process.env.MODE || 'private').toLowerCase(),
  ERROR_MSG: toBool(process.env.ERROR_MSG) || true,
  LOG_MSG: toBool(process.env.LOG_MSG) || true,
  READ_CMD: toBool(process.env.READ_CMD),
  READ_MSG: toBool(process.env.READ_MSG),
  ANTI_DELETE: toBool(process.env.ANTI_DELETE) || false,
  WARN_COUNT: process.env.WARN_COUNT  || '3',
  SUDO: process.env.SUDO || '919747257996',
  SESSION: process.env.SESSION || "Zeta-XD÷nQFVRD7Y#B_UXoq_n2yNCoM78gFaUWDqLA8QTX-dQyfvf2i6whLw",
  DATABASE:
    DATABASE_URL === "./database.db"
      ? new Sequelize({
          dialect: "sqlite",
          storage: DATABASE_URL,
          logging: false,
        })
      : new Sequelize(DATABASE_URL, {
          dialect: "postgres",
          ssl: true,
          protocol: "postgres",
          dialectOptions: {
            native: true,
            ssl: { require: true, rejectUnauthorized: false },
          },
          logging: false,
        }),
};
