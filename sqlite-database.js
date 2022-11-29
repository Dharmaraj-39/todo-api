

var Sequelize = require('sequelize');
var sequelize = new Sequelize(undefined, undefined, undefined, {
    'dialect': 'sqlite',
    'storage': 'sqlite_database.sqlite'
});

var Todo = sequelize.define('todo', {
    description: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            len: [1, 250]
        }
    },
    completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
})

sequelize.sync({force: true}).then(function () {
    console.log('Everything synced')

    Todo.create({
        description: 'Go to Office'
    }).then(function (todo) {
        return Todo.create({
            description: 'Still in Home'
        });
    }).then(function () {
        return Todo.findByPk(1)
    }).then(function (todo) {
        if (todo) {
            console.log(todo.toJSON());
        } else {
            console.log('todo not found')
        }
    }).catch(function (e) {
        console.log(e);
    })
});


