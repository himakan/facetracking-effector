AudioPlayer = {};
AudioPlayer.context;
AudioPlayer.audioBuffer = null;
AudioPlayer.source;
AudioPlayer.filter;

AudioPlayer.FREQ_MUL = 20000;
AudioPlayer.QUAL_MUL = 30;

AudioPlayer.init = function() {
  try {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    AudioPlayer.context = new AudioContext();
  }
  catch(e) {
    alert('Web Audio API is not supported in this browser');
  }
}

AudioPlayer.loadSound = function(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function() {
        AudioPlayer.context.decodeAudioData(request.response, function(buffer) {
            AudioPlayer.audioBuffer = buffer;
            AudioPlayer.source = AudioPlayer.context.createBufferSource();
            AudioPlayer.source.buffer = AudioPlayer.audioBuffer;
            AudioPlayer.filter = AudioPlayer.context.createBiquadFilter();
            AudioPlayer.filter.frequency.value = AudioPlayer.FREQ_MUL; 
            AudioPlayer.filter.connect(AudioPlayer.context.destination);
            AudioPlayer.source.connect(AudioPlayer.filter);
            callback(AudioPlayer.audioBuffer);
        }, function(err) {console.log(err)});
    }
    request.send();
}

AudioPlayer.loop = function(isLoop) {
   if (!AudioPlayer.source) {
       console.log('context is undefined');
       return;
   }
    AudioPlayer.source.loop = isLoop;
}

AudioPlayer.playSound = function() {
   if (!AudioPlayer.source) {
       console.log('source is undefined');
       return;
   }
  AudioPlayer.source.start(0);
}

AudioPlayer.playbackRate = function(rate) {
   if (!AudioPlayer.source) {
       console.log('source is undefined');
       return;
   }
  AudioPlayer.source.playbackRate.value = rate;
}

AudioPlayer.lowPassFilter = function(freq, qual) {
    if (!AudioPlayer.filter) {
        console.log('filter is undefined');
        return;
    }
    AudioPlayer.filter.type = 0; // Low-pass filter. See BiquadFilterNode docs
    AudioPlayer.filter.frequency.value = freq * AudioPlayer.FREQ_MUL;
    AudioPlayer.filter.Q.value = qual * AudioPlayer.QUAL_MUL;
}
