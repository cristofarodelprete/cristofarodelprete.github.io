function Wordle(container, config) {
	this.container = container;
	this.config = $.extend({
		source: "words-6.txt",
		tries: 6,
		letters: 6
	}, config || {});
	this.today = null;
	this.tomorrow = null;
	this.target = null;
	this.letters = null;
	this.facts = null;
	this.win = false;
	this.lose = false;
	this.tries = [];
	this.entered = "";
	this.words = null;
	this.keyboard = [
		[ "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P" ],
		[ "A", "S", "D", "F", "G", "H", "J", "K", "L" ],
		[ "Z", "X", "C", "V", "B", "N", "M" ]
	];
	this.items = {
		words: [],
		keyboard: [],
		popup: {}
	};
	$.ajax({
		url: this.config.source,
		dataType: "text",
		success: this.fetch.bind(this)
	});
}

Wordle.prototype.fetch = function(d) {
	this.words = d.toUpperCase().replaceAll("\r\n", "\n").split("\n");
	$(document).ready(this.bootstrap.bind(this));
};

Wordle.prototype.save = function() {
	let data = {
		updated: new Date().toISOString(),
		tries: this.tries
	};
	localStorage.wordle = JSON.stringify(data);
};

Wordle.prototype.load = function() {
	if (localStorage.wordle) {
		let data = JSON.parse(localStorage.wordle);
		let updated = Date.parse(data.updated);
		if (updated >= this.today) {
			this.tries = data.tries;
			return true;
		}
	}
	return false;
};

Wordle.prototype.word = function() {
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

Wordle.prototype.calculate = function() {
	let w = false;
	for (let i = 0; i < this.tries.length; i++) {
		let r = 0;
		for (let j = 0; j < this.tries[i].length; j++) {
			this.facts[this.tries[i][j].letter] = Math.max(this.facts[this.tries[i][j].letter] || 0, this.tries[i][j].value);
			if (this.tries[i][j].value == 2) r++;
		}
		if (r >= this.config.letters) w = true;
	}
	this.win = w;
	this.lose = !w && this.tries.length == this.config.tries;
	if (this.win) {
		this.openPopup("Partita vinta!<br/>Prossima partita tra <countdown target=\"" + this.tomorrow.toISOString() + "\">" + Countdown.get(this.tomorrow) + "</countdown>", [], true);
	} else if (this.lose) {
		this.openPopup("Nessun tentativo rimasto!<br/>Riprova tra <countdown target=\"" + this.tomorrow.toISOString() + "\">" + Countdown.get(this.tomorrow) + "</countdown>", [], true);
	} else {
		this.closePopup();
	}
};

Wordle.prototype.initialize = function() {
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
	setTimeout(Wordle.prototype.initialize.bind(this), +tomorrow - +now);
	this.word();
	let loaded = this.load();
	if (loaded) this.calculate();
	this.save();
	this.redraw();
};

Wordle.prototype.enter = function() {
	console.log("entered word: " + this.entered);
	if (this.entered.length >= this.config.letters) {
		let wu = this.entered.toUpperCase();
		if (this.words.indexOf(wu) < 0) {
			this.openPopup("Parola non trovata nel dizionario!", [{ label: "OK", action: this.closePopup }]);
		} else {
			let trial = [];
			let checked = {};
			for (let i = 0; i < this.config.letters; i++) {
				trial.push({ letter: wu.charAt(i), value: 0 });
			}
			for (let i = 0; i < this.config.letters; i++) {
				let l = trial[i].letter;
				if (l == this.target.charAt(i)) {
					trial[i].value = 2;
					if (!checked[l]) checked[l] = 1;
					else checked[l]++;
				}
			}
			for (let i = 0; i < this.config.letters; i++) {
				let l = trial[i].letter;
				if (trial[i].value == 0) {
					let l = wu.charAt(i);
					if ((this.letters[l] || 0) > (checked[l] || 0)) {
						trial[i].value = 1;
					}
					if (!checked[l]) checked[l] = 1;
					else checked[l]++;
				}
			}
			this.tries.push(trial);
			this.entered = "";
			this.calculate();
			this.save();
			this.redraw();
		}
	}
};

Wordle.prototype.bootstrap = function() {
	$(this.container).empty();
	let pop = $("<popup>");
	this.items.popup.root = pop;
	let cnt = $("<content>");
	pop.append(cnt);
	this.items.popup.content = cnt;
	$(this.container).append(pop);
	let wse = $("<words>");
	for (let i = 0; i < this.config.tries; i++) {
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
	$(this.container).on("click", this.click.bind(this));
	$(document).on("keyup", this.key.bind(this));
	this.initialize();
};

Wordle.prototype.redraw = function() {
	for (let i = 0; i < this.config.tries; i++) {
		if (i < this.tries.length) {
			for (let j = 0; j < this.config.letters; j++) {
				this.items.words[i][j].attr("label", this.tries[i][j].letter);
				this.items.words[i][j].attr("value", this.tries[i][j].value);
			}
		} else if (i == this.tries.length) {
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

Wordle.prototype.key = function(e) {
	if (!this.win && this.tries.length < this.config.tries) {
		if (this.isPopupOpen() && !this.isPopupFixed()) {
			this.closePopup();
		} else {
			if (e.which == 8) {
				console.log("pressed backspace key");
				if (this.entered.length > 0) {
					this.entered = this.entered.substr(0, this.entered.length - 1);
				}
			} else if (e.which == 13) {
				this.enter();
			} else if (e.which >= 65 && e.which <= 90 || e.which >= 97 && e.which <= 122) {
				let s = String.fromCharCode(e.which).toUpperCase();
				console.log("pressed " + s + " key");
				if (this.entered.length < this.config.letters) {
					this.entered += s;
				}
			}
			this.redraw();
		}
	}
};

Wordle.prototype.isPopupOpen = function() {
	return this.items.popup.root.is("[show]");
}

Wordle.prototype.isPopupFixed = function() {
	return this.items.popup.root.is("[fixed]");
}

Wordle.prototype.closePopup = function() {
	this.items.popup.root.removeAttr("show").removeAttr("fixed");
};

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

Wordle.prototype.click = function(e) {
	if (!this.win && this.tries.length < this.config.tries) { 
		let t = $(e.target);
		if (this.isPopupOpen() && !this.isPopupFixed()) {
			if (!this.popup.root.contains(t)) {
				this.closePopup();
			}
		} else if (t.closest("key").length > 0) {
			let k = t.closest("key");
			if (k.is("[enter]")) {
				this.key({ which: 13 });
			} else if (k.is("[backspace]")) {
				this.key({ which: 8 });
			} else {
				this.key({ which: k.attr("letter").charCodeAt(0) });
			}
		}
	}
};