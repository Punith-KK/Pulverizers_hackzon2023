// No flagging mines allowed
const noFlagMode = () => {
	// Can only change mode if game hasn't started
	if (!Game.started) {
		Game.noFlags = !Game.noFlags;
	};

	// Change class of the button depending on truthiness of mode 
	if (Game.noFlags) {
		document.getElementById("noFlags").className = "h3 selected"; // green
	} else {
		document.getElementById("noFlags").className = "h3 notSelected"; // red
	};
};

// No mistakes with Flagging allowed
const noMistakesMode = () => {
	// Can only change mode if games hasn't started
	if (!Game.started) {
		Game.noMistakes = !Game.noMistakes;
	};

	// Change class of the button depending on truthiness of mode
	if (Game.noMistakes) {
		document.getElementById("noMistakes").className = "h3 selected"; // green
	} else {
		document.getElementById("noMistakes").className = "h3 notSelected"; // red
	};
};

// Turn overlay message on
const overlayOn = () => {
	document.getElementById("overlay").style.display = 'block'; // visible
	// If the game was completed in custom mode, don't let the user submit their score by 
	// hiding the submit button
	if (currentGameParameters.difficulty == 'Custom') {
		document.getElementById("noCustom").style.display = "none"; // invisible
	} else {
		document.getElementById("noCustom").style.display = "block"; // visible
	}
};

// Turn overlay element off
const overlayOff = () => {
	document.getElementById("overlay").style.display = 'none';
};

// Activate the options overlay when button is pressed
const activateOptions = () => {
	// Open overlay
	overlayOn();
	// Options HTML is visible
	document.getElementById("options").style.visibility = "visible";
}
// When user wins, update the overlay message with time and difficulty played
const updateOverlayMessage = () => {
	document.getElementById("difficulty").innerHTML = `Difficulty: ${ currentGameParameters.difficulty }`;
	document.getElementById("timeNeeded").innerHTML = `Time: ${ timeElapsed.toFixed(1) }`
};

// Submit score to database
const submitScore = () => {
	// Turn off overlay
	overlayOff();
	// Double check if the game was actually won
	if (Game.wonGame) {
		// Get username from the input field
		let username = document.getElementById("usernameSubmit").value;
		// New score object
		let newScore = {};
		newScore["user"] = username;
		newScore["score"] = Number(timeElapsed.toFixed(1));

		// Get the game difficulty that the game was completed in
		let currentGameMode = currentGameParameters.difficulty;

		// Double check if the game wasn't custom
		if (currentGameMode != 'Custom') {
			// Access the correct firebase database node based on the difficulty of the game that was completed in
			// Then push the newScore
			database.ref(`highscores/${currentGameMode.toLowerCase()}/`).push(newScore, function(error) {
				// If there was a problem with writing the score to database, print to console log failed
				if (error) {
					console.log("Failed");
				} else {
				// If there was no problem, then get an updated list of scores from database
				// to see if the user made it to the top 5
					readScores(currentGameMode.toLowerCase());
					console.log("success");
				}
			});
		};
		// Hide the score submit Interface
		document.getElementById("endGame").style.visibility = "hidden";
	};
};