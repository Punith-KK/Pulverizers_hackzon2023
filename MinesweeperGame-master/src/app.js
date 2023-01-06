/* -----------------------------------------------------*/
/* -----------------------------------------------------*/
/* ------------------Global Variables------------------ */
/* -----------------------------------------------------*/
/* -----------------------------------------------------*/

// Canvas Variables
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');

// Initialize time of code compile
let then = Date.now();

// Initial Canvas size
canvas.width = 1000;
canvas.height = 600;

// Image Paths and Image Loading Variables
const cell0Path = "./assets/MINESWEEPER_0.png"; // 0
const cell1Path = "./assets/MINESWEEPER_1.png"; // 1
const cell2Path = "./assets/MINESWEEPER_2.png"; // 2
const cell3Path = "./assets/MINESWEEPER_3.png"; // 3
const cell4Path = "./assets/MINESWEEPER_4.png"; // 4
const cell5Path = "./assets/MINESWEEPER_5.png"; // 5
const cell6Path = "./assets/MINESWEEPER_6.png"; // 6
const cell7Path = "./assets/MINESWEEPER_7.png"; // 7
const cell8Path = "./assets/MINESWEEPER_8.png"; // 8
const cellXPath = "./assets/MINESWEEPER_X.png"; // 9
const minePath = "./assets/MINESWEEPER_M.png"; // 10
const flagPath = "./assets/MINESWEEPER_F.png"; // 11
const clockPath = "./assets/MINESWEEPER_C.png"; // 12
const trayPath = "./assets/MINESWEEPER_tray.png"; // 13
const resetPath = "./assets/reset.png"; // 14
const imageURLs = [cell0Path, cell1Path, cell2Path, cell3Path, cell4Path, cell5Path, cell6Path, cell7Path, cell8Path, cellXPath, minePath, flagPath, clockPath, trayPath, resetPath];
// Images will be loaded into the images array
const images = [];
// 
let imageCount = 0;
let allLoaded = false;

// Audio
const sounds = [];
const bombSound = "./assets/sounds/bomb.mp3";
let soundToPlay = 0;

// UI Controls
const heightForUI = 100;

// UI Parameters
const uiSettings = {
	colour: 'black',
	fontSize: 50,
	fontStyle: "Sans Serif"
};

// Booleans required for click listeners and chording
let rightHeld = false;
let leftHeld = false;

// Game Settings Size in Pixels
const gameSettings = {
	cellSize: 120,
	iconSize: 60
};

// Current Game Parameters (rows, cols, mines)
const currentGameParameters = {
	rows: 8,
	cols: 8,
	mines: 10,
	difficulty: 'Beginner'
};

// Reset Button Parameters (x,y coordinate, width and height)
const resetObject = {
	canvasX: 20,
	canvasY: 18,
	width: 213, // 71
	height: 63 // 21
};

// Clock Icon Parameters (x,y coordinate, length(width and height)
const clockIcon = {
	canvasX: 400,
	canvasY: 20,
	length: gameSettings.iconSize,
	// Text x, y coordinate
	textX: 460,
	textY: 25
};

// Mine Icon Parameters (x,y coordinate, length(width and height))
const mineIcon = {
	canvasX: 250,
	canvasY: 20,
	length: gameSettings.iconSize,
	// Text x, y coordinate
	textX: 310,
	textY: 25
}

// Time
let timeElapsed = 0;

// Cell Class
const Cell = function Cell(row, col, isMine) {
	// Coordinates of the cell location (0 to maximum board size)
	this.row = row;
	this.col = col;
	// Boolean whether the cell is a mine
	this.isMine = isMine;
	// Number of mines around the Cell
	this.activeNeighbours = 0;
	// Array of Cells that are around the cell
	this.neighbours = [];
	// Booleans whether the Cell is revealed or flagged
	this.revealed = false;
	this.flagged = false;
};

