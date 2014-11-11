/**
 * Audio Player object
 */
var AudioPlayer = function() {
    this.init();
};

AudioPlayer.FREQ_MUL = 20000;
AudioPlayer.QUAL_MUL = 30;

AudioPlayer.prototype.init = function() {
    this.context = null;
    this.audioBuffer = null;
    this.source = null;
    this.filter = null;

    try {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
    }
    catch(e) {
        alert('Web Audio API is not supported in this browser');
    }
}

AudioPlayer.prototype.loadSound = function(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    var self = this;
    request.onload = function() {
        self.context.decodeAudioData(request.response, function(buffer) {
            self.audioBuffer = buffer;
            self.source = self.context.createBufferSource();
            self.source.buffer = self.audioBuffer;
            self.filter = self.context.createBiquadFilter();
            self.filter.frequency.value = AudioPlayer.FREQ_MUL; 
            self.filter.connect(self.context.destination);
            self.source.connect(self.filter);
            callback(self.audioBuffer);
        }, function(err) {console.log(err)});
    }
    request.send();
};

AudioPlayer.prototype.loop = function(isLoop) {
    if (!this.source) {
        console.log('context is undefined');
        return;
    }
    this.source.loop = isLoop;
};

AudioPlayer.prototype.playSound = function() {
    if (!this.source) {
        console.log('source is undefined');
        return;
    }
    this.source.start(0);
};

AudioPlayer.prototype.playbackRate = function(rate) {
    if (!this.source) {
        console.log('source is undefined');
        return;
    }
    this.source.playbackRate.value = rate;
};

AudioPlayer.prototype.lowPassFilter = function(freq, qual) {
    if (!this.filter) {
        console.log('filter is undefined');
        return;
    }
    this.filter.type = 0; // Low-pass filter. See BiquadFilterNode docs
    this.filter.frequency.value = freq * AudioPlayer.FREQ_MUL;
    this.filter.Q.value = qual * AudioPlayer.QUAL_MUL;
};

