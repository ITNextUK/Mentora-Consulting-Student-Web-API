const sequelize = require('../config/database');
const Student = require('./Student');

const db = {
  sequelize,
  Student
};

module.exports = db;