// Neighbour Setter for Cell
Cell.prototype.setNeighbours = function(neighbour) {
	this.neighbours.push(neighbour);
	// If neighbour is bomb, add 1 to its activeNeighbour number
	this.activeNeighbours += (neighbour.isMine ? 1 : 0);
};

// Neighbour getter for Cell
Cell.prototype.getNeighbours = function() {
	return this.neighbours;
};

// Method used to determine if game is ended. If all cells are either revealed or a mine, game ends
Cell.prototype.isRevealed = function() {
	return this.revealed || this.isMine;
}

// Reveal cell if it has been clicked
Cell.prototype.reveal = function() {

	// If mine is revealed, Game is over and stop function
	if (this.isMine) {
		// Reveal Mine
		this.revealed = true;
		// Game is over
		Game.over = true;
		// Call game.complete function and that game was not won
		Game.complete(false);
		playBombSound();
		return;
	};

	// Proceed as normal and propagate other nearby cell if current cell has 0 mines nearby
	this.revealed = true;
	// If the cell has no mines around it (reveal its neighbours)
	if (this.activeNeighbours === 0) {
		let neighbours = this.getNeighbours();
		for (let i = 0; i < neighbours.length; i++) {
			// if neighbour is not revealed and it isn't flagged, then reveal it
			if (!neighbours[i].isRevealed() && !neighbours[i].flagged) {
				neighbours[i].reveal();
			};
		};
	};
	// Check if game is completed with every reveal
	Board.validate();
};

// Flag cell only if it hasn't been revealed
Cell.prototype.flag = function() {
	// Can only flag if cell is not revealed
	if (!this.revealed) {
		// For Game Mode (No Mistakes)
		if (Game.noMistakes) {
			// Once flagged, you cannot unflag
			if (!this.flagged) {
				this.flagged = !this.flagged;
			};
		} else {
			// Other game modes, you can go back and forth
			this.flagged = !this.flagged;
		};
	};
};

// Chord the cell if number of flags around cell is same number as activeNeighbours
Cell.prototype.chord = function() {
	// Can only chord cells that are not mines
	if (!this.isMine) {
		// Get neighbours of the Cell
		let neighbours = this.getNeighbours();
		let flagged = 0;
		// Check how many neighbours are already flagged, and add to flagged variable
		for (let i = 0; i < neighbours.length; i++) {
			if (neighbours[i].flagged) {
				flagged++;
			};
		};
		// To chord, the number of flags around it must equal to its current number
		if (flagged == this.activeNeighbours) {
			for (let i = 0; i < neighbours.length; i++) {
				// Neighbours that aren't revealed or flagged will be revealed to chord
				if (!neighbours[i].revealed && !neighbours[i].flagged) {
					neighbours[i].reveal();
				};
			};
		};
	};
};

