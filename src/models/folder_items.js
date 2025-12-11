"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class folder_items extends Model {
    static associate(models) {
      this.belongsTo(models.folder, { foreignKey: "folderID" });
      this.belongsTo(models.file, { foreignKey: "fileID" });
    }
  }

  folder_items.init(
    {
      folderID: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
      },
      fileID: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
      },
    },
    {
      sequelize,
      modelName: "folder_items",
      tableName: "folder_items",
      timestamps: false,
    }
  );
  return folder_items;
};
