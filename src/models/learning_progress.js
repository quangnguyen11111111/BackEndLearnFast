"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class learning_progress extends Model {
    static associate(models) {
      this.belongsTo(models.users, { foreignKey: "userID" });
      this.belongsTo(models.file, { foreignKey: "fileID" });
      this.belongsTo(models.file_detail, { foreignKey: "detailID" });
    }
  }

  learning_progress.init(
    {
      userID: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
      },
      fileID: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
      },
      detailID: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
      },
      flashcardState: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },
      quizState: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "learning_progress",
      tableName: "learning_progress",
      timestamps: false,
    }
  );
  return learning_progress;
};
