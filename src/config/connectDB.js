const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("flashcard_app", "root", null, {
  host: "localhost",
  dialect: "mysql",
});
let connectDB = async () => {
  try {
    await sequelize.authenticate({ logging: false });
    console.log("Connection has been established successfull");
  } catch (error) {
    console.log("Unable to connect to the database", error);
  }
};
module.exports = connectDB;
