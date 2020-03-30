'use strict';

let trackController = require('../controller/trackController');

module.exports = route => {

    route
        .get('/', trackController.getTracks)
        .get('/:trackID', trackController.getTrackByID)
        .post('/', trackController.uploadTrack)
        .delete('/:trackID', trackController.removeTrack)
};
