"use strict"

$(document).ready(function() {
	var done = true, played=[], tiles = $(".tile").toArray(),
		player, opponent, playerTurn,
		boardArr = [[" "," "," "],[" "," "," "],[" "," "," "]];
		
	//Assign click function to each tile.
	$(".tile").click(function() {
		//Game isn't over and tile hasn't been played
		if (!done && !played.includes(this.id)){
			//add tile to played and determine played tile.
			played.push(this.id)
			var num = tiles.indexOf(this);
			var row = Math.floor(num/3);
			var col = num%3;
			
			animateMove(this, player, boardArr, row, col, played);
			boardArr[row][col] = player;

			//Either CPU's turn or swap letter for player 2
			if($("#against").is(':checked')){
				cpuMove(boardArr, played);
			}else{
				var temp = player;
				player = opponent;
				opponent =temp;
			}
		}
	});

	//Start and Restart the game via button
	$("#start-btn").click(function() {
		var btnText = $("#start-btn span");
		
		//If true, restarts the game, else starts the game
		if(this.dataset.started=="true"){
			//Reset variables and button text, enable toggles
			$(".tile").html($("<canvas></canvas>"));
			done = true;
			played = [];
			boardArr = [[" "," "," "],[" "," "," "],[" "," "," "]];
			this.dataset.started = false;
			btnText.slideUp(375, function() {
				btnText.text('Start').slideDown(375);
			});

			$(".toggle input").removeAttr("disabled");
		}else{
			//Change button text, disable toggles, check if cpu turn
			this.dataset.started = true;
			console.log(this.dataset.started);
			btnText.slideUp(375, function() {
				btnText.text('Restart').slideDown(375);
			});
			
			$(".toggle input").attr("disabled", true);

			done = false;
			if($("#against").is(":checked") && $("#first").is(":checked")){
				player = "O";
				opponent = "X";
				cpuMove(boardArr, played);
			}else{
				player = "X";
				opponent = "O";
			}
		}

	})
})

//Check if a player has won and display end game message
function checkWin(boardArr, row, col, played){
	//first time for possible win is turn 5
	if(played.length >= 5 && checkTile(boardArr,row,col)){
		done=true;
		if(played.length % 2 == 0){
			alert("Player O has won!");
		} else{
			alert("Player X has won!");
		}
	}else if(played.length == 9){
		done=true;
		alert("Tie");
	}
}

//Checks the rows,columns and diagonals of last played
//tile, since thats the only place where a win could occur.
function checkTile(boardArr, row, col){
	//Check the row of the last played tile
	if(boardArr[row][0] != " " && boardArr[row][0] == boardArr[row][1] &&
		boardArr[row][1] == boardArr[row][2]){
			return true;
		}

	//Check the col of the last played tile
	if(boardArr[0][col] != " " && boardArr[0][col] == boardArr[1][col] &&
		boardArr[1][col] == boardArr[2][col]){
			return true;
		}

	//Check first diagonal
	if (row==col && boardArr[0][0] != " " && boardArr[0][0] == boardArr[1][1] &&
		boardArr[1][1] == boardArr[2][2]){
		return true;
	}

	//Check second diagonal
	if (row+col == 2 && boardArr[2][0] != " " && boardArr[2][0] == boardArr[1][1] &&
		boardArr[1][1] == boardArr[0][2]){
		return true;
	}
}

//When a move is made, animate the letter being drawn
function animateMove(tile, letter, boardArr, row, col, played){
	//Grab context and set variables
	var ctx = tile.querySelector("canvas").getContext("2d"),
    dashLen = 156, dashOffset = dashLen, speed = 4,
	x = 115, y = 120;

	ctx.font = "110px Verdana, cursive, TSCu_Comic, sans-serif"; 
	ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.globalAlpha = 2/3;
	ctx.strokeStyle = ctx.fillStyle = "#1f2f90";

	//Small Adjustments for proper centering and animation
	if(letter == "X"){
		dashLen = 250;
		x=120;
	}
	
	(function loop() {
		//Clear canvas and draw part of the letter
		ctx.clearRect(0, 0, 200, 200);
		ctx.setLineDash([dashLen - dashOffset, dashOffset-speed]);
		dashOffset -= speed;
		ctx.strokeText(letter, x, y);

		//Once animation completes, fill in the character
		if (dashOffset > 0)
			requestAnimationFrame(loop);
		else {
			ctx.fillText(letter, x, y);
			checkWin(boardArr,row,col, played)
		}
	})();
}

function cpuMove(boardArr,played){
	var move = boardArr[0].indexOf(" "),
	move2 = boardArr[1].indexOf(" "),
	move3 = boardArr[2].indexOf(" "),
	letter;
	if($("#first").is(":checked")){
		letter="X";
	}else{
		letter="O";
	}

	if(move>=0){
		boardArr[0][move] = letter;
		animateMove($(".tile")[move],letter);
		played.push($(".tile")[move]);
	}else if(move2>=0){
		boardArr[1][move2] = letter;
		animateMove($(".tile")[move2+3],letter);
		played.push($(".tile")[move2+3]);
	}else if(move3>=0){
		boardArr[2][move3] = letter;
		animateMove($(".tile")[move3+6],letter);
		played.push($(".tile")[move3+6]);
	}
	console.log(boardArr);
}