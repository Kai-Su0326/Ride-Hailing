const express = require('express');
var bodyParser = require('body-parser');
var {body, validationResult} = require('express-validator');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next){
    res.header('Access-Control-Allow-Origin', '*'); /*this should be the front end url*/
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Content-Length, X-Requested-With');
    // allow preflight
    if (req.method === 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});
const { Client } = require('pg');
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    }
});
client.connect();

app.post('/rides', [body('username').notEmpty(), body('lat').notEmpty().isFloat(), body('lng').notEmpty().isFloat()], function (req, res) {
    // res.set('Access-Control-Allow-Origin', '*');
    const err = validationResult(req);
    if(!err.isEmpty()){
        return res.status(422).json({"error":"Whoops, something is wrong with your data!"});
    }
    var ret = [];
    client.query('SELECT * FROM drivers', (error, result) => {
        if(!error) {
            for(var count = 0; count < result.rows.length; count++){
                ret.push({"_id": result.rows[count]._id, "username": result.rows[count].username, "lat": result.rows[count].lat, "lng": result.rows[count].lng, "created_at": result.rows[count].created_at});
            }
            res.json(ret);
        }
    })
});

app.put('/vehicle', [body('username').notEmpty(), body('lat').notEmpty().isFloat(), body('lng').notEmpty().isFloat()], function (req, res) {
   // res.set('Access-Control-Allow-Origin', '*');
    const err = validationResult(req);
    if(!err.isEmpty()){
        return res.status(422).json({"error":"Whoops, something is wrong with your data!"});
    }
    client.query('INSERT INTO drivers(username, lat, lng) VALUES($1, $2, $3) ON CONFLICT (username) DO UPDATE SET lat=$2, lng=$3', [req.body.username, req.body.lat, req.body.lng], (error, result) => {
        if(!error){
            res.send("success");
        } else {
            res.send(`driver ${req.body.username} failed to be added in.`);
        }
    })
});

app.put('/passenger', [body('username').notEmpty(), body('lat').notEmpty().isFloat(), body('lng').notEmpty().isFloat()], function (req, res) {
    // res.set('Access-Control-Allow-Origin', '*');
    const err = validationResult(req);
    if(!err.isEmpty()){
        return res.status(422).json({"error":"Whoops, something is wrong with your data!"});
    }
    client.query('INSERT INTO clients(username, lat, lng) VALUES($1, $2, $3) ON CONFLICT (username) DO UPDATE SET lat=$2, lng=$3', [req.body.username, req.body.lat, req.body.lng], (error, result) => {
        if(!error){
            res.send("success");
        } else {
            res.send(`driver ${req.body.username} failed to be added in.`);
        }
    })
});

app.get('/passenger.json', [body('username').notEmpty()], function (req,res) {
    const err = validationResult(req);
    var ret = [];
    if(!err.isEmpty()){
        return res.status(422).json(ret);
    }
    client.query('SELECT * FROM clients WHERE username = $1',[req.body.username], (error, result)=>{
        if(!error){
            for(var count = 0; count < result.rows.length; count++){
                ret.push({"_id": result.rows[count]._id, "username": result.rows[count].username, "lat": result.rows[count].lat, "lng": result.rows[count].lng, "created_at": result.rows[count].created_at});
            }
            res.json(ret);
        } else {
            res.send(`passenger ${req.body.username} is incompatible.`)
        }
    });
});

app.get('/vehicle.json', [body('username').notEmpty()], function (req,res) {
    const err = validationResult(req);
    var ret = [];
    if(!err.isEmpty()){
        return res.status(422).json(ret);
    }
    client.query('SELECT * FROM drivers WHERE username = $1',[req.body.username], (error, result)=>{
        if(!error){
            for(var count = 0; count < result.rows.length; count++){
                ret.push({"_id": result.rows[count]._id, "username": result.rows[count].username, "lat": result.rows[count].lat, "lng": result.rows[count].lng, "created_at": result.rows[count].created_at});
            }
            res.json(ret);
        } else {
            res.send(`driver ${req.body.username} is incompatible.`)
        }
    });
});

app.listen(process.env.PORT || 3000);

