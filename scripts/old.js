
    initialize();
    
    

// Call resizeCanvas() each time the window is resized
function initialize() {
	window.addEventListener('resize', resizeCanvas, false);
	resizeCanvas();
}

//Resizes each canvas inside the nine tiles.
//Divide by 3.5 since there are three tiles and want 
//extra space on the sides.
//Divide by 1.16 to 
function resizeCanvas() {
	$(".tile canvas").each(function(){
	/*	this.getContext("2d").width = $("#boarddiv")[0].clientWidth/3.2;
		//this.getContext("2d").height =  $("#boarddiv")[0].clientWidth/3.5/2;*/
	})
}



/*var defaultConfig = { iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] };
	var c = new RTCPeerConnection(defaultConfig);
	
	var peer = new Peer({config: c});
	peer.on('open', function(id) {
		console.log('My peer ID is: ' + id);
	  });*/

	  function start2(noInitialize, conn) {
		var peer;
		console.log("here");
		if (noInitialize)
			reset();
		else
			var peer = initialize();
			   
		peer.on('open', function () {
			document.getElementById("receiver-id").innerHTML = "ID: " + peer.id;
			document.getElementById("status").innerHTML = "Awaiting connection...";
		});
		peer.on('connection', function (c) {
			if (conn) {
				c.send("Already connected...");
				c.close();
				return
			}
			conn = c;
			console.log("Connected.");
			status.innerHTML = "Connected";
			ready(peer, conn)
		});
	}
	
	function initialize() {
		// Create own peer object with connection to shared PeerJS server
		var peer
		peer = new Peer(null, {
			debug: 2
		});
	
		peer.on('open', function (id) {
			peerId = id;
			console.log('ID: ' + id);
		});
		peer.on('error', function (err) {
			if (err.type === 'unavailable-id') {
				alert('' + err);
				peer.reconnect();
			}
			else
				alert('' + err);
		});
		return peer;
	};
	
	function join2(conn) {
		peer = initialize();
		peer.on('open', function () {
	
			if (conn) {
				conn.close();
			}
	
			if (peer) {
				peer.destroy();
			}
			
			// Create connection to shared PeerJS server
			conn = peer.connect(destId, {
				reliable: true
			});
			conn.on('open', function () {
				oppositePeer.peerId = destId;
				console.log("Connected to: " + destId)
				ready();
			});
		});
		return peer;
	};