const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('File', {
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    storageKey: {
      type: DataTypes.STRING,
      allowNull: false
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false
    },
    accessList: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    deleteOnAccessBy: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });
};