registerProcessor('buffer-detector', class extends AudioWorkletProcessor {
    process (inputs, outputs, parameters) {
        if(this.#disconnect) {
            return false;
        }
        //inputs = [[?index channel float32array][?index channel float32array]]
        //input unwrap = [[?index channel float32array][?index channel float32array]]
        const [input] = inputs;

        this.port.postMessage(input);
        for (let i = 0; i < input.length; i++) {
            const floatArr = input[i];

            let sum = 0.0;

            for (i = 0; i < floatArr.length; ++i) {
                sum += floatArr[i] * floatArr[i];
            }

            const result = Math.sqrt(sum / floatArr.length);
            //if(result >= 0.01) console.log(result );
        }

        return true;
    }

    #disconnect = false;

    constructor(options) {
        super();

        this.port.onmessage = (e) =>{
            if(e.data === 'disconnect') {
                console.log("discc")
                this.#disconnect = true;
            }
        }
    }
});