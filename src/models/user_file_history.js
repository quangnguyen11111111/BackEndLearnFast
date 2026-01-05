"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class user_file_history extends Model {
    static associate(models) {
      this.belongsTo(models.users, { foreignKey: "userID" });
      this.belongsTo(models.file, { foreignKey: "fileID" });
    }
  }

  user_file_history.init(
    {
      userID: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
      },
      fileID: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
      },
      openedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      pointCardMatching: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pointBlockGame: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
    },
    {
      sequelize,
      modelName: "user_file_history",
      tableName: "user_file_history",
      timestamps: false,
    }
  );
  return user_file_history;
};
