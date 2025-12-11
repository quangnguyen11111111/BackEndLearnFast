"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class file_detail extends Model {
    static associate(models) {
      this.belongsTo(models.file, { foreignKey: "fileID" });
      this.hasMany(models.learning_progress, { foreignKey: "detailID" });
    }
  }

  file_detail.init(
    {
      detailID: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
      },
      fileID: {
        type: DataTypes.CHAR(36),
        allowNull: false,
      },
      source: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      target: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "file_detail",
      tableName: "file_detail",
      timestamps: false,
    }
  );
  return file_detail;
};
  