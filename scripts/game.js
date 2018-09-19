"use strict"

$(document).ready(function () {
	//Define object to contain game variables. This makes
	//it easier to pass many variables to functions.
	var game = {};
	gameReset(game, true);

	//Define personal peer and connection objects.
	var peer = null,
		conn = null,
		host = true;

	//Define objects that refer to frequently accessed DOM elements
	var cpuTgl = $("#against"),
		firstTgl =  $("#first");

	//hide online elements
	$(".online").hide();

	//Play a move by clicking on a tile.
	game.tiles.click(function () {
		//Game isn't over and tile hasn't been played
		if (!game.done && game.playerTurn && !game.played.includes(this.id)) {
			//Add tile to played and board and animate Move.
			var num = game.tiles.index(this);
			game.played.push(this.id);
			game.row = Math.floor(num / 3);
			game.col = num % 3;
			game.boardArr[game.row][game.col] = game.player;
			if(!conn){
				game.playerTurn = false;
			}
			animateMove(this, game.player, game, true, conn);
			//If not playing against CPU, swap letters.
			if (!cpuTgl.is(':checked') && !conn) {
				game.playerTurn = true;
				var temp = game.player;
				game.player = game.opponent;
				game.opponent = temp;
			}
		}
		//Send move to opponent
		if (conn && !game.done && game.playerTurn) {
			conn.send(JSON.stringify(["move", game]));
		}
	});

	//Start and restart the game by clicking button
	$("#start-btn").click(function () {
		var btnText = $("#start-btn span");

		//If true, restarts the game, else starts the game
		if (this.dataset.started == "true") {
			gameReset(game);

			//Modify button data and text
			this.dataset.started = false;
			btnText.slideUp(225, function () {
				btnText.text('Start').slideDown(225);
			});

			//Re-enable toggles
			cpuTgl.removeAttr("disabled");
			firstTgl.removeAttr("disabled");
			$("#switch").removeAttr("disabled");
		} else {
			//Modify button data and text
			this.dataset.started = true;
			btnText.slideUp(225, function () {
				btnText.text('Restart').slideDown(225);
			});

			//Disables toggles while in game
			cpuTgl.attr("disabled", true);
			firstTgl.attr("disabled", true);
			$("#switch").attr("disabled", true);
			game.done = false;
			//If not connected to anyone, set player X and O
			if (!conn) {
				if (cpuTgl.is(":checked") && firstTgl.is(":checked")) {
					game.player = "O";
					game.opponent = "X";
					cpuMove(game);
				} else {
					game.player = "X";
					game.opponent = "O";
				}
			}
			if(game.player=="X")
				game.playerTurn = true;
		}

		//Synchronize browsers
		if (host && conn) {
			conn.send(JSON.stringify(["start"]));
		}
	});

	//Connect to a host, host must be listening for a connection
	$("#connect").click(function () {
		//Register ID with server
		peer = initialize();
		
		//Connect to host via their id
		conn = peer.connect($("#uid").val());

		//Listener that runs when a connection is opened
		conn.on("open", function () {
			host = false;
			$("#start-btn").attr("disabled", true);
			game.player = "O";
			game.opponent = "X";
			$("#yourLetter").text(game.player);
			$("#oppLetter").text(game.opponent);
			//uncheck and disable toggles
			cpuTgl.prop('checked',false).attr("disabled", true);
			firstTgl.prop('checked',false).attr("disabled", true);
			conn.send(JSON.stringify(["peerID",peer.id]))
			$("#uid").prop('readonly',true);
		});

		//Set other listeners
		ready(peer, conn, game);
	});

	//Listen for incoming connections
	$("#host").click(function () {
		//Register ID with server
		peer = initialize();

		//Listen for incoming connection
		peer.on('connection', function (c) {
			conn = c;
			game.player = "X";
			game.opponent = "O";
			$("#yourLetter").text(game.player);
			$("#oppLetter").text(game.opponent);
			//uncheck and disable toggles
			cpuTgl.prop('checked',false).attr("disabled", true);
			firstTgl.prop('checked',false).attr("disabled", true);
			//Set other listeners
			$("#uid").prop('readonly',true);
			ready(peer, conn, game);
		});
	});

	$("#close").click(function () {
		peer.disconnect();
		peer.destroy();
		conn = null;
		peer = null;
		host = true;
	});

	$("#switch").click(function () {
		conn.send(JSON.stringify(["switch"]));
		var temp = game.player;
		game.player = game.opponent;
		game.opponent = temp;
		$("#yourLetter").text(game.player);
		$("#oppLetter").text(game.opponent);
	});
})

/**
 * Populate the game variable
 * @param {Object} g - Empty game variable
 * @param {boolean} first - If the first time function has been called
 */
function gameReset(g, first) {
	if (first)
		g.tiles = $("#board td");
	g.done = true;
	g.played = [];
	g.row = -1;
	g.col = -1;
	g.player;
	g.playerTurn = false;
	g.opponent;
	g.boardArr = [[" ", " ", " "], [" ", " ", " "], [" ", " ", " "]];
	g.tiles.html($("<canvas></canvas>"));
}

