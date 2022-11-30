var Sequelize = require('sequelize');
var Op = Sequelize.Op;
var sequelize = new Sequelize(undefined, undefined, undefined, {
    'dialect': 'sqlite',
    'storage': __dirname + '/data/dev-todo-api.sqlite'
});

var db = {};

db.todo = require(__dirname + '/models/todo.js')(sequelize, Sequelize.DataTypes)
db.user = require(__dirname + '/models/user.js')(sequelize, Sequelize.DataTypes)
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Op = Op;
module.exports = db;
