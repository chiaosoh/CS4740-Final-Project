const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

const File = require('./File')(sequelize);

sequelize.sync({ force: true });

module.exports = { sequelize, File };