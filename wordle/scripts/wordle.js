function Wordle(container, config) {
	this.container = container;
	this.config = $.extend({
		source: "words-6.txt",
		guesses: 6,
		letters: 6
	}, config || {});
	this.today = null;
	this.tomorrow = null;
	this.target = null;
	this.letters = null;
	this.facts = null;
	this.win = false;
	this.lose = false;
	this.guesses = [];
	this.entered = "";
	this.words = null;
	this.keyboard = [
		[ "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P" ],
		[ "A", "S", "D", "F", "G", "H", "J", "K", "L" ],
		[ "Z", "X", "C", "V", "B", "N", "M" ]
	];
	this.messages = {
		winGame: "Partita vinta!<br/>Prossima partita tra {countdown}",
		loseGame: "Nessun tentativo rimasto!<br/>Riprova tra {countdown}",
		wordNotFound: "Parola non trovata nel dizionario!",
		ok: "OK",
	};
	this.items = {
		words: [],
		keyboard: [],
		popup: {}
	};
	this.fetchDictionary();
}

/**
 * Retrieves the dictionary from an AJAX source
 */
Wordle.prototype.fetchDictionary = function() {
	$.ajax({
		url: this.config.source,
		dataType: "text",
		success: this.prepareWords.bind(this)
	});

};

/**
 * Imports the words from the dictionary to memory
 */
Wordle.prototype.prepareWords = function(d) {
	this.words = d.toUpperCase().replaceAll("\r\n", "\n").split("\n");
	$(document).ready(this.bootstrapGame.bind(this));
};

/**
 * Saves the current session to the local storage
 */
Wordle.prototype.saveSession = function() {
	let data = {
		updated: new Date().toISOString(),
		guesses: this.guesses
	};
	localStorage.wordle = JSON.stringify(data);
};

/**
 * Loads a saved session from local storage
 */
Wordle.prototype.loadSession = function() {
	if (localStorage.wordle) {
		let data = JSON.parse(localStorage.wordle);
		let updated = Date.parse(data.updated);
		if (updated >= this.today) {
			this.guesses = data.guesses;
			return true;
		}
	}
	return false;
};

/**
 * Generates a new word to guess
 */
Wordle.prototype.generateWord = function() {
	let rng = new RNG(+this.today);
	this.target = this.words[rng.random(0, this.words.length)].toUpperCase();
	this.letters = {};
	this.facts = {};
	for (let i = 0; i < this.target.length; i++) {
		let l = this.target.charAt(i);
		if (!this.letters[l]) this.letters[l] = 1;
		else this.letters[l]++;
	}
};

/**
 * Checks the game states and derives the known facts. Also, determines if we are in a win or lose state
 */
Wordle.prototype.checkGameState = function() {
	let w = false;
	for (let i = 0; i < this.guesses.length; i++) {
		let r = 0;
		for (let j = 0; j < this.guesses[i].length; j++) {
			this.facts[this.guesses[i][j].letter] = Math.max(this.facts[this.guesses[i][j].letter] || 0, this.guesses[i][j].value);
			if (this.guesses[i][j].value == 2) r++;
		}
		if (r >= this.config.letters) w = true;
	}
	this.win = w;
	this.lose = !w && this.guesses.length == this.config.guesses;
	if (this.win) {
		this.openPopup(this.messages.winGame.replaceAll("{countdown}", "<countdown target=\"" + this.tomorrow.toISOString() + "\">" + Countdown.get(this.tomorrow) + "</countdown>"), [], true);
	} else if (this.lose) {
		this.openPopup(this.messages.loseGame.replaceAll("{countdown}", "<countdown target=\"" + this.tomorrow.toISOString() + "\">" + Countdown.get(this.tomorrow) + "</countdown>"), [], true);
	} else {
		this.closePopup();
	}
};

/**
 * Initializes a new game
 */
