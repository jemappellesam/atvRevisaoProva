'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const config = require(path.join(__dirname, '..', 'config', 'config.json'))[process.env.NODE_ENV || 'development'];
const db = {};

const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable], config)
  : new Sequelize(config.database, config.username, config.password, config);

fs.readdirSync(__dirname)
  .filter(file => file !== path.basename(__filename) && file.endsWith('.js') && !file.endsWith('.test.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.values(db).forEach(model => {
  if (typeof model.associate === 'function') {
    model.associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
