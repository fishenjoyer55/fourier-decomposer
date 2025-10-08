let hasPermission = false;


const audioFileInput = document.getElementById("audioFileInput");
const wholeAudioCanvas = document.getElementById("wholeAudioCanvas");
wholeAudioCanvas.addEventListener("click", event => addPlaybar(event.target));
const fourierTransformCanvas = document.getElementById("fourierTransformCanvas");

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

function makeAudioPlayable(audioFile) {
    $("#audioSrc").attr("src", URL.createObjectURL(audioFile));
    document.getElementById("audio").load();
}

async function graphAudio(audioFile) {
    const audioBuffer = await new AudioContext().decodeAudioData(await audioFile.arrayBuffer());
    const samples = audioBuffer.getChannelData(0);
    drawWave(wholeAudioCanvas, samples);
}

function drawWave(canvas, samples) {
    console.log("drawingwave attempt");
    //lowkey did not know a sample was a single moment in time. i thought a sample was like a 5-second audio
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    const step = Math.ceil(samples.length/canvas.width);
    console.log("samples length: " + samples.length);
    console.log("canvas width: " + canvas.width);
    
    //increment p once for every pixel of the canvas. literally pixel by pixel plotting
    for (let p = 0; p < canvas.width; p++) {
        //for each pixel, go to the corresponding section in the sample array and draw a line whose height is the amplitude difference (volume). centered and scaled to axis.
        ctx.moveTo(p, canvas.height / 2 * (1 + Math.min(...samples.slice(p * step, (p + 1) * step))));
        ctx.lineTo(p, canvas.height / 2 * (1 + Math.max(...samples.slice(p * step, (p + 1) * step))));
    }
    //who up stroking they 2dcontext
    ctx.stroke();
}

function addPlaybar(canvas) {
    const newPlaybar = document.createElement("canvas");
    newPlaybar.classList.add("playbarCanvas");
    document.getElementById("canvasZone").appendChild(newPlaybar);
}

$("#audio").on("timeUpdate", () => {
    console.log("change");
});

//upload listener
audioFileInput.addEventListener("input", event => {
    const audioFile = audioFileInput.files[0];
    makeAudioPlayable(audioFile);
    graphAudio(audioFile);
});
