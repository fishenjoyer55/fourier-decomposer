let audioChunks = [];
let mediaRecorder = [];
let hasPermission = false;

const audioFileInput = document.getElementById("audioFileInput");
const wholeAudioCanvas = document.getElementById("wholeAudioCanvas");
const frequencyCanvas = document.getElementById("frequencyCanvas");
const sinusoidCanvas = [document.getElementById("sinusoidCanvas0"), document.getElementById("sinusoidCanvas1"), document.getElementById("sinusoidCanvas2")];
const reconstructionCanvas = document.getElementById("reconstructionCanvas");

let samples;
let forwardFFT;
let magnitudes;
let sortedMagnitudes;
let isolateRange = 0;
let include = false;

//original, three sinusoids, reconstruction
const playbars = new Array(5);
const buffers = new Array(5);

// for (let i = 0; i < 6; i++) {
//     addAxes(i);
// }

function recordAudio() {
  const localAudio = document.getElementById("localAudio");

  if (!mediaRecorder || mediaRecorder.state != "recording") {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        hasPermission = true;

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);

        mediaRecorder.onstop = async () => {
            const blob = new Blob(audioChunks, { type: "audio/webm" });
            await graphAudio(blob);
        };

        mediaRecorder.start();
        }).catch(err => console.error("erm press the allow microphone button:", err));
    } else if (mediaRecorder.state == "recording") {
        mediaRecorder.stop();
        const tracks = mediaRecorder.stream.getTracks();
        tracks.forEach(track => track.stop());
        localAudio.srcObject = null;
  }
}

async function graphAudio(audioFile) {
    const audioBuffer = await new AudioContext().decodeAudioData(await audioFile.arrayBuffer());
    samples = audioBuffer.getChannelData(0);
    drawWave(wholeAudioCanvas, samples);
    buffers[0] = audioBuffer;
    addPlaybar(wholeAudioCanvas, 0);
}

function drawWave(canvas, samples, inFrequencyDomain = false) {
    //lowkey did not know a sample was a single moment in time. i thought a sample was like a 5-second audio
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255, 0, 102, 1)";
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
            ctx.moveTo(p, 300 - canvas.height / 10 * (Math.min(...samples.slice(p * step, (p + 1) * step))));
            ctx.lineTo(p, 300 - canvas.height / 10 * (Math.max(...samples.slice(p * step, (p + 1) * step))));
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

function addPlaybar(canvas, id) {
    if (playbars[id]) {
        return;
    }
    audioCtx = new AudioContext();
    const newPlaybar = document.createElement("canvas");
    const ctx = newPlaybar.getContext("2d");
    newPlaybar.classList.add("playbarCanvas", "tooltip");
    newPlaybar.width = canvas.width;
    newPlaybar.height = canvas.height;
    const boundingRect = canvas.getBoundingClientRect();
    newPlaybar.style.left = boundingRect.left + window.scrollX + "px";
    newPlaybar.style.top = boundingRect.top + window.scrollY + "px";
    document.getElementById("canvasZone").appendChild(newPlaybar);
    playbars[id] = newPlaybar;

    let animationFrame;
    let startTime;
    ctx.fillStyle = "rgba(108, 63, 162, 0.5)";
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if ((audioCtx.currentTime - startTime)/buffers[id].duration <= 1.1) {
            ctx.fillRect(0, 0, canvas.width * (audioCtx.currentTime - startTime)/buffers[id].duration, canvas.height);
            animationFrame = requestAnimationFrame(draw);
        } else {
            cancelAnimationFrame(animationFrame);
        }
    }

    newPlaybar.addEventListener("click", () => {
        startTime = audioCtx.currentTime;
        bufferToSource(buffers[id]).start();
        animationFrame = requestAnimationFrame(draw);
    });
}

function addAxes(id) {
    const newAxes = document.createElement("img");
    newAxes.src = "sprites/test_1.png";
    newAxes.style.width = 1010 + "px";
    let height = 0;
    let xaxis = 0;
    let position = 0;
    switch (id) {
        case 0:
            height = 200;
            xaxis = "Time";
            position = 123;
            break;
        case 1:
            height = 80;
            xaxis = "Time";
            position = 760;
            break;
        case 2:
            height = 80;
            xaxis = "Time";
            position = 844;
            break;
        case 3:
            height = 80;
            xaxis = "Time";
            position = 928;
            break;
        case 4:
            height = 200;
            xaxis = "Time";
            position = 1235;
            break;
        case 5:
            height = 300;
            xaxis = "Frequency";
            position = 455;
            break;
    }
    newAxes.classList.add("axes");
    newAxes.style.height = height + "px";
    newAxes.style.top = position + "px";
    document.getElementById("axes").appendChild(newAxes);
    const xaxisText = document.createElement("p");
    xaxisText.classList.add("axisText");
    xaxisText.style.top = position + "px";
    xaxisText.innerHTML = xaxis;
}

