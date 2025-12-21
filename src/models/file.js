"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class file extends Model {
    static associate(models) {
      this.belongsTo(models.users, { foreignKey: "creatorID" });
      this.belongsToMany(models.folder, {
        through: models.folder_items,
        foreignKey: "fileID",
        otherKey: "folderID",
      });
      this.hasMany(models.file_detail, { foreignKey: "fileID" });
      this.hasMany(models.learning_progress, { foreignKey: "fileID" });
      this.hasMany(models.user_file_history, { foreignKey: "fileID" });
    }
  }

  file.init(
    {
      fileID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fileName: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      creatorID: {
        type: DataTypes.CHAR(36),
        allowNull: true,
      },
      totalWords: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      visibility: {
        type: DataTypes.ENUM("public", "private"),
        defaultValue: "public",
      },
      type: {
        type: DataTypes.ENUM("local", "AI"),
        defaultValue: "local",
      },
      sourceLang: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      targetLang: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      topic: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "file",
      tableName: "files",
      timestamps: false,
    }
  );
  return file;
};
