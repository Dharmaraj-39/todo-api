var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var bcrypt = require('bcrypt');
var db = require('./db.js');
var middleware = require('./middleware.js')(db);

var app = express();

var PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Todo API...');
});

// get /todos?q=work&completed = true
app.get('/todos', middleware.requireAuthentication, function (req, res) {

    var query = req.query; // accessing query parameters
    var Op = db.Op;
    var where = {
        userId: req.user.get('id')
    };
    
    if (query.hasOwnProperty('completed') && query.completed === 'true') {
        where.completed = true;

    } else if (query.hasOwnProperty('completed') && query.completed === 'false') {
        where.completed = false;
    }

    if (query.hasOwnProperty('q') && query.q.length > 0) {
        where.description = {
            [Op.like]: '%' + query.q + '%'
        }
    }

    console.log(where);
    
    db.todo.findAll({where: where}).then(function (todos) {
        res.json(todos);
    }).catch(function (e) {
        res.status(500).send();
    })
});

// get /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {

    var todoId = parseInt(req.params.id, 10);

    db.todo.findOne({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function (todo) {
        if (!!todo) {
            res.status(200).json(todo.toJSON());
        } else {
            res.status(404).send('Id not found');
        }
    }).catch(function (e) {
        res.status(500).send();
    })  
});

// post /todos
app.post('/todos', middleware.requireAuthentication, function(req, res) {

    var body = _.pick(req.body, "description", "completed")

    db.todo.create(body).then(function (todo) {
        req.user.addTodo(todo).then(function () {
            return todo.reload();
        }).then(function (todo) {
            res.json(todo.toJSON());
        });
    }).catch(function (e) {
        res.status(400).json({error: e});
    });

});


//put /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function (req, res) {

    var todoId = parseInt(req.params.id, 10);
    var body = _.pick(req.body, 'description', 'completed'); //pick the specific objects
    var attributes = {};

    if (body.hasOwnProperty('completed')) {
        attributes.completed = body.completed;
    } 

    if (body.hasOwnProperty('description')) {
        attributes.description = body.description;
    }
    
    db.todo.findOne({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function (todo) {
        if (todo) {
            todo.update(attributes).then(function (todo) {
                res.json(todo.toJSON());
            }).catch(function (e) {
                res.status(400).json(e);
            });
        } else {
            res.status(404).send();
        }
    }).catch(function () {
        res.status(500).send('Internal server error');
    });
});

//delete /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function (req, res) {

    var todoId = parseInt(req.params.id, 10);

    db.todo.destroy({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function (rowsDeleted) {
        if (rowsDeleted === 0) {
            res.status(404).json({error: 'No todos found in that id'})
        } else {
            res.status(204).send();
        }
    }, function () {
        res.status(500).send();
    });
});

app.post('/users', function (req, res) {

    var body = _.pick(req.body, "email", "password");

    db.user.create(body).then(function (user) {
        res.status(200).json(user.toPublicJSON());
    }).catch(function (e) {
        res.status(400).json(e);
    });
});

app.post('/users/login', function (req, res) {

    var body = _.pick(req.body, 'email', 'password');
    
    db.user.authenticate(body).then(function (user) {
        var token = user.generateToken('authentication');
        
        if (token) {
            res.header('auth', token).json(user.toPublicJSON());
        } else {
            res.status(401).send();
        }
        
    }).catch(function (e) {
        res.status(401).send();
    })
    
});

db.sequelize.sync({force: true}).then(function () {

    // listening on port 3000 or heroku server
    app.listen(PORT, function () {
        console.log('Express listening in PORT ' + PORT + '!');
    });
});