// Board object
const Board = {
	// 2D array of Cells
	board: [],
	// Object of mine locations e.g. {0: {1: true}}
	mineLocations: {},
	// Resets board properties with rows, cols, and number of mines
	reset: function(rows, cols, numMines) {
		this.cols = cols;
		this.rows = rows;
		// Empty the 2D array
		this.board = [];
		// Empty mine locations
		this.mineLocations = {};

		// Invoke generateMines method to add mines to mineLocations
		this.generateMines(numMines);

		// Update canvas size for different number of rows and cols
		updateCanvasSize(rows, cols);

		// Build board structure by pushing Cell class to board indices
		for (let row = 0; row < this.rows; row++) {
			rowArray = [];
			// Push an empty array to index
			this.board.push(rowArray);
			// Fill the empty array with Cell instances
			for (let col = 0; col < this.cols; col++) {
				let isMine = this.mineLocations[row] && this.mineLocations[row][col];
				// If mineLocations is not a mine, set it to false because it is not in mineLocations
				if (isMine == undefined) {
					isMine = false;
				};
				// Push Cell Instance to array
				rowArray.push(new Cell(row, col, isMine));
			};
		};

		// Fill the neighbours property with Cell references that are around the Cell for EVERY cell
		this.iterateCells((cell) => {
			// Initialize neighbours by calculating what the neighbours are
			let neighbours = this.calculateNeighbours(cell);
			for (let i = 0; i < neighbours.length; i++) {
				// Add a neighbour to the Cell iteratively
				cell.setNeighbours(neighbours[i]);
			}
		});
	},
	// Calls generateMine method for every mine preset
	generateMines: function(numMines) {
		// For number of mines, generate numBombs of mines
		for (let i = 0; i < numMines; i++) {
			this.generateMine();
		};
	},
	// Generate mine at a random location
	generateMine: function() {
		// Generates random col and row for mine
		let col = Math.floor(Math.random() * this.cols);
		let row = Math.floor(Math.random() * this.rows);

		// If duplicate exists, run function again
		// If statement checks if object for row exists first, then checks for row and col for bomb
		if (this.mineLocations[row] && this.mineLocations[row][col]) {
			return this.generateMine();
		};

		// Creates an object in mine location with value col if key does not exist, or uses existing key
		this.mineLocations[row] = this.mineLocations[row] || {};
		this.mineLocations[row][col] = true;
	},
	// Run a callback on each cell in the board
	iterateCells: function(callback) {
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				callback(this.getCell(row, col));
			};
		};
	},
	// Cell getter for an index on the board
	getCell: function(row, col) {
		return this.board[row][col];
	},
	// Returns an array of neighbours (cells) that the current cell is touching
	calculateNeighbours: function(cell) {
		let data = [];
		let row = cell.row;
		let col = cell.col;

		// Iterate through rows
		for (let i = row - 1; i <= row + 1; i++) {
			// Checks beyond upper and lower edge cases, if invalid index, move on to next iteration
			if (i < 0 || i >= this.rows) {
				continue;
			};
			// Iterate through columns
			for (let j = col - 1; j <= col + 1; j++) {
				// Checks beyond side cases, if invalid index, move on to next iteration
				if (j < 0 || j >= this.cols) {
					continue;
				};
				// Checks same indices, if same, move on to next iteration
				if (row == i && col == j) {
					continue;
				};
				// Append Cell to data array
				data.push(this.getCell(i, j));
			};
		};
		// Return an array of neighbours (cells)
		return data;
	},
	// Checks all cells on the board if either revealed or a mine.
	validate: function() {
		let numActive = 0;
		// Add 1 to numActive if cell isn't revealed or a mine
		this.iterateCells((cell) => {
			numActive += cell.isRevealed() ? 0 : 1;
		});
		// if numActive == 0, game is complete
		if (!numActive) {
			Game.complete(true);
		};
	},
	// Check how many cells are flagged
	checkFlags: function() {
		let numFlags = 0;
		// Add 1 to numFlags if cell is flagged
		this.iterateCells((cell) => {
			numFlags += cell.flagged ? 1 : 0;
		});
		return numFlags;
	}
};

// Game Object
const Game = {
	over: false,
	started: false,
	// Game Mode (No Flags)
	noFlags: false,
	// Game Mode (No Mistakes when flagging)
	noMistakes: false,
	wonGame: false,
	// Method when game is completed by winning or losing
	complete: function(win) {
		this.over = true;
		this.started = false;
		this.wonGame = win;
		// If won, run code
		if (win) {
			// Update UI and turn the overlay on, and change visibility of certain elements
			updateOverlayMessage();
			overlayOn();
			document.getElementById("options").style.visibility = "hidden";
			document.getElementById("endGame").style.visibility = "visible";
		};
	},
	// Starts game
	start: function() {
		leftHeld = false;
		rightHeld = false;
		// Gets current parameters for board reset
		let rows = currentGameParameters.rows;
		let cols = currentGameParameters.cols;
		let numMines = currentGameParameters.mines;

		// Resets board
		Board.reset(rows, cols, numMines);
		// Resets variables
		this.over = false;
		this.started = false;
		this.wonGame = false;
		// Reset time
		timeElapsed = 0;
		// Draw the board, but don't run main() for performance
		render();
	}
};


