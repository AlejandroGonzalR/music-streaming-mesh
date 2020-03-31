const connection = io();
let connectionHost = window.location.hostname;

const trackList = document.getElementById('tracks-list');
const audio = document.getElementById('audio');
const submitButton = document.getElementById('submit');
const toast = document.getElementById('uploadToast');
let currentTrack = document.getElementById('current-track');

connection.on('leader host', host => {
    console.log('Leader Host: ' + host);
    connectionHost = host;
});

const socket = io(`http://${connectionHost}:10000`, { query: { roomName: 'tracks' } });

socket.on('tracks list', tracks => {
    cleanTracksList();
    displayTracks(tracks);
});

socket.on('PoET', data => {
    console.table(data);
});

socket.on('verification', response => {
    $('#uploadModal').modal('hide');

    if (response.authorization) {
        showToast('success');
        uploadTrack(response.host);
    } else
        showToast('error');
});

socket.on('disconnect', () => {
    console.log('Socket connection closed!');
    socket.close();
});

trackList.onclick = function(event) {
    event.preventDefault();

    let target = event.target;
    currentTrack.src = target.getAttribute('data-value');
    audio.load();
    audio.play();
};

submitButton.onclick = function (event) {
    event.preventDefault();

    socket.emit('upload request');
};

function uploadTrack(host) {
    let url = `http://${host}:${window.location.port}/tracks/`;

    let formData = new FormData();
    let trackName = document.getElementsByName('track')[0].value;
    trackName = trackName.replace(/.*[\/\\]/, '');
    trackName = trackName.substr(0, trackName.lastIndexOf('.')) || trackName;

    formData.append('name', trackName);
    formData.append('track', document.getElementsByName('track')[0].files[0]);

    console.log(document.getElementsByName('track')[0].files[0]);

    let request = new XMLHttpRequest();

    request.open('POST', url, true);
    request.onload = () => {
        if (request.status === 201) {
            console.log('File uploaded successfully.');
        }
    };
    request.onerror = (err) => {
        console.error(err)
    };

    request.send(formData);
}

function displayTracks(data) {
    for (let track of data.tracksList) {
        let listItem = document.createElement('li');
        listItem.appendChild(createTrackLink(data.host, track));
        trackList.appendChild(listItem);
    }
}

function createTrackLink(host, track) {
    let trackLink = document.createElement('a');
    trackLink.setAttribute('data-value', `http://${host}/tracks/${track._id}`);
    trackLink.setAttribute('href', '#');
    trackLink.innerHTML = track.filename;
    return trackLink;
}

function cleanTracksList() {
    while (trackList.firstChild) {
        trackList.removeChild(trackList.firstChild);
    }
}

function showToast(variant) {
    const querySelector = $('.toast');

    if (variant !== 'success') {
        toast.style.backgroundColor = '#de4e46';
        toast.childNodes[0].innerHTML = 'Upload failed';
        toast.childNodes[1].innerHTML = 'Permission was not accepted.';

        querySelector.toast('show');
        return;
    }

    toast.style.backgroundColor = '#62a945';
    toast.childNodes[0].innerHTML = 'Upload successfully';
    toast.childNodes[1].innerHTML = 'Permission was accepted.';

    querySelector.toast('show');
}

$(".custom-file-input").on("change", function() {
    let fileName = $(this).val().split("\\").pop();
    $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
});
