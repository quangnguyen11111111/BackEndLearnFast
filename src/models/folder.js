"use strict";
const { Model, DataTypes } = require("sequelize");
// Folder Model
module.exports = (sequelize) => {
  class folder extends Model {
    static associate(models) {
      this.belongsToMany(models.file, {
        through: models.folder_items,
        foreignKey: "folderID",
        otherKey: "fileID",
      });
      this.hasMany(models.folder_items, { foreignKey: "folderID" });
    }
  }

  folder.init(
    {
      folderID: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
      },
      folderName: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
    },
    { sequelize, modelName: "folder", tableName: "folders", timestamps: false }
  );
  return folder;
};