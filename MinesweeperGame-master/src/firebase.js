// Firebase Stuff
const config = {
	apiKey: "AIzaSyBbDB1gk-Ue7G90UxdxQA22G1_EAGTQdHY",
	authDomain: "minesweeper-50f64.firebaseapp.com",
	databaseURL: "https://minesweeper-50f64.firebaseio.com",
	projectId: "minesweeper-50f64",
	storageBucket: "minesweeper-50f64.appspot.com",
	messagingSenderId: "206237431770"
};

firebase.initializeApp(config);

const database = firebase.database();

// Read scores from firebase database based on what difficulty was passed
const readScores = (difficulty) => {
	// HTML element to place scores in
	let scoreLocation = document.getElementById(difficulty);

	// Access database highscore node and difficulty node (beginner, intermediate, or expert)
	let databaseScoreRef = database.ref(`highscores/${difficulty}`);
	// Orders the data at firebase by score (smallest to largest)
	// Limits amount of entries to only the first 5 (high scores)
	// Once only calls to the database once, not continuously
	databaseScoreRef.orderByChild('score').limitToFirst(5).once('value', (snapshot) => {
		// Create a new div for the scores to be placed in
		let newDiv = document.createElement("div");
		// For each of the 5 entries, create a p element and add to the new div
		snapshot.forEach((child) => {
			let data = child.val();
			let score = document.createElement("p");
			score.className = "h6";
			score.innerHTML = `${ data["user"] }: ${ data["score"] }`;
			newDiv.appendChild(score);
		});
		// If the scores are updated, remove everything from the scoreLocation HTML element
		while (scoreLocation.firstChild) {
			scoreLocation.removeChild(scoreLocation.firstChild);
		};
		// Then place the new div with the new scores in the scoreLocation
		scoreLocation.appendChild(newDiv);
	});
};

// Get database scores on the difficulty levels (done automatically when page loads)
readScores('expert');
readScores('intermediate');
readScores('beginner');