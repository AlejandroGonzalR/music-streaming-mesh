'use strict';

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const socket = require('socket.io');
const routes = require('./src/routes/routes');
const mesh = require('./src/controller/meshController');
const trackRoute = express.Router();

const app = express();
const server = require('http').createServer(app);
const io = socket.listen(server);

app.use(cors());
app.options('*', cors());
app.use('/tracks', trackRoute);

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index');
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

routes(trackRoute);
mesh(io);

server.listen(PORT);
console.log(`Running on port: ${PORT}`);
