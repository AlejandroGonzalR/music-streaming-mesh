'use strict';

const axios = require('axios');
let os = require('os');
const winston = require('winston');

let ifaces = os.networkInterfaces();
let clients = [];
let leaderHost = null;

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            json: false,
            colorize: true,
            timestamp: true
        })
    ]
});

Object.keys(ifaces).forEach(function (ifname) {
    let alias = 0;

    ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            return;
        }

        if (alias >= 1) {
            console.log(ifname + ':' + alias, iface.address);
        } else {
            if (ifname === 'wlp7s0') {
                leaderHost = iface.address;
            }
        }
        ++alias;
    });
});

module.exports = io => {

    io.on('connection', socket => {

        let query = socket.handshake.query;
        let roomName = query.roomName;

        if (!roomName) {
            socket.emit('leader host', leaderHost || '0.0.0.0');
            return;
        }

        socket.join(roomName);
        includeSocketHost(socket.handshake.headers.host);
        logger.info(`New connection from ${socket.handshake.headers.host}`);

        syncTracks().then(tracks => {
            logger.info('Synchronizing tracks');

            // socket.emit('tracks list', tracks);
            io.sockets.emit('tracks list', tracks);
        });

        socket.on('upload request', _ => {
            logger.info(`Incoming upload request from ${socket.handshake.headers.host}`);
            let sockets = io.sockets.sockets;
            let nodesTimes = [];

            for (let nodeIterator in sockets) {
                let elapsedTime = Math.floor(Math.random() * 1000);
                sockets[nodeIterator].randomTime = elapsedTime;
                nodesTimes.push(elapsedTime);
            }

            let maxElapsedTime = Math.max(...nodesTimes);
            logger.info(`Winner time is ${maxElapsedTime}`);

            socket.emit('PoET', {
                'Socket Time': socket.randomTime,
                'Winner Time': maxElapsedTime
            });

            if (socket.randomTime === maxElapsedTime) {
                logger.info(`Client in ${socket.handshake.headers.host} got permission`);
                socket.emit('verification', { authorization: true, host: socket.handshake.headers.host.split(":").shift() });
                syncTracks().then(tracks => {
                    logger.info('Synchronizing tracks');

                    // socket.emit('tracks list', tracks);
                    io.sockets.emit('tracks list', tracks);
                });
            } else {
                logger.info(`Client in ${socket.handshake.headers.host} doesn't got permission`);
                socket.emit('verification', { authorization: false });
            }
        });

        socket.on('disconnect', _ => {
            logger.info(`Client in ${socket.handshake.headers.host} disconnected`);
            deleteSocketHost(socket.handshake.headers.host);
        })
    })
};

function includeSocketHost(hostname) {
    if (!inArray(hostname, clients)) {
        clients.push(hostname);
    }
}

function deleteSocketHost(hostname) {
    for (let client = 0; client < clients.length; client++) {
        if (clients[client] === hostname) {
            clients.slice(client, 1);
        }
    }
}

async function syncTracks() {
    if (typeof clients !== 'undefined' && clients.length > 0) {

        let data;

        try {
            let response = await axios.get(`http://${clients[0]}/tracks/`);
            let tracks = await response.data;
            data = { 'host': clients[0], 'tracksList': tracks };
            return data;
        } catch (err) {
            logger.error(`Error getting un-synchronized tracks: ${err}`);
            return err;
        }
    }
}

function inArray(value, array) {
    for (let item = 0; item < array.length; item++) {
        if (array[item] === value) {
            return true;
        }
    }
    return false;
}