Wordle.prototype.initializeGame = function() {
	let now = new Date();
	let today = new Date(+now);
	today.setMilliseconds(0);
	today.setSeconds(0);
	today.setMinutes(0);
	today.setHours(0);
	this.today = today;
	let tomorrow = new Date(+this.today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	this.tomorrow = tomorrow;
	setTimeout(Wordle.prototype.initializeGame.bind(this), +tomorrow - +now);
	this.generateWord();
	let loaded = this.loadSession();
	if (loaded) this.checkGameState();
	else this.guesses = [];
	this.saveSession();
	this.redrawComponents();
};

/**
 * Verifies a guess and updates the game state
 */
Wordle.prototype.enterGuess = function() {
	if (this.entered.length >= this.config.letters) {
		let wu = this.entered.toUpperCase();
		if (this.words.indexOf(wu) < 0) {
			this.openPopup(this.messages.wordNotFound, [{ label: this.messages.ok, action: this.closePopup }]);
		} else {
			let guess = [];
			let checked = {};
			for (let i = 0; i < this.config.letters; i++) {
				guess.push({ letter: wu.charAt(i), value: 0 });
			}
			for (let i = 0; i < this.config.letters; i++) {
				let l = guess[i].letter;
				if (l == this.target.charAt(i)) {
					guess[i].value = 2;
					if (!checked[l]) checked[l] = 1;
					else checked[l]++;
				}
			}
			for (let i = 0; i < this.config.letters; i++) {
				let l = guess[i].letter;
				if (guess[i].value == 0) {
					let l = wu.charAt(i);
					if ((this.letters[l] || 0) > (checked[l] || 0)) {
						guess[i].value = 1;
					}
					if (!checked[l]) checked[l] = 1;
					else checked[l]++;
				}
			}
			this.guesses.push(guess);
			this.entered = "";
			this.checkGameState();
			this.saveSession();
			this.redrawComponents();
		}
	}
};

/**
 * Creates the visual components, binds the event handlers and initializes the game
 */
Wordle.prototype.bootstrapGame = function() {
	$(this.container).empty();
	let pop = $("<popup>");
	this.items.popup.root = pop;
	let cnt = $("<content>");
	pop.append(cnt);
	this.items.popup.content = cnt;
	$(this.container).append(pop);
	let wse = $("<words>");
	for (let i = 0; i < this.config.guesses; i++) {
		let wi = [];
		let we = $("<word>");
		for (let j = 0; j < this.config.letters; j++) {
			let le = $("<letter>");
			wi.push(le);
			we.append(le);
		}
		wse.append(we);
		this.items.words.push(wi);
	}
	$(this.container).append(wse);
	let kbe = $("<keyboard>");
	for (let i = 0; i < this.keyboard.length; i++) {
		let re = $("<row>");
		let last = i == this.keyboard.length - 1;
		if (last) re.append($("<key>").attr("enter", ""));
		for (let j = 0; j < this.keyboard[i].length; j++) {
			let ke = $("<key>").attr("letter", this.keyboard[i][j]);
			this.items.keyboard[this.keyboard[i][j]] = ke;
			re.append(ke);
		}
		if (last) re.append($("<key>").attr("backspace", ""));
		kbe.append(re);
	}
	$(this.container).append(kbe);
	$(this.container).on("click", this.clickHandler.bind(this));
	$(document).on("keyup", this.keyPressHandler.bind(this));
	this.initializeGame();
};

/**
 * Updates the visual components after a guess
 */
Wordle.prototype.redrawComponents = function() {
	for (let i = 0; i < this.config.guesses; i++) {
		if (i < this.guesses.length) {
			for (let j = 0; j < this.config.letters; j++) {
				this.items.words[i][j].attr("label", this.guesses[i][j].letter);
				this.items.words[i][j].attr("value", this.guesses[i][j].value);
			}
		} else if (i == this.guesses.length) {
			for (let j = 0; j < this.config.letters; j++) {
				if (j < this.entered.length) {
					this.items.words[i][j].attr("label", this.entered.charAt(j));
				} else {
					this.items.words[i][j].removeAttr("label");
				}
				this.items.words[i][j].removeAttr("value");
			}
		} else {
			for (let j = 0; j < this.config.letters; j++) {
				this.items.words[i][j].removeAttr("label");
				this.items.words[i][j].removeAttr("value");
			}
		}
	}
	let kk = Object.keys(this.items.keyboard);
	for (let i = 0; i < kk.length; i++) {
		if (typeof this.facts[kk[i]] != "undefined") {
			this.items.keyboard[kk[i]].attr("value", this.facts[kk[i]]);
		} else {
			this.items.keyboard[kk[i]].removeAttr("value");
		}
	}
};

/**
 * Handles a key press on the virtual or physical keyboard
 */
Wordle.prototype.keyPressHandler = function(e) {
	if (!this.win && this.guesses.length < this.config.guesses) {
		if (this.isPopupOpen() && !this.isPopupFixed()) {
			this.closePopup();
		} else {
			if (e.which == 8) {
				if (this.entered.length > 0) {
					this.entered = this.entered.substr(0, this.entered.length - 1);
				}
			} else if (e.which == 13) {
				this.enterGuess();
			} else if (e.which >= 65 && e.which <= 90 || e.which >= 97 && e.which <= 122) {
				let s = String.fromCharCode(e.which).toUpperCase();
				if (this.entered.length < this.config.letters) {
					this.entered += s;
				}
			}
			this.redrawComponents();
		}
	}
};

/**
 * Checks if the popup is open
 */
Wordle.prototype.isPopupOpen = function() {
	return this.items.popup.root.is("[show]");
}

/**
 * Checks if the popup is fixed (not-closeable)
 */
Wordle.prototype.isPopupFixed = function() {
	return this.items.popup.root.is("[fixed]");
}

/**
 * Closes the popup
 */
Wordle.prototype.closePopup = function() {
	this.items.popup.root.removeAttr("show").removeAttr("fixed");
};

/**
 * Opens the popup with given content and buttons
 */
Wordle.prototype.openPopup = function(content, buttons, fixed) {
	this.items.popup.root.removeAttr("fixed");
	this.items.popup.content.empty();
	this.items.popup.content.append(content);
	if (buttons && buttons.length) {
		let bts = $("<buttons>");
		for (let i = 0; i < buttons.length; i++) {
			bts.append($("<button>").text(buttons[i].label).on("click", buttons[i].action.bind(this)));
		}
		this.items.popup.content.append(bts);
	}
	if (fixed) this.items.popup.root.attr("fixed", "");
	this.items.popup.root.attr("show", "");
};

/**
 * Handles a click on the screen (either to auto-close the popup or to activate the virtual keyboard)
 */
Wordle.prototype.clickHandler = function(e) {
	if (!this.win && this.guesses.length < this.config.guesses) { 
		let t = $(e.target);
		if (this.isPopupOpen() && !this.isPopupFixed()) {
			if (!this.popup.root.contains(t)) {
				this.closePopup();
			}
		} else if (t.closest("keyPressHandler").length > 0) {
			let k = t.closest("keyPressHandler");
			if (k.is("[enter]")) {
				this.keyPressHandler({ which: 13 });
			} else if (k.is("[backspace]")) {
				this.keyPressHandler({ which: 8 });
			} else {
				this.keyPressHandler({ which: k.attr("letter").charCodeAt(0) });
			}
		}
	}
};