/* -----------------------------------------------------*/
/* -----------------------------------------------------*/
/* --------------------Functions------------------------*/
/* -----------------------------------------------------*/
/* -----------------------------------------------------*/

// Restricts width and height parameters to being between 8 and 40
const minMaxParameter = (parameter) => {
	if (parameter < 8) {
		return 8;
	} else if (parameter > 40) {
		return 40;
	} else {
		return parameter;
	};
};

// Restricts number of mines to being between 10 and maximum / 2
const minMaxMines = (mines, width, height) => {
	if (mines < 10) {
		return 10;
	} else if (mines > width * height / 2) {
		// credits to Kevin Mark for finding a bug here because I forgot to add Divide by 2
		return width * height / 2;
	} else {
		return mines;
	};
};

// Checks difficulty if custom settings are set (matches custom settings with default difficulties)
const checkDifficulty = (width, height, mines) => {
	if (width == 8 && height == 8 && mines == 10) {
		// Beginner Mode (Width: 8, Height: 8, Mines: 10)
		return 'Beginner';
	} else if (width == 16 && height == 16 && mines == 40) {
		// Intermediate Mode (Width: 16, Height: 16, Mines: 40)
		return 'Intermediate';
	} else if (width = 30 && height == 16 && mines == 99) {
		// Expert Mode (Width: 30, Height: 16, Mines: 99)
		return 'Expert';
	} else {
		return 'Custom';
	};
};

// Set level from predefined difficulty levels
const setLevel = (col, row, mines, difficulty) => {
	document.getElementById("width").value = col;
	document.getElementById("height").value = row;
	document.getElementById("mines").value = mines;

	changeGameParameters(difficulty);
};

// Change game parameters based on user input
const changeGameParameters = (difficulty) => {
	// Get values from input
	let width = document.getElementById("width").value;
	let height = document.getElementById("height").value;
	let mines = document.getElementById("mines").value;

	// Checks if parameters are within limits
	width = minMaxParameter(width);
	height = minMaxParameter(height);
	mines = minMaxMines(mines, width, height);

	// Double check if parameters are custom, parameters may be the same as predefined difficulty
	if (difficulty == 'Custom') {
		currentGameParameters.difficulty = checkDifficulty(width, height, mines);
	} else {
		currentGameParameters.difficulty = difficulty;
	};
	
	// Change colour of the buttons
	changeButtonColour(currentGameParameters.difficulty);

	// Change game parameter properties
	currentGameParameters.rows = height;
	currentGameParameters.cols = width;
	currentGameParameters.mines = mines;

	// Change DOM input values
	document.getElementById("width").value = width;
	document.getElementById("height").value = height;
	document.getElementById("mines").value = mines;

	// Turn off overlay when the game parameters are set
	overlayOff();

	// Reset board and game properties
	Game.start();
	resizeCanvas();
};

// Changes the colour of the buttons whenever they are pressed
const changeButtonColour = (difficulty) => {
	let beginner = document.getElementById("Beginner");
	let intermediate = document.getElementById("Intermediate");
	let expert = document.getElementById("Expert");
	let buttonArray = [beginner, intermediate, expert];

	// If the current game difficulty is what is selected, highlight it green, and the others red
	for (let i = 0; i < buttonArray.length; i++) {
		if (difficulty != buttonArray[i].id) {
			buttonArray[i].className = "h3 notSelected";
		} else {
			buttonArray[i].className = "h3 selected";
		};
	};
};

// Plays the bomb sound
const playBombSound = () => {
	let sound = sounds[soundToPlay % sounds.length];
	sound.play();
	soundToPlay++;
}

// Load sounds to the page to play
const soundInit = () => {
	for (let i = 0; i < 2; i++) {
		let sound = new Audio();
		sound.src = bombSound;
		sounds.push(sound);
	};
};

