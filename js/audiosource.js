/**
 * The *AudioSource object creates an analyzer node, sets up a repeating function with setInterval
 * which samples the input and turns it into an FFT array. The object has two properties:
 * streamData - this is the Uint8Array containing the FFT data
 * volume - cumulative value of all the bins of the streaData.
 *
 * The MicrophoneAudioSource uses the getUserMedia interface to get real-time data from the user's microphone. Not used currently but included for possible future use.
 */
var AudioSource = function(audioCtx) {
    var self = this;
    this.volume = 0;
    this.streamData = new Uint8Array(128);
    var analyser;

    var sampleAudioStream = function() {
        analyser.getByteFrequencyData(self.streamData);
        // calculate an overall volume value
        var total = 0;
        for(var i in self.streamData) {
            total += self.streamData[i];
        }
        self.volume = total;
    };

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    AudioPlayer.source.connect(analyser);
    setInterval(sampleAudioStream, 20);
};
