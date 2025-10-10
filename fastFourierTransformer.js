function FFT(rawSignal) {

    //recursion's end
    if (rawSignal.length == 1) {
        return rawSignal;
    }

    const signal = new Array(Math.pow(2, Math.ceil(Math.log2(rawSignal.length)))).fill(0);
    for (let i = 0; i < rawSignal.length; i++) {
        signal[i] = rawSignal[i];
    }
    const N = signal.length;

    const halfLength = signal.length/2;
    let even = [];
    let odd = [];
    for (let i = 0; i < halfLength; i++) {
        even[i] = (signal[2 * i]);
        odd[i] = (signal[2 * i + 1]);
    }
    even = FFT(even);
    odd = FFT(odd);

    for (let k = 0; k < halfLength; k++) {
        if (!(even[k] instanceof ComplexNumber)) {
            even[k] = new ComplexNumber(even[k], 0);
        }
        if (!(odd[k] instanceof ComplexNumber)) {
            odd[k] = new ComplexNumber(odd[k], 0);
        }
        //console.log("re: " + even[k].re + ", im: " + even[k].im);
        const reOffset =  Math.cos(2 * Math.PI * k / N) * odd[k].re - Math.sin(2 * Math.PI * k / N) * odd[k].im;
        const imOffset =  Math.cos(2 * Math.PI * k / N) * odd[k].im + Math.sin(2 * Math.PI * k / N) * odd[k].re;

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

function magnitudize(signal, isLog = true) {
    const magnitudes = [];
    for (let i = 0; i < signal.length; i++) {
        //magnitude of complex number
        magnitudes.push(Math.pow(Math.pow(signal[i].re, 2) + Math.pow(signal[i].im, 2), 2));
    }
    for (let i = 0; i < signal.length; i++) {
        //Hanning window. what does it do. apparently cleans up spectral noise
        magnitudes[i] *= 0.5 * (1 - Math.cos(2 * Math.PI * i / (signal.length - 1)));
        if (isLog) {
            magnitudes[i] = Math.log10(magnitudes[i]);
        }
        console.log(magnitudes[i]);
    }
    return magnitudes;
}