// Load all images used to image array for drawing
const imageInit = () => {
	// Loop through each URL in imageURLs
	imageURLs.forEach(src => {
		const image = new Image();
		image.src = src;
		// Increment image count
		imageCount++;
		// This method is called when the image is successfully loaded
		image.onload = () => {
			// When image count is equal to the number of images that are supposed to load, then render
			if (imageCount == imageURLs.length) {
				// When all images have loaded
				allLoaded = true;
				// Render canvas when images are done loading
				render();
			};
		};
		// Push the image to the images array in global variables
		images.push(image);
	});
};


// Get mouse position on Canvas
const getMousePos = (canvas, event) => {
	let rect = canvas.getBoundingClientRect();
	// Return mouse click position based on canvas location on browser
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top
	};
};

// Checks the state if game has started
const checkToStartGame = (cell) => {
	let row = cell.row;
	let col = cell.col;
	// Keep changing board if the starting reveal's cell activeNeighbours isn't 0 or is mine
	while (Board.getCell(row, col).activeNeighbours != 0 || Board.getCell(row, col).isMine) {
		Board.reset(currentGameParameters.rows, currentGameParameters.cols, currentGameParameters.mines);
	};
	// Start game
	Game.started = !Game.started;
	// Initiates the start of the game time
	then = Date.now();
	// Once a cell is revealed, start game loop
	main();
};

// Resize Canvas
const resizeCanvas = () => {
	let rows = Board.rows;
	let cols = Board.cols;
	// Calculate the maximum width/height size of a Cell that the screen supports
	let widthSize = document.getElementById("game").offsetWidth / cols;
	let heightSize = (window.innerHeight - 160 - heightForUI) / rows;
	// Set the Cell sizes to the minimum size that the page allows to fit the board in
	if (widthSize < heightSize) {
		gameSettings.cellSize = widthSize;
	} else {
		gameSettings.cellSize = heightSize;
	}
	// Update Canvas UI positions
	updateUI();
	// Update canvas size based on number of rows and columns
	updateCanvasSize(rows, cols);

	// Whenever the canvas is resized, always render
	render();
}

// Readjust Canvas UI positions when the browser height is changed for page responsiveness
const updateUI = () => {
	let currentHeight = window.innerHeight;
	// Height is less than 575
	if (currentHeight < 575) {
		resetObject.width = 71;
		resetObject.height = 21;

		mineIcon.length = 30;
		mineIcon.canvasX = 100;
		mineIcon.textX = 140;

		clockIcon.length = 30;
		clockIcon.canvasX = 100;
		clockIcon.canvasY = 60;
		clockIcon.textX = 140;
		clockIcon.textY = 65;

		uiSettings.fontSize = 20;
	// Height is less than 788
	} else if (currentHeight < 788) {
		resetObject.width = 213;
		resetObject.height = 63;

		mineIcon.length = 30;
		mineIcon.textX = 290;
		mineIcon.canvasX = 250;

		clockIcon.length = 30;
		clockIcon.canvasX = 250;
		clockIcon.canvasY = 60;
		clockIcon.textX = 290;
		clockIcon.textY = 65;

		uiSettings.fontSize = 20;
	// Height is more than 788
	} else {
		resetObject.width = 213;
		resetObject.height = 63;

		mineIcon.length = 60;
		mineIcon.textX = 310;
		mineIcon.canvasX = 250;

		clockIcon.length = 60;
		clockIcon.textX = 460;
		clockIcon.textY = 25;
		clockIcon.canvasX = 400;
		clockIcon.canvasY = 20;

		uiSettings.fontSize = 50;
	}
}

