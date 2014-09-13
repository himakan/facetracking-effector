document.addEventListener("DOMContentLoaded", function() {

    var visualizer;

    document.addEventListener("headtrackingEvent", function(e) {
        if (visualizer) {
            visualizer.setPosition(e.x, e.y, e.z);
        }

        var x = Math.max(Math.min(((e.x + 10) / 20), 1), 0);
        var y = Math.max(Math.min(((e.y + 10) / 20), 1), 0);
        var z = Math.max(2 - (e.z - 50) / 30, 0);
        AudioPlayer.lowPassFilter(x, y);
        AudioPlayer.playbackRate(z);

        //for kaosspad3
        //console.log("e.z: " + e.z);
        var padX = Math.max(Math.min(parseInt((e.x + 10) / 20 * 127), 127), 0);
        var padY = Math.max(Math.min(parseInt((e.y + 10) / 20 * 127), 127), 0);
        
        if(e.z < 60){
            //effect on
            MIDI.outputMIDIMessage(176, 94, 127);
        }else{
            //effect off
            MIDI.outputMIDIMessage(176, 94, 0);
        }

        MIDI.outputMIDIMessage(176, 92, Math.max(Math.min(parseInt(z * 64), 127), 0));
        MIDI.outputMIDIMessage(176, 12, padX);
        MIDI.outputMIDIMessage(176, 13, padY);
        //for kaosspad3 -- end
    }, false);

    MIDI.init();
    AudioPlayer.init();
    AudioPlayer.loadSound("sound/drumloop.wav", function() {
        AudioPlayer.loop(true);
        AudioPlayer.playSound();

        var audioSource = new AudioSource(AudioPlayer.context);
        visualizer = new Visualizer();
        visualizer.init({
            containerId: 'visualizer',
            audioSource: audioSource
        });
        var videoInput = document.getElementById('inputVideo');
        var canvasInput = document.getElementById('inputCanvas');
        var htracker = new headtrackr.Tracker();
        htracker.init(videoInput, canvasInput);
        htracker.start();
    });

});
