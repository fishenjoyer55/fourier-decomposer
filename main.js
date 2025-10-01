let hasPermission = false;

const wholeAudioCanvas = document.getElementById("wholeAudioCanvas");

async function decompose() {
    const audioFileInput = document.getElementById("audioFileInput");
    const audioFile = audioFileInput.files[0];
    
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(await audioFile.arrayBuffer());
    const leftSamples = audioBuffer.getChannelData(0);

    drawWave(wholeAudioCanvas, leftSamples);
}

function drawWave(canvas, samples) {
    console.log("drawingwave attempt");
    //lowkey did not know a sample was a single moment in time. i thought a sample was like a 5-second audio
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    const step = Math.ceil(samples.length/canvas.width);
    const axis = canvas.height / 2;
    console.log("sample length: " + samples.length);
    console.log("canvas width: " + canvas.width);
    
    //increment p once for every pixel of the canvas. literally pixel by pixel plotting
    for (let p = 0; p < canvas.width; p++) {
        console.log("pixel here");
        //for each pixel, go to the corresponding section in the sample array and draw a line whose height is the amplitude difference = volume
        ctx.moveTo(p, axis * (1 + Math.min(...samples.slice(p * step, (p + 1) * step))));
        ctx.lineTo(p, axis * (1 + Math.max(...samples.slice(p * step, (p + 1) * step))));
    }
    //who up stroking they 2dcontext
    ctx.stroke();
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
