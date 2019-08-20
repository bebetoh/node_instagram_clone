var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');

var objectID = require('mongodb').ObjectId;


var app = express();

app.use(bodyParser.urlencoded({extended: true}));//aceita parametros no formato de form
app.use(bodyParser.json()); // aceita parametros no formato json;

var port = 8080;

app.listen(port);

console.log('Servidor http esta escutando na porta: ', port);

var db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost', 27017, {}),
    {}
);

app.get('/', function(req, res){
    res.send({msg: 'Olá.'})
});

//POST - cria o registro no mongodb
app.post('/api', function(req, res) {
    
    var dados = req.body; 
    
    db.open(function (err, mongoClient) {
        mongoClient.collection('postagens', function(err, collection) {
            collection.insert(dados, function(err, records){
                if(err){
                    res.json(err);
                }else{
                    res.json(records);
                }
                mongoClient.close();
            });
        })
    });
    //res.send(dados);
});

//GET - lê o registro no mongodb
app.get('/api', function(req, res) {
    db.open(function (err, mongoClient) {
        mongoClient.collection('postagens', function(err, collection) {
            collection.find().toArray(function (err, results) {
                if(err){
                    res.json(err);
                }else{
                    res.json(results);
                }
                mongoClient.close();
            });
        })
    });
});

app.get('/api/:id', function(req, res) {
  
    db.open(function (err, mongoClient) {
        mongoClient.collection('postagens', function(err, collection) {
            collection.find(objectID(req.params.id)).toArray(function (err, results) {
                if(err){
                    res.json(err);
                }else{
                    res.status(200).json(results);
                }
                mongoClient.close();
            });
        })
    });
});

app.put('/api/:id', function(req, res) {
  
  
    db.open(function (err, mongoClient) {
        mongoClient.collection('postagens', function(err, collection) {
            collection.update(
                { _id: objectID(req.params.id) },//query de pesquisa
                { $set: {titulo: req.body.titulo} }, //instrução de atualização
                {}, // multi um ou todos os registros
                function (err, records) {//ação a ser tomada logo após o callback
                    if(err){
                        res.json(err);
                    }else{
                        res.json(records);
                    }
                    mongoClient.close();
                }                
            );
        });
    });
});

app.delete('/api/:id', function(req, res) {
    console.log('entrou no delete');
    db.open(function (err, mongoClient) {
        mongoClient.collection('postagens', function(err, collection) {
            collection.remove( {_id: objectID(req.params.id) },function (err, records) {//ação a ser tomada logo após o callback
                    if(err){
                        res.json(err);
                    }else{
                        res.status.json(records);
                    }
                    mongoClient.close();
                }                
            );
        });
    });
});