// Add Event Listeners to the Page
const addEventListeners = () => {
	// Mouse down event listener (both left and right click)
	canvas.addEventListener("mousedown", (event) => {
		// Prevents default behaviour of a mouse click e.g. right click opens context menu
		event.preventDefault();

		// Event button of left click is 0, right click is 2
		// If event button is 0, then left click is true
		let leftClick = (event.button == 0) ? true : false;

		// Change global variable booleans for chording function
		if (leftClick) {
			leftHeld = true;
		} else {
			rightHeld = true;
		};

		// Get x, y mouse position of CANVAS from getMousePos function
		let mousePos = getMousePos(canvas, event);

		// If it's not a left click, call click function (Right click interacts with game on mouse down)
		if (!leftClick) {
			click(event, mousePos.x, mousePos.y);
		};
	});
	// Mouse up event listener (both left and right click)
	canvas.addEventListener("mouseup", (event) => {
		// Prevents default behaviour of a mouse click e.g. right click opens context menu
		event.preventDefault();

		// Event button of left click is 0, right click is 2
		// If event button is 0, then left click is true
		let leftClick = (event.button == 0) ? true : false;

		// Change global variable booleans for chording function
		if (leftClick) {
			leftHeld = false;
		} else {
			rightHeld = false;
		};

		// Get x, y mouse position of CANVAS from getMousePos function
		let mousePos = getMousePos(canvas, event);

		// If it's a left click, call click function (Left click interacts with game on mouse up)
		if (leftClick) {
			click(event, mousePos.x, mousePos.y);
		};
	});

	// Remove Right Click from opening context menu
	window.addEventListener("contextmenu", (event) => {
		// Prevents default behaviour of a mouse click e.g. right click opens context menu
		event.preventDefault();
	}, false);

	// Event listener for resizing window
	window.addEventListener('resize', resizeCanvas, false);
};

// Click handler function
const click = (event, x, y) => {
	// Event button of left click is 0, right click is 2
	// If event button is 0, then left click is true
	let leftClick = (event.button == 0) ? true : false;

	// Get cell row and cell col from the click position
	let cellRow = parseInt((y  - heightForUI) / gameSettings.cellSize);
	let cellCol = parseInt(x / gameSettings.cellSize);

	// Left click handler
	if (leftClick && !leftHeld) {
		// UI Interaction with Reset Button only (Checks if the left click is within the reset button parameters)
		if (x >= resetObject.canvasX && x <= resetObject.canvasX + resetObject.width && 
			y >= resetObject.canvasY && y <= resetObject.canvasY + resetObject.height) {
			Game.start();
			return;
		};
		// Check if click is on game board
		if (1 / cellRow > 0 && 0 <= cellRow && cellRow < Board.rows && 0 <= cellCol && cellCol <= Board.cols) {
			// Initialize which Cell was accessed
			let cell = Board.getCell(cellRow, cellCol);

			// If right click is held, then chord the cell
			if (rightHeld) {
				cell.chord();
			} else {
				// If game has not started, start game
				if (!Game.started && !Game.over) {
					checkToStartGame(cell);
					// Get new board's cell in case the board was changed while starting game
					Board.getCell(cellRow, cellCol).reveal();
				} else {
					if (!cell.flagged && !Game.over) {
						// If cell isn't revealed or game isn't over, reveal the cell
						cell.reveal();
					};
				};
				
			};
		};
	}
	// Right click handler
	if (!leftClick && rightHeld && Game.started) {
		if (1 / cellRow > 0 && 0 <= cellRow && cellRow < Board.rows && 0 <= cellCol && cellCol <= Board.cols) {
			let cell = Board.getCell(cellRow, cellCol);

			// If left click is held, chord the cell
			if (leftHeld) {
				cell.chord();
			} else if (!Game.noFlags) {
				// Flag the cell if the game is not in no flagged mode
				cell.flag();
			};
		};
	};
}

// Update Canvas Size when size of the board changes based on number of rows and cells
const updateCanvasSize = (rows, cols) => {
	canvas.height = rows * gameSettings.cellSize + heightForUI;
	canvas.width = cols * gameSettings.cellSize;
};



