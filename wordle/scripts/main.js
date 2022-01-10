var wordle = new Wordle("main", {
	source: "resources/words-5.txt",
	letters: 5,
	tries: 6,
	interval: "hourly",
	weekStartsOnMonday: false
});