/**
 * When a move is made, animate the letter being drawn
 * @param {Object} tile - The tile to draw the letter on
 * @param {string} letter - The letter to be drawn
 * @param {Object} game - Collection of game variables
 * @param {boolean} cpuTurn - whether CPU should take a turn after animation
 * @param {Object} conn - Connection to other player
 */
function animateMove(tile, letter, game, cpuTurn, conn) {
	//Grab context and set variables
	var ctx = tile.querySelector("canvas").getContext("2d"),
		dashLen = 156, dashOffset = dashLen, speed = 4,
		x = 115, y = 120;
	ctx.font = "110px cursive, Mistral, OCR A Extended, Comic Sans MS";
	ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.globalAlpha = 2 / 3;
	ctx.strokeStyle = ctx.fillStyle = "#1f2f90";

	//Small Adjustments for proper centering and animation
	if (letter == "X") {
		dashLen = 250;
		x = 120;
	}

	(function loop() {
		//Clear canvas and draw part of the letter
		ctx.clearRect(0, 0, 200, 200);
		ctx.setLineDash([dashLen - dashOffset, dashOffset - speed]);
		dashOffset -= speed;
		ctx.strokeText(letter, x, y);

		//Once animation completes, fill in the character
		//check for wins and continue game.
		if (dashOffset > 0)
			requestAnimationFrame(loop);
		else {
			ctx.fillText(letter, x, y);
			checkWin(game, conn);
			if (cpuTurn && $("#against").is(':checked') && !game.done) {
				cpuMove(game);
			}else if (conn){
					game.playerTurn = !game.playerTurn;
			}else if(!cpuTurn && $("#against").is(':checked')){
				game.playerTurn = true;
			}
		}
	})();
}

/**
 * Check if a player has won and display end game message
 * @param {*} game - Collection of game variables
 * @param {Object} conn - Connection to other player
 */
function checkWin(game, conn) {
	var win = checkTile(game.boardArr, game.row, game.col);
	
	if (win[0]) {
		game.done = true;
		if ($("#against").is(":checked")) {
			//Messages when playing against computer
			if (game.player == win[1])
				alert("You won!");
			else
				alert("Computer has won!");
		} else if (conn){
			if (game.player == win[1])
				alert("You won!");
			else
				alert("Opponent has won!");
		}else{
			//General win message
			alert("Player " + win[1] + " has won!");
		}
	} else if (game.played.length == 9) {
		game.done = true;
		alert("Tie");
	}
}

/**
 * Checks the rows, columns and diagonals of last played
 * tile, since thats the only place where a win could occur.
 * @param {Array} boardArr - double array of game board
 * @param {integer} row - row to check
 * @param {integer} col - column to check
 * @returns {Object} Contains true|false and winning letter
 */
function checkTile(boardArr, row, col) {
	//Check the row of the last played tile
	if (boardArr[row][0] != " " && boardArr[row][0] == boardArr[row][1] &&
		boardArr[row][1] == boardArr[row][2]) {
		return [true, boardArr[row][0]];
	}

	//Check the col of the last played tile
	if (boardArr[0][col] != " " && boardArr[0][col] == boardArr[1][col] &&
		boardArr[1][col] == boardArr[2][col]) {
		return [true, boardArr[0][col]];
	}

	//Check first diagonal if necessary
	if (row == col && boardArr[0][0] != " " && boardArr[0][0] == boardArr[1][1] &&
		boardArr[1][1] == boardArr[2][2]) {
		return [true, boardArr[0][0]];
	}

	//Check second diagonal if necessary
	if (row + col == 2 && boardArr[2][0] != " " && boardArr[2][0] == boardArr[1][1] &&
		boardArr[1][1] == boardArr[0][2]) {
		return [true, boardArr[2][0]];
	}

	return [false];
}

/**
 * Calculates best possible move and then makes it.
 * @param {Object} game - Collection of game variables
 */
function cpuMove(game) {
	var temp = jQuery.extend(true, {}, game),
		best = bestMove(temp),
		tileNum = best.row * 3 + best.col + 1;

	game.boardArr[best.row][best.col] = game.opponent;
	game.row = best.row;
	game.col = best.col;
	game.played.push($(".tile")[tileNum - 1].id);
	animateMove($(".tile")[tileNum - 1], game.opponent, game, false);
}

/**
 * Determines the points to be assigned to a move made in the minimax function.
 * @param {Object} game - Deep copy of original game Object
 * @returns {integer} - score based on if someone has won
 */
function getScore(game) {
	var win = checkTile(game.boardArr, game.row, game.col);
	if (win[0]) {
		//Win for player produces negative points,
		//otherwise win for CPU produces positive points
		if (win[1] == game.player) {
			return -20;
		} else {
			return 20;
		}
	}
	//No win so zero score
	return 0;
}

/**
 * Evaluate every possible move and return a score.
 * @param {Object} game - Deep copy of orginal game Object
 * @param {integer} depth - how many times the function has recursively called
 * @param {boolean} runMax - whether the max or min function should run
 * @returns {integer} - best score for the current move
 */
function minimax(game, depth, runMax) {
	
	var score = getScore(game);
	//Computer won game
	if (score == 20)
		return score - depth;
	
	//Opponent won game
	if (score == -20)
		return score + depth;
	
	//Tie
	if (jQuery.inArray(" ", game.boardArr[0]) == -1 &&
		jQuery.inArray(" ", game.boardArr[1]) == -1 &&
		jQuery.inArray(" ", game.boardArr[2]) == -1)
		return 0;

	//If it is the computers move, else make move for player
	if (runMax) {
		var best = -400;
		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 3; j++) {
				// Check if tile is empty
				if (game.boardArr[i][j] == ' ') {
					game.boardArr[i][j] = game.opponent;
					game.row = i;
					game.col = j;

					//Recursive call, choose max value, reset tile
					best = Math.max(best, minimax(game, depth + 1, !runMax));
					game.boardArr[i][j] = ' ';
				}
			}
		}
	} else {
		var best = 400;
		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 3; j++) {
				// Check if tile is empty
				if (game.boardArr[i][j] == ' ') {
					game.boardArr[i][j] = game.player;
					game.row = i;
					game.col = j;
					
					//Recursive Call, choose min value, reset tile
					best = Math.min(best, minimax(game, depth + 1, !runMax));
					game.boardArr[i][j] = ' ';
				}
			}
		}
	}
	return best;
}

/**
 * This will return the best possible move for the AI based on the minimax function
 * @param {Object} game - Deep copy of orginal game Object
 * @returns {Object} contains best move's value, row, and column
 */
function bestMove(game) {
	var best = {};
	best.row = -1;
	best.col = -1;
	best.val = -100;

	//Test every tile and pick the best move.
	for (var i = 0; i < 3; i++) {
		for (var j = 0; j < 3; j++) {
			if (game.boardArr[i][j] == " ") {
				//Make a move
				game.boardArr[i][j] = game.opponent;
				game.row = i;
				game.col = j;
				
				//Run simulations and undo move
				var moveVal = minimax(game, 0, false);
				game.boardArr[i][j] = ' ';

				//Check if there is a better move and replace
				if (moveVal > best.val) {
					best.row = i;
					best.col = j;
					best.val = moveVal;
				}
			}
		}
	}
	return best;
}

/**
 * Create own peer object with connection to shared PeerJS server
 * @returns {Object} Newly created peer
 */
function initialize() {
	var id = randomID();
	var peer = new Peer(id, {
		debug: 2
	});

	peer.on('open', function (id) {
		$("#yourID").val(id);
	});

	peer.on('error', function (err) {
			console.log('' + err);
	});

	//Runs when peer is destroyed
	peer.on('close', function () {
		$("#start-btn").removeAttr("disabled");
		$("#against").removeAttr("disabled");
		$("#first").removeAttr("disabled");
		$(".online").hide();
		$("#uid").prop('readonly',false);
	});

	$(".online").show();
	return peer;
};

/**
 * Create important listeners for connection.
 * @param {Object} peer - Own peer object
 * @param {Object} conn - Connection to other player
 * @param {Object} game - Collection of game variables
 */
function ready(peer, conn, game) {
	//Runs when data is received
	conn.on('data', function (data) {
		data = JSON.parse(data);

		switch (data[0]) {
			//Display peer's ID
			case 'peerID':
				$("#uid").val(data[1]);
				break;
			//Sync with host's game
			case 'start':
				$("#start-btn").trigger("click");
				break;
			//Animate opponent's move
			case 'move':
				game.boardArr = data[1].boardArr;
				game.played = data[1].played;
				game.row = data[1].row;
				game.col = data[1].col;
				var tileNum = data[1].row * 3 + data[1].col + 1;
				animateMove($(".tile")[tileNum - 1], game.opponent, game, true, conn);
				break;
			//Switch letter's with opponent
			case 'switch':
				var temp = game.player;
				game.player = game.opponent;
				game.opponent = temp;
				$("#yourLetter").text(game.player);
				$("#oppLetter").text(game.opponent);
				break;
		}
	});

	//Runs when connection is closed
	conn.on('close', function () {
		conn = null;
		gameReset(game, true);
	});

	//Set game status to start
	if($("#start-btn span").text() == "Restart")
		$("#start-btn").trigger("click");
}

/**
 * Generates an easily readable ID
 * @returns {string}
 */
function randomID(){
	var adjArr = ["icy", "quick", "small", "slippery", "gullible", "victorious", "fuzzy", 
		"silly", "tense", "curvy", "lethal", "sneaky", "grumpy", "handy", "ambitious"]
	var animArr = ["cougar", "coyote", "dog", "chimpanzee", "parrot", "chicken", "hog", 
		"walrus", "marten", "stallion", "mouse", "ermine", "rabbit", "snake", "panda"]
	var randAdj = adjArr[getRndInteger(0, adjArr.length)];
	var randAnim = animArr[getRndInteger(0, animArr.length)];
	var randInt = getRndInteger(100, 1000);
	return randAdj.concat('-',randAnim,'-',randInt);
}
/**
 * Generate a random number
 * @param {integer} min - minimum number, inclusive
 * @param {integer} max - maximum number, exclusive
 * @returns {integer}
 */
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}