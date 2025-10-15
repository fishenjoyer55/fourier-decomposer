function FFT(rawSignal, isForward = 1) {
    const signal = new Array(Math.pow(2, Math.ceil(Math.log2(rawSignal.length)))).fill(new ComplexNumber(0, 0));
    for (let i = 0; i < rawSignal.length; i++) {
        signal[i] = rawSignal[i];
    }
    return trueFFT(signal, isForward);
}

function trueFFT(signal, isForward) {

    //recursion's end
    if (signal.length == 1) {
        return signal;
    }

    const halfLength = signal.length/2;
    let even = [];
    let odd = [];
    for (let i = 0; i < halfLength; i++) {
        even[i] = (signal[2 * i]);
        odd[i] = (signal[2 * i + 1]);
    }
    even = trueFFT(even, isForward);
    odd = trueFFT(odd, isForward);

    const kernel = 2 * Math.PI / signal.length * isForward;
    for (let k = 0; k < halfLength; k++) {
        if (!(even[k] instanceof ComplexNumber)) {
            even[k] = new ComplexNumber(even[k], 0);
        }
        if (!(odd[k] instanceof ComplexNumber)) {
            odd[k] = new ComplexNumber(odd[k], 0);
        }
        //console.log("re: " + even[k].re + ", im: " + even[k].im);

        const reOffset =  Math.cos(k * kernel) * odd[k].re - Math.sin(k * kernel) * odd[k].im;
        const imOffset =  Math.cos(k * kernel) * odd[k].im + Math.sin(k * kernel) * odd[k].re;

        signal[k] = new ComplexNumber(even[k].re + reOffset, even[k].im + imOffset);
        signal[k + halfLength] = new ComplexNumber(even[k].re - reOffset, even[k].im - imOffset);
    }

    return signal;

}

//complexnumber object
function ComplexNumber(re, im) {
    this.re = re;
    this.im = im || 0;
}

function magnitudize(signal) {
    const magnitudes = new Array(signal.length/2);
    for (let i = 0; i < signal.length/2; i++) {
        if (!(signal[i] instanceof ComplexNumber)) {
            console.log(signal[i]);
        }
        //magnitude of complex number and also Hanning window
        magnitudes[i] = Math.hypot(signal[i].re, signal[i].im) * 0.5 * (1 - Math.cos(2 * Math.PI * i / (signal.length - 1)));
    }
    return magnitudes;
}