// Draw tray above board for UI
const drawTray = () => {
	ctx.drawImage(images[13], 0, 0, canvas.width, heightForUI);
};

// Draw clock icon for amount of time taken to play
const drawClock = () => {
	ctx.drawImage(images[12], clockIcon.canvasX, clockIcon.canvasY, clockIcon.length, clockIcon.length);

	// Draw text of time elapsed
	ctx.fillStyle = uiSettings.colour;
	ctx.font = `${uiSettings.fontSize}px ${uiSettings.fontStyle}`;
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText(`${timeElapsed.toFixed(1)}`, clockIcon.textX, clockIcon.textY);
};

// Draw mine icon for number of mines left
const drawMinesLeft = () => {
	ctx.drawImage(images[10], mineIcon.canvasX, mineIcon.canvasY, mineIcon.length, mineIcon.length);

	// Draw text of number of mines left
	ctx.fillStyle = uiSettings.colour;
	ctx.font = `${uiSettings.fontSize}px ${uiSettings.fontStyle}`;
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText(`${currentGameParameters.mines - Board.checkFlags()}` , mineIcon.textX, mineIcon.textY);
};

// Draw Restart button on UI tray
const drawRestartButton = () => {
	ctx.drawImage(images[14], resetObject.canvasX, resetObject.canvasY, resetObject.width, resetObject.height);
};

// Render function that draws on canvas
const render = () => {
	// Clear canvas everytime you draw
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw UI Elements (Order matters, Tray will be drawn first, then other elements)
	drawTray();
	drawClock();
	drawMinesLeft();
	drawRestartButton();

	// Draw cells of the board
	for (let col = 0; col < Board.cols; col++) {
		for (let row = 0; row < Board.rows; row++) {

			let cellNumber = Board.getCell(row, col);
			// Can only draw when the images have all been loaded
			if (allLoaded) {
				if (cellNumber.flagged) {
					// Image instance, x, y, width, height
					// Draw flag if cell is flagged
					ctx.drawImage(images[11], col * gameSettings.cellSize, heightForUI + row * gameSettings.cellSize, gameSettings.cellSize, gameSettings.cellSize);
				} else {
					if (!cellNumber.revealed) {
						// Draw default cell if cell is not revealed
						ctx.drawImage(images[9], col * gameSettings.cellSize, heightForUI + row * gameSettings.cellSize, gameSettings.cellSize, gameSettings.cellSize);
					}
					if (cellNumber.revealed) {
						if (cellNumber.isMine) {
							// Draw mine if revealed
							ctx.drawImage(images[10], col * gameSettings.cellSize, heightForUI + row * gameSettings.cellSize, gameSettings.cellSize, gameSettings.cellSize);
						} else {
							// Draw number when revealed and not mine
							ctx.drawImage(images[cellNumber.activeNeighbours], col * gameSettings.cellSize, heightForUI + row * gameSettings.cellSize, gameSettings.cellSize, gameSettings.cellSize);
						};
					};
				};
			};
		};
	};
};

// Update function that updates variables as game is played
// modifier = time in seconds
const update = (modifier) => {
	// Update Time Elapsed when Game has started and when Game isn't over
	if (Game.started && !Game.over) {
		if (timeElapsed >= 999) {
			timeElapsed = 999;
		} else {
			timeElapsed += modifier;
		};
	};
};

// Main game loop
const main = () => {

	let now = Date.now();
	// Time elapsed in milliseconds
	let delta = now - then;

	then = now;
	// Divide delta by 1000 to get time in seconds
	update(delta / 1000);

	render();
	
	// If game has started, keep running game loop. Otherwise, don't keep running game loop for performance
	if (Game.started) {
		requestAnimationFrame(main);
	};
};

// Initialize game
const initialize = () => {
	// Load Images
	imageInit();
	// Load Sounds
	soundInit();

	// Add Event Listeners (click)
	addEventListeners();

	Game.start();
	resizeCanvas();
	main();
};

initialize();

