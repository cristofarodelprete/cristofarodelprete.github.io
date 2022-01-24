var wordle = new Wordle("main", {
	words: "resources/words-5.txt",
	filler: "resources/filler-5.txt",
	letters: 5,
	tries: 6,
	interval: "hourly",
	weekStartsOnMonday: false
});