function decompose() {
    //one of two FFTs used here. check fastFourierTransformer.js for code
    forwardFFT = FFT(samples);
    console.log(forwardFFT.length);
    magnitudes = magnitudize(forwardFFT);
    drawWave(frequencyCanvas, magnitudes, true);
    // for (let i = 0; i < forwardFFT.length; i++) {
    //     console.log(forwardFFT[i] instanceof ComplexNumber);
    // }
    
    //sort magnitudes from largest to smallest
    sortedMagnitudes = magnitudes.toSorted((a, b) => b - a);
    console.log("max: " + sortedMagnitudes[0] + " min: " + sortedMagnitudes[sortedMagnitudes.length - 1]);

    function reconstructedCosine(frequency, phase) {
        const wave = new Array(samples.length);
        for (let t = 0; t < samples.length; t++) {
            //divide by 100 for visualization... otherwise it oscillates way too fast and looks like a solid rectangle
            wave[t] = Math.cos((2 * Math.PI * frequency/samples.length * t / 100 + phase));
        }
        return wave;
    }

    for (let i = 0; i < 3; i++) {
        const frequency = magnitudes.indexOf(sortedMagnitudes[i]);
        const phase = Math.atan2(forwardFFT[frequency].im, forwardFFT[frequency].re);
        console.log("frequency: " + frequency + "phase: " + phase);
        const cosine = reconstructedCosine(frequency, phase);
        drawWave(sinusoidCanvas[i], cosine);

        const audioCtx = new AudioContext();
        const buffer = audioCtx.createBuffer(1, cosine.length, audioCtx.sampleRate);
        buffer.copyToChannel(new Float32Array(cosine), 0);
        buffers[i + 1] = buffer;
        addPlaybar(sinusoidCanvas[i], i + 1);
    }

    document.getElementById("explainer").innerHTML = "Isolate frequencies in order of magnitude. 1 is strongest, " + magnitudes.length + " is weakest. Default: EXCLUDING 0 strongest.";
}

frequencyCanvas.addEventListener("click", () => {alert("Your ears would not be happy to 'hear' this as a sound wave. Click the three sinusoids below.");});

document.getElementById("isolateRange").addEventListener("change", event => {
    if (event.target.value) {
        isolateRange = event.target.value;
    } else {
        isolateRange = 0;
    }
    updateExplainer();
});

function updateExplainer() {
    const explainer = document.getElementById("explainer");
    console.log(isolateRange);
    if (include) {
        explainer.innerHTML = "Now INCLUDING ONLY the " + isolateRange + " strongest frequencies.";
    } else {
        explainer.innerHTML = "Now EXCLUDING the " + isolateRange + " strongest frequencies.";

    }
    if (include && (isolateRange <= 0 || isolateRange > magnitudes.length) || !include && (isolateRange < 0 || isolateRange >= magnitudes.length)) {
        explainer.innerHTML += " Warning: this condition will not run. Choose a number between 0 and " + magnitudes.length + ".";
    } else if (include && isolateRange == magnitudes.length || !include && isolateRange == 0) {
        explainer.innerHTML += " This will generate a complete reconstruction of the original audio.";
    }
}
function toggleIncludeExclude() {
    include = !include;
    const indicator = document.getElementById("includeExclude");
    if (include) {
        indicator.innerHTML = "Include";
        indicator.style.color = "rgb(0, 200, 200)"
    } else {
        indicator.innerHTML = "Exclude";
        indicator.style.color = "rgb(255, 0, 0)"
    }
    updateExplainer();
}

