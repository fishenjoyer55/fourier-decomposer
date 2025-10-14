let hasPermission = false;


const audioFileInput = document.getElementById("audioFileInput");
const wholeAudioCanvas = document.getElementById("wholeAudioCanvas");
const frequencyCanvas = document.getElementById("frequencyCanvas");
const reconstructionCanvas = document.getElementById("reconstructionCanvas");

let samples;
let forwardFFT = [];

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

async function graphAudio(audioFile) {
    const audioBuffer = await new AudioContext().decodeAudioData(await audioFile.arrayBuffer());
    samples = audioBuffer.getChannelData(0);
    drawWave(wholeAudioCanvas, samples);
    addPlaybar(wholeAudioCanvas, audioBuffer);

    //one of two FFTs used here. check fastFourierTransformer.js for code
    forwardFFT = FFT(samples);
    drawWave(frequencyCanvas, magnitudize(forwardFFT), true);
}

function drawWave(canvas, samples, inFrequencyDomain = false) {
    //lowkey did not know a sample was a single moment in time. i thought a sample was like a 5-second audio
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    const step = Math.ceil(samples.length/canvas.width);

    //increment p once for every pixel of the canvas. literally pixel by pixel plotting
    if (!inFrequencyDomain) {
        for (let p = 0; p < canvas.width; p++) {
            //for each pixel, go to the corresponding section in the sample array and draw a line whose height is the amplitude difference (volume). centered and scaled to axis.
            ctx.moveTo(p, canvas.height / 2 * (1 + Math.min(...samples.slice(p * step, (p + 1) * step))));
            ctx.lineTo(p, canvas.height / 2 * (1 + Math.max(...samples.slice(p * step, (p + 1) * step))));
        }
    } else {
        for (let p = 0; p < canvas.width; p++) {
            //special case for plotting the fourier transform cause it's so goddamn tall
            ctx.moveTo(p, canvas.height / 10 * (Math.min(...samples.slice(p * step, (p + 1) * step))));
            ctx.lineTo(p, canvas.height / 10 * (Math.max(...samples.slice(p * step, (p + 1) * step))));
        }
    }
    //who up stroking they 2dcontext
    ctx.stroke();
}

function bufferToSource(buffer) {
    const audioCtx = new AudioContext();
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    return source;
}

function addPlaybar(canvas, buffer) {
    audioCtx = new AudioContext();
    const source = bufferToSource(buffer, audioCtx);
    const newPlaybar = document.createElement("canvas");
    const ctx = newPlaybar.getContext("2d");
    newPlaybar.classList.add("playbarCanvas");
    newPlaybar.width = canvas.width;
    newPlaybar.height = canvas.height;
    const boundingRect = canvas.getBoundingClientRect();
    newPlaybar.style.left = boundingRect.left + window.scrollX + "px";
    newPlaybar.style.top = boundingRect.top + window.scrollY + "px";
    document.getElementById("canvasZone").appendChild(newPlaybar);

    let animationFrame;
    let startTime;
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillRect(0, 0, canvas.width * (audioCtx.currentTime - startTime)/buffer.duration, canvas.height);
        animationFrame = requestAnimationFrame(draw);
    }

    newPlaybar.addEventListener("click", () => {
        startTime = audioCtx.currentTime;
        console.log("start time: " + startTime);
        bufferToSource(buffer).start();
        animationFrame = requestAnimationFrame(draw);
    })
}

function decompose() {
    // for (let i = 0; i < forwardFFT.length; i++) {
    //     console.log(forwardFFT[i] instanceof ComplexNumber);
    // }
    const inverseFFT = FFT(forwardFFT, -1);
    const reInverseFFT = new Array(inverseFFT.length/2);
    for (let i = 0; i < inverseFFT.length/2; i++) {
        inverseFFT[i].re /= inverseFFT.length;
        inverseFFT[i].im /= inverseFFT.length;
        reInverseFFT[i] = inverseFFT[i].re;
        //console.log(inverseFFT[i]);
    }

    drawWave(reconstructionCanvas, reInverseFFT);
    
    const audioCtx = new AudioContext();
    const buffer = audioCtx.createBuffer(1, reInverseFFT.length, audioCtx.sampleRate);
    buffer.copyToChannel(new Float32Array(reInverseFFT), 0);
    addPlaybar(reconstructionCanvas, buffer);
}

//upload listener
audioFileInput.addEventListener("input", event => {
    const audioFile = audioFileInput.files[0];
    // makeAudioPlayable(audioFile);
    graphAudio(audioFile);
});
