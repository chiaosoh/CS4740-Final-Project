const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

const File = require('./File')(sequelize);

sequelize.sync(); // Creates the table if it doesn't exist

module.exports = { sequelize, File };