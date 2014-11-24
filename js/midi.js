MIDI = {}
MIDI.midi = null;  // グローバルMIDIAccessオブジェクト
MIDI.outputSelect = null;
MIDI.outputList = null;


MIDI.onMIDISuccess = function(midiAccess) {
	console.log( "MIDI ready!" );
	MIDI.midi = midiAccess;
	var outputCmb = document.getElementById("outputPort");
	var outLength = MIDI.midi.outputs().length;
	MIDI.outputList = MIDI.midi.outputs();
	for ( var output in MIDI.midi.outputs.values() ) {
        console.log(ouput);
		// var output = MIDI.midi.outputs()[i];
		outputCmb.appendChild(new Option(output.manufacturer + " " + output.name, output.id ))
	}
	document.getElementById("outCount").innerHTML = outLength;
	
	MIDI.changeOutput();
}

MIDI.onMIDIFailure = function(msg) {
	console.log("Failed to get MIDI access - " + msg );
}

MIDI.changeOutput = function() {
	var outputCmb = document.getElementById("outputPort");
	var selectIndex = outputCmb.selectedIndex;
	var outLength = MIDI.outputList.length;

    MIDI.outputSelect = null;
	for ( var i = 0; i < outLength; i++ ) {
		var output = MIDI.outputList[i];
		if (outputCmb.options[selectIndex].value == output.id){
			MIDI.outputSelect = output;
			break;
		}
	}
}

MIDI.outputMIDIMessage = function(data0, data1, data2) {
	if (MIDI.outputSelect) {
		try{
			var data = [data0, data1, data2];
			MIDI.outputSelect.send(data);
			console.log("MIDI OUT : " + data0
				+ " " + data1
				+ " " + data2);
		}catch(e){
			console.log(e);
		}
	}
}


MIDI.init = function() {
    try{
        if(navigator.requestMIDIAccess){
            navigator.requestMIDIAccess({sysex:false}).then(MIDI.onMIDISuccess, MIDI.onMIDIFailure);
        }else{
            console.log( "お使いのブラウザはWeb MIDI APIに対応していません。Web MIDI APIを有効化したChromeを使用してください。" );
        }
    }catch(e){
        console.log( "お使いのブラウザはWeb MIDI APIに対応していません。Web MIDI APIを有効化したChromeを使用してください。" );
    }
}