function reconstruct() {
    let splicedMagnitudes = new Array(sortedMagnitudes.length);
    for (let i = 0; i < sortedMagnitudes.length; i++) {
        splicedMagnitudes[i] = sortedMagnitudes[i];
    }
    if (include) {
        splicedMagnitudes.splice(isolateRange);
        console.log("now splicing beyond " + isolateRange + ", remaining length: " + splicedMagnitudes.length);
    } else {   
        splicedMagnitudes.splice(0, isolateRange);
        console.log("now splicing up to " + isolateRange + ", remaining length: " + splicedMagnitudes.length);
    }
    console.log("max: " + splicedMagnitudes[0] + " min: " + splicedMagnitudes[splicedMagnitudes.length - 1]);
    splicedMagnitudes = new Set(splicedMagnitudes);
    let isolatedForwardFFT = new Array(forwardFFT.length).fill(0);
    for (let i = 0; i < forwardFFT.length; i++) {
        if (splicedMagnitudes.has(magnitudes[i])) {
            isolatedForwardFFT[i] = forwardFFT[i];
        }
    }
    const inverseFFT = FFT(isolatedForwardFFT, -1);
    const reInverseFFT = new Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
        inverseFFT[i].re /= inverseFFT.length;
        inverseFFT[i].im /= inverseFFT.length;
        reInverseFFT[i] = 2 * inverseFFT[i].re;
        //console.log(inverseFFT[i]);
    }

    drawWave(reconstructionCanvas, reInverseFFT);
    
    const audioCtx = new AudioContext();
    const buffer = audioCtx.createBuffer(1, reInverseFFT.length, audioCtx.sampleRate);
    buffer.copyToChannel(new Float32Array(reInverseFFT), 0);
    buffers[4] = buffer;
    addPlaybar(reconstructionCanvas, 4);
}

//upload listener
audioFileInput.addEventListener("input", event => {
    const audioFile = audioFileInput.files[0];
    // makeAudioPlayable(audioFile);
    graphAudio(audioFile);
});


//bonus jellyfish
const jellyfish_aquarium = document.getElementById('jellyfishAquarium');
const jtx = jellyfish_aquarium.getContext('2d');

jellyfish_1 = new Image();
jellyfish_1.src = "sprites/test_1.png";
jellyfish_2 = new Image();
jellyfish_2.src = "sprites/test_2.png";
jellyfish_3 = new Image();
jellyfish_3.src = "sprites/test_3.png";
jellyfish_4 = new Image();
jellyfish_4.src = "sprites/test_4.png";
jellyfish_5 = new Image();
jellyfish_5.src = "sprites/test_5.png";
jellyfish_6 = new Image();
jellyfish_6.src = "sprites/test_6.png";

let jellyfishes = [];

jellyfish_1.onload = () => {
	for (let i = 0; i < 50; i++) {
		let jellyfish = {
			x: Math.random() * 1600 - 120,
			y: 700 + Math.random() * 900,
			size: 100 + 0.1 * i ** 2,
			sprite: jellyfish_1
		};
		jellyfish.y += jellyfish.size;
		jellyfishes.push(jellyfish);
		swimp(jellyfish);
	}
	
	gsap.ticker.add(() => {
		jtx.clearRect(0, 0, jellyfish_aquarium.width, jellyfish_aquarium.height);
		jellyfishes.forEach(jellyfish => {
			jtx.drawImage(jellyfish.sprite, jellyfish.x, jellyfish.y, jellyfish.size, jellyfish.size);
		});
	});
};

function swimp(jellyfish) {
	let jellyfish_timeline = gsap.timeline();
	jellyfish_timeline
	.to(jellyfish, {
		x: "-=" + jellyfish.size * 0.01 * (2 + Math.random()),
		y: "+=" + jellyfish.size * 0.04 * (3 + Math.random()),
		duration: 0.75,
		ease: "Power1.easeOut",
	}, 0)
	.to(jellyfish, {
		x: "+=" + jellyfish.size * 0.1 * (2 + Math.random()),
		y: "-=" + jellyfish.size * 0.4 * (3 + Math.random()),
		duration: 2 + Math.random(),
		ease: "Power1.easeOut",
		onComplete: () => {
			if (jellyfish.y < -200 - jellyfish.size) {
				jellyfish.x = Math.random() * jellyfish_aquarium.offsetWidth;
				jellyfish.y = 700 + jellyfish.size;
			}
			swimp(jellyfish);
		}
	}, 0.75)
	.call(() => {jellyfish.sprite = jellyfish_1; }, null, 0)
	.call(() => {jellyfish.sprite = jellyfish_2; }, null, 0.2)
	.call(() => {jellyfish.sprite = jellyfish_3; }, null, 0.4)
	.call(() => {jellyfish.sprite = jellyfish_4; }, null, 0.75)
	.call(() => {jellyfish.sprite = jellyfish_5; }, null, 0.95)
	.call(() => {jellyfish.sprite = jellyfish_6; }, null, 1.2)
}