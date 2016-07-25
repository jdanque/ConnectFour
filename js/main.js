/**
 * Connect Four
 * https://en.wikipedia.org/wiki/Connect_Four
 * Developer : Jobo Danque
 * Version : 0.1;
 * 
 * value on playing board (my.board.values)
 * 		0 = none
 * 		1 = player 1
 * 		2 = player 2
 * currentPlayer 
 * 		0 = player 1
 * 		1 = player 2
 * gameStatus
 * 		0 = started
 * 		1 = ended
 * 		2 = draw
 * 		3 = can't start, error in settings
 * game message codes
 * 		0 = Draw
 * 		1 = a Player wins
 */
var ConnectFour = (function($, my){
	
	my.settings = {
		
		numToWin : 4,
		
		board : {
			colSize : 7,
			rowSize : 6
		},
			
		player : [{
			name : "Player 1",
		},{
			name : "Player 2",
		}],
		
		updateSettings : function(){
			var namePlayer1 = $("#settings-name-player1").val(),
				namePlayer2 = $("#settings-name-player2").val(),
				colSize = $("#settings-size-col").val(),
				rowSize = $("#settings-size-row").val();
			
			if((!namePlayer1 || 0 === namePlayer1.length || !namePlayer1.trim())){
				my.settings.showSettingsError("Invalid Player 1 name");
				return false;
			}else if((!namePlayer2 || 0 === namePlayer2.length || !namePlayer2.trim())){
				my.settings.showSettingsError("Invalid Player 2 name");
				return false;
			}else if(isNaN(colSize) || colSize < 1){
				my.settings.showSettingsError("Invalid Column Size");
				return false;
			}else if(isNaN(rowSize) || rowSize < 1){
				my.settings.showSettingsError("Invalid Row Size");
				return false;
			}
			
			my.settings.player[0].name = namePlayer1;
			my.settings.player[1].name = namePlayer2;
			my.settings.board.colSize = colSize;
			my.settings.board.rowSize = rowSize;
			
			return true;
		},
		
		showSettingsError : function(message){
			$(".options-error-wrapper").show().html(message);
		},
		
		hideSettingsError : function(){
			$(".options-error-wrapper").hide().html("");
		},
		
		init : function(){
			my.settings.numToWin = 4;
			my.settings.board.colSize = 7;
			my.settings.board.rowSize = 6;
			my.settings.player = [{
				name : "Player 1",
			},{
				name : "Player 2",
			}];
			my.settings.hideSettingsError();
		},
	};

	//main initializer
	my.init = function(){
		my.settings.init();
		my.board.init();
		my.game.init();
		my.menu.init();
	};
	
	my.board = {
			
		colSize : 0,
		rowSize : 0,
		
		turnCount : 1,
			
		values : [],
		
		isFull : function(){
			my.board.turnCount++;
			if(my.board.turnCount > my.board.colSize * my.board.rowSize){
				my.game.status = 2;
				return true;
			}
			
			return false;
		},
		
		initClickHandler : function(){
			$(".playingField").off("click.playerClick","td").on("click.playerClick","td",function(){
				if(my.game.status) return false;
				
				var col = $(this).index(),
					player = my.game.currentPlayer + 1,
					row = my.board.rowSize-1;
				
				row = my.game.getEmptyRowIndex(col);
				
				if(row > -1){
					my.board.values[row][col] = player;
					
					//update ui
					$(".playingField").find("tbody")
										.find("tr").eq(row)
										.find("td").eq(col).toggleClass("player"+player,true);
					
					if(my.game.checkWinner(row,col,player)){
						my.game.showMessage(1,player);
					}else if(my.board.isFull()){
						my.game.showMessage(0);
					}else{
						my.game.switchPlayer();
					}
					
				}
				
			});
		},
		
		//initialize visual board and board values from settings
		init : function(){
			my.board.colSize = my.settings.board.colSize;
			my.board.rowSize = my.settings.board.rowSize;
			my.board.turnCount = 1;
			
			var playingField = $(".playingField"),
				boardHTML = "",
				row;
			my.board.values = [];
			
			for(row = 0;row<my.board.rowSize;row++){
				my.board.values[row] = new Array(my.board.colSize).fill(0);
				boardHTML += "<tr>" +
								"<td></td>".repeat(my.board.colSize) +
							 "</tr>";
			}
			
			$(".playerTurn").html(my.settings.player[my.game.currentPlayer].name);
			playingField.find('tbody').html(boardHTML);
			
			my.board.initClickHandler();
		}
	};
	
	my.game = {
		status : 0,
		currentPlayer : 0,
		
		showMessage : function(code){
			my.game.hideMessages();
			$(".gameMessage.code-"+code).closest(".gameMessage").show();
			$(".gameMessage-overlay").show();
			if(code){
				$(".gameMessage.code-"+code).find(".playerName").html(my.settings.player[my.game.currentPlayer].name);
			}
		},
		
		hideMessages : function(){
			$(".gameMessage").hide();
			$(".gameMessage-overlay").hide();
		},
		
		//start from the bottom
		//check for highest on this column that is not empty
		//returns -1 if column is full
		getEmptyRowIndex : function(column){
			var row = my.board.rowSize-1;
			while(row > -1 && my.board.values[row][column] | 0){
				row--;
			}
			return row;
		},
		
		switchPlayer : function(){
			my.game.currentPlayer = my.game.currentPlayer ^ 1;
			my.game.updatePlayerUI();
		},
		
		updatePlayerUI : function(){
			$(".playerTurn").removeClass('player1 player2')
			.toggleClass("player"+(my.game.currentPlayer+1))
			.html(my.settings.player[my.game.currentPlayer].name);
		},
		
		//Check if game has ended by a winning player
		checkWinner : function(row,col,player){
				
			var pieces = 1,
				
				//points, must >= min points to win
				horizontal = 1,
				vertical = 1,
				diagonalLeft = 1,
				diagonalRight = 1,
			
				//flags to check if can continue counting this direction
				countLeft = true,
				countRight = true,
				countUp = true,
				countDown = true,
				countLeftUp = true,
				countLeftDown = true,
				countRightUp = true,
				countRightDown = true;
					
			for(pieces = 1;pieces < my.settings.numToWin;pieces++){
				
				//store equations
				var prevRow = row - pieces,
					prevCol = col - pieces,
					nextRow = row + pieces,
					nextCol = col + pieces;
				
				//left side
				if(prevCol >= 0){
					if(countLeft && my.board.values[row][prevCol] == player){
						horizontal++;
					}else{
						countLeft = false;
					}
					
					if(countLeftUp && prevRow >= 0 && my.board.values[prevRow][prevCol] == player){
						diagonalLeft++;
					}else{
						countLeftUp = false;
					}
					
					if(countLeftDown && nextRow < my.board.rowSize && my.board.values[nextRow][prevCol] == player){
						diagonalRight++;
					}else{
						countLeftDown = false;
					}
				}
				
				
				//right side
				if(nextCol < my.board.colSize){
					if(countRight && my.board.values[row][nextCol] == player){
						horizontal++;
					}else{
						countRight = false;
					}
					
					if(countRightUp && prevRow >= 0 && my.board.values[prevRow][nextCol] == player){
						diagonalRight++;
					}else{
						countRightUp = false;
					}
					
					if(countRightDown && nextRow < my.board.rowSize && my.board.values[nextRow][nextCol] == player){
						diagonalLeft++;
					}else{
						countRightDown = false;
					}
				}
				
				//up
				if(prevRow >= 0){
					if(countUp && my.board.values[prevRow][col] == player){
						vertical++;
					}else{
						countUp = false;
					}
				}
				
				//down
				if(nextRow < my.board.rowSize){
					if(countDown && my.board.values[nextRow][col] == player){
						vertical++;
					}else{
						countDown = false;
					}
				}
				
			}
			
			my.game.status = (horizontal >= my.settings.numToWin ||
					vertical >= my.settings.numToWin ||
					diagonalLeft >= my.settings.numToWin ||
					diagonalRight >= my.settings.numToWin);
			
			return my.game.status;	
		},
		
		initClickHandler : function(){
			//overlay handler
			$("body").off("click.gameOverlayClick",".gameMessage-overlay").on("click.gameOverlayClick",".gameMessage-overlay",function(){
				my.game.hideMessages();
			});
			
			//play again click handler
			$("body").off("click.playAgain",".playAgain").on("click.playAgain",".playAgain",function(){
				my.game.hideMessages();
				my.board.init();
				my.game.init();
				my.menu.hide();
			});
		},
		
		init : function(){
			my.game.status = 0;
			my.game.currentPlayer = 0;
			my.game.updatePlayerUI();
			my.game.hideMessages();
			my.game.initClickHandler();
		}
	};
	
	
	my.menu = {
			
		initResetClickHandler : function(){
			$(".menu").off("click.reset","#settings-reset").on("click.reset","#settings-reset",function(){
				my.board.init();
				my.game.init();
				my.menu.hide();
				my.game.hideMessages();
			});
		},
		
		initApplySettingsHandler : function(){
			$(".menu").off("click.apply","#settings-apply").on("click.apply","#settings-apply",function(){
				if(confirm("This will reset the game. Continue?")){
					if(my.settings.updateSettings()){
						my.board.init();
						my.game.init();
						my.menu.hide();
					}else{
						my.game.status = 3;
					}
				}
			});
		},
		
		show : function(){
			$(".options").animate({
				left: 0
			},{
				duration: 200,
				complete : function(){
					$(".menuOverlay").show();
				}
			});
		},
		
		hide: function(){
			$(".options").animate({
				left: "-100em"
			},{
				duration: 200,
				complete : function(){
					$(".menuOverlay").hide();
					my.settings.hideSettingsError();
				}
			});
		},
		
		initMenuClickHandler : function(){
			$(".header").off("click.menuClick",".menu-icon").on("click.menuClick",".menu-icon",function(){
				my.menu.show();
			});
			$("body").off("click.menuOverlayClick",".menuOverlay").on("click.menuOverlayClick",".menuOverlay",function(){
				my.menu.hide();
			});
		},
		
		init : function(){
			my.menu.initMenuClickHandler();
			my.menu.initResetClickHandler();
			my.menu.initApplySettingsHandler();
		}	
	};
	
	return my;
})(jQuery, ConnectFour || {});

jQuery(document).ready(function(){
	ConnectFour.init();
});







