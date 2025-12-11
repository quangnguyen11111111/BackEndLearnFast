"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class users extends Model {
    static associate(models) {
      this.hasMany(models.file, { foreignKey: "creatorID" });
      this.hasMany(models.learning_progress, { foreignKey: "userID" });
      this.hasMany(models.user_file_history, { foreignKey: "userID" });
    }
  }
  users.init(
    {
      userID: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: true,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      authType: {
        type: DataTypes.ENUM("local", "google"),
        defaultValue: "local",
      },
      refreshToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "users",
      tableName: "users",
      timestamps: false,
    }
  );
  return users;
};
