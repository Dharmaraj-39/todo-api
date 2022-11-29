var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

var db = require('./db.js');
const { where } = require('sequelize');

var app = express();

var PORT = process.env.PORT || 3000;
var todoNextId = 1;

var todos = [];

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Todo API...');
});

// get /todos?q=work&completed = true
app.get('/todos', function (req, res) {

    var query = req.query; // accessing query parameters
    var Op = db.Op;
    var where = {};
    
    

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
app.get('/todos/:id', function (req, res) {

    var todoId = parseInt(req.params.id, 10);

    db.todo.findByPk(todoId).then(function (todo) {
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
app.post('/todos', function(req, res) {

    var body = _.pick(req.body, "description", "completed")

    db.todo.create(body).then(function (todo) {
        res.status(200).send(todo.toJSON());
    }).catch(function (e) {
        res.status(400).json({error: e});
    })

});


//put /todos/:id
app.put('/todos/:id', function (req, res) {

    var todoId = parseInt(req.params.id, 10);
    var matchedTodo = _.findWhere(todos, {id: todoId});

    var body = _.pick(req.body, 'description', 'completed'); //pick the specific objects
    var validAttributes = {};

    if (!matchedTodo) {
        return res.status(404).send();
    }

    if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
        validAttributes.completed = body.completed;
    } else if (body.hasOwnProperty('completed')) {
        return res.status(400).send();
    }

    if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
        validAttributes.description = body.description;
    } else if (body.hasOwnProperty('description')) {
        return res.status(400).send();
    }

    _.extend(matchedTodo, validAttributes); // overrides to update data.
    res.json(matchedTodo);
});

//delete /todos/:id
app.delete('/todos/:id', function (req, res) {

    var todoId = parseInt(req.params.id, 10);

    db.todo.destroy({
        where: {
            id: todoId
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

db.sequelize.sync().then(function () {

    // listening on port 3000 or heroku server
    app.listen(PORT, function () {
        console.log('Express listening in PORT ' + PORT + '!');
    });
});


