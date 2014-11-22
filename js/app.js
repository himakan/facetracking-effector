jQuery(function($) {

    var visualizer, audioPlayer;

    $("#soundcloud-play").on("click", fetchSoundCloundData);

    document.addEventListener("headtrackingEvent", function(e) {
        if (visualizer) {
            visualizer.setPosition(e.x, e.y, e.z);
        }

        var x = Math.max(Math.min(((e.x + 10) / 20), 1), 0);
        var y = Math.max(Math.min(((e.y + 10) / 20), 1), 0);
        var z = Math.max(2 - (e.z - 50) / 30, 0);
        if (audioPlayer) {
            audioPlayer.lowPassFilter(x, y);
            audioPlayer.playbackRate(z);
        }

        //for kaosspad3
        //console.log("e.z: " + e.z);
        var padX = Math.max(Math.min(parseInt((e.x + 10) / 20 * 127), 127), 0);
        var padY = Math.max(Math.min(parseInt((e.y + 10) / 20 * 127), 127), 0);
        
        if (e.z < 60) {
            //effect on
            MIDI.outputMIDIMessage(176, 94, 127);
        } else {
            //effect off
            MIDI.outputMIDIMessage(176, 94, 0);
        }

        MIDI.outputMIDIMessage(176, 92, Math.max(Math.min(parseInt(z * 64), 127), 0));
        MIDI.outputMIDIMessage(176, 12, padX);
        MIDI.outputMIDIMessage(176, 13, padY);
        //for kaosspad3 -- end
    }, false);

    function playSoundClound(soundCloudId) {
        if (!audioPlayer) {
            return;
        }
        audioPlayer.stopSound();
        audioPlayer.loadSoundCloud(soundCloudId, function() {
        // audioPlayer.loadSound("sound/drumloop.wav", function() {
            audioPlayer.loop(true);
            audioPlayer.playSound();

            var audioSource = new AudioSource(audioPlayer);

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
    }
    
    function fetchSoundCloundData() {
        var url = $("#soundcloud-url").val();
        $.ajax({
            dataType: "json",
            url: "//api.soundcloud.com/resolve.json",
            data: {
                client_id : AudioPlayer.SOUNDCLOUD_CLIENT_ID,
                url: url
            },
            success: function(data) {
                if (data.kind !== "track") {
                    alert("This is not Track URL!");
                    return;
                }
                playSoundClound(data.id);
            }
        });
    }

    MIDI.init();
    audioPlayer = new AudioPlayer();
    fetchSoundCloundData();
});
