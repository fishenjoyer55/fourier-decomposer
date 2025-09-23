let hasPermission = false;

function decompose() {
    const audioFileInput = document.getElementById("audioFileInput");
    const audioFile = audioFileInput.files;
    
    if (audioFile.length > 0) {
        //if user is uploading their own file
    } else {
        //use record feature
    }
}
function recordAudio() {
    window.localAudio = document.getElementById("localAudio");
    if (hasPermission == false) {
        navigator.mediaDevices
        .getUserMedia({ video: false, audio: true })
        .then((stream) => {
            window.localStream = stream;
            window.localAudio.srcObject = stream;
            window.localAudio.autoplay = true;
            hasPermission = true;
        })
        .catch((err) => {
            console.error("error getting audio permissions: ${err}");
        });
    } else {
        console.log("yippee");
    }
}