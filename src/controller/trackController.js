'use strict';

const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const multer = require('multer');
const winston = require('winston');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fields: 1, fileSize: 6000000, files: 1, parts: 2 }});

const { Readable } = require('stream');
const { DB_ROOT_URI } = process.env;

const uri = `${DB_ROOT_URI}`;
let db;

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            json: false,
            colorize: true,
            timestamp: true
        })
    ]
});

const handler = (functionRequest) => (req, res) => {
    try {
        logger.info('server.handler.begun');
        functionRequest(req, res, logger);
    } catch(e){
        logger.info('server.handler.failed');
    }
};

MongoClient.connect(uri, (err, database) => {
    if (err) {
        console.log('MongoDB Connection Error.');
        process.exit(1);
    }
    db = database;
});

exports.getTracks = handler( (req, res) => {
    db.collection("tracks.files").find({}).toArray((err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

exports.getTrackByID = handler((req, res) => {
    let trackID;

    try {
        trackID = new ObjectID(req.params.trackID);
    } catch(err) {
        return res.status(400).json({ message: "Invalid track ID in URL parameter." });
    }

    res.set('content-type', 'audio/mp3');
    res.set('accept-ranges', 'bytes');

    let bucket = new mongodb.GridFSBucket(db, {
        bucketName: 'tracks'
    });

    let downloadStream = bucket.openDownloadStream(trackID);

    downloadStream.on('data', chunk => {
        res.write(chunk);
    });

    downloadStream.on('error', _ => {
        res.sendStatus(404);
    });

    downloadStream.on('end', _ => {
        res.end();
    });
});

exports.uploadTrack = handler((req, res) => {
    upload.single('track')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: "Error in upload request validation." });
        } else if(!req.body.name) {
            return res.status(400).json({ message: "No track name in request body." });
        }

        let trackName = req.body.name;

        const readableTrackStream = new Readable();
        readableTrackStream.push(req.file.buffer);
        readableTrackStream.push(null);

        let bucket = new mongodb.GridFSBucket(db, {
            bucketName: 'tracks'
        });

        let uploadStream = bucket.openUploadStream(trackName);
        let ID = uploadStream.id;
        readableTrackStream.pipe(uploadStream);

        uploadStream.on('error', () => {
            return res.status(500).json({ message: "Error uploading file." });
        });

        uploadStream.on('finish', () => {
            return res.status(201).json({ message: `File uploaded successfully, stored under Mongo ObjectID: ${ID}.` });
        });
    });
});

exports.removeTrack = handler((req, res) => {
    let trackID;

    try {
        trackID = new ObjectID(req.params.trackID);
    } catch(err) {
        return res.status(400).json({ message: "Invalid trackID in URL parameter." });
    }

    let track = { _id: trackID };
    db.collection("tracks.files").deleteOne(track, (err, obj) => {
        if (err) throw err;
        res.send(`Track with ID: ${trackID} erased successfully.`)
    });
});
