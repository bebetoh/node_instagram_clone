var express = require('express');
var bodyParser = require('body-parser');
var multiparty = require('connect-multiparty');
var mongodb = require('mongodb');

var objectID = require('mongodb').ObjectId;

var fs = require('fs'); //modulo nativo para ligar com o file system

var app = express();

app.use(bodyParser.urlencoded({extended: true}));//aceita parametros no formato de form
app.use(bodyParser.json()); // aceita parametros no formato json;
app.use(multiparty());//interpreta formularios multipart form data

app.use(function (req, res, next) {
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-type");// Origem sobrescreve o content-type com o que esta na view do client padrao.ejs do projeto client web_instagram_clone
    res.setHeader("Access-Control-Allow-Credentials", true);

    next();
});

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

    res.setHeader("Access-Control-Allow-Origin", "*");

    var dados = req.body; 
    
    console.log(req.files);

    var time_stamp = new Date().getTime();

    var url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename;

    var path_origem = req.files.arquivo.path;
    var path_destino = './uploads/' + url_imagem;

   

    fs.rename(path_origem, path_destino, function (err) {
        if(err){
            res.status(500).json({error: err});
            return;
        }

        var dados = {
            titulo: req.body.titulo,
            url_imagem: url_imagem
        };

        db.open(function (err, mongoClient) {
            mongoClient.collection('postagens', function(err, collection) {
                collection.insert(dados, function(err, records){
                    if(err){
                        res.json({status: err});
                    }else{
                        res.json({status: 'inclusao realizada com sucesso'});
                    }
                    mongoClient.close();
                });
            });
        });
    });
});

//GET - lê o registro no mongodb
app.get('/api', function(req, res) {
    //console.log('entrou get');
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    
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
    //res.send('rota para atualizacao ' +req.body.comentario); 
    db.open(function (err, mongoClient) {
        mongoClient.collection('postagens', function(err, collection) {
            collection.update(
                { _id: objectID(req.params.id) },//query de pesquisa
                { $push: {
                            comentarios: {
                                id_comentario: new objectID(),
                                comentario: req.body.comentario
                            }
                    } 
                }, //instrução de atualização, inclui um objeto em um array ao invés de atualizar apenas um objeto.
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
    //res.send(req.params.id);
    
    db.open(function (err, mongoClient) {
        mongoClient.collection('postagens', function(err, collection) {
            collection.update( 
                    { }, //qualquer postagem
                    {  $pull:   {
                                    comentarios: { id_comentario:  objectID(req.params.id)}
                                }
                    },
                    {multi: true},
                    function (err, records) {//ação a ser tomada logo após o callback
                       // console.log('OPA');
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

app.get('/imagens/:imagem', function (req, res) {
   
    var img = req.params.imagem;

    //console.log(img);

    fs.readFile('./uploads/'+img, function (err, content) {
        if(err){
            res.status(400).json(err);
            return;
        }
        res.writeHead(200, { 'Content-type' : 'image/jpeg' });
        
        res.end(content)//pega o binario do arquivo e escreve dentro do response;
    })
});
