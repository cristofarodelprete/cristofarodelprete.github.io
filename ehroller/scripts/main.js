const App = {
	data() {
		return {
			messages: {
				"en": {
					stats: {
						lore: "Lore",
						influence: "Influence",
						observation: "observation",
						strength: "Strength",
						will: "Will"
					},
					title: "EH Dice Roller",
					baseValue: "Base value",
					improvement: "Improvement",
					bonus: "Bonus",
					combatBonus: "Combat bonus",
					spellBonus: "Spell bonus",
					encounterModifier: "Encounter modifier",
					testModifier: "Test modifier",
					reset: "Reset",
					blessed: "Blessed condition",
					cursed: "Cursed condition",
					spellMode: "Spell mode",
					combatMode: "Combat mode",
					sixesCountDouble: "6's count double",
					onesCancelSuccesses: "1's cancel successes",
					roll: "Roll",
					clear: "Clear",
					result: {
						success: "Success",
						failure: "Failure",
						nSuccesses: "{n} successes",
						oneSuccess: "1 success",
						zeroSuccesses: "0 successes"
					}
				},
				"it": {
					stats: {
						lore: "Conoscenza",
						influence: "Influenza",
						observation: "Osservazione",
						strength: "Forza",
						will: "Volontà"
					},
					title: "Lancia Dadi EH",
					baseValue: "Valore base",
					improvement: "Miglioramento",
					bonus: "Bonus",
					combatBonus: "Bonus in combattimento",
					spellBonus: "Bonus incantesimo",
					encounterModifier: "Modificatore incontro",
					testModifier: "Modificatore prova",
					reset: "Resetta",
					blessed: "Condizione Benedetto",
					cursed: "Condizione Maledetto",
					combatMode: "Modalità combattimento",
					spellMode: "Modalità incantesimo",
					sixesCountDouble: "I 6 contano doppio",
					onesCancelSuccesses: "Gli 1 annullano i successi",
					roll: "Lancia",
					clear: "Pulisci",
					result: {
						success: "Successo",
						failure: "Fallimento",
						nSuccesses: "{n} successi",
						oneSuccess: "1 successo",
						zeroSuccesses: "0 successi"
					}
				}
			},
			stats: {
				lore: {
					base: 2,
					improvement: 0,
					bonus: 0,
					combat: 0,
					spell: 0
				},
				influence: {
					base: 2,
					improvement: 0,
					bonus: 0,
					combat: 0,
					spell: 0
				},
				observation: {
					base: 2,
					improvement: 0,
					bonus: 0,
					combat: 0,
					spell: 0
				},
				strength: {
					base: 2,
					improvement: 0,
					bonus: 0,
					combat: 0,
					spell: 0
				},
				will: {
					base: 2,
					improvement: 0,
					bonus: 0,
					combat: 0,
					spell: 0
				}
			},
			stat: "lore",
			modifiers: {
				encounter: 0,
				test: 0,
			},
			settings: {
				blessed: false,
				cursed: false,
				combat: false,
				sixes: false,
				ones: false
			},
			dice: []
		};
	},
	mounted() {
		if (localStorage.ehRollerStats) {
			this.stats = JSON.parse(localStorage.ehRollerStats);
		}
	},
	watch: {
		stats: {
			handler(value, old) {
				localStorage.ehRollerStats = JSON.stringify(value);
			},
			deep: true
		},
		'settings.blessed'(value) {
			if (value) this.settings.cursed = false;
		},
		'settings.cursed'(value) {
			if (value) this.settings.blessed = false;
		},
		'settings.combat'(value) {
			if (value) this.settings.spell = false;
		},
		'settings.spell'(value) {
			if (value) this.settings.combat = false;
		}
	},
	computed: {
		lang() {
			return navigator.language.split("-")[0];
		},
		result() {
			let total = 0;
			for (let i = 0; i < this.dice.length; i++) {
				total += this.count(this.dice[i]);
			}
			if (this.settings.combat || this.settings.spell) {
				if (total > 1) return this.messages[this.lang].result.nSuccesses.replace("{n}", total);
				else if (total == 1) return this.messages[this.lang].result.oneSuccess;
				else return this.messages[this.lang].result.zeroSuccesses;
			} else {
				if (total >= 1) return this.messages[this.lang].result.success;
				else return this.messages[this.lang].result.failure;
			}
		}
	},
	methods: {
		count(die) {
			switch (die.value) {
				case 6: return this.settings.sixes ? 2 : 1;
				case 5: return this.settings.cursed ? 0 : 1;
				case 4: return this.settings.blessed ? 1 : 0;
				case 1: return this.settings.ones ? -1 : 0;
				default: return 0;
			}
		},
		roll() {
			let n = 0;
			n += this.stats[this.stat].base;
			n += this.stats[this.stat].improvement;
			if (this.settings.combat) {
				n += Math.max(this.stats[this.stat].combat, this.stats[this.stat].bonus);
			} else if (this.settings.spell) {
				n += Math.max(this.stats[this.stat].spell, this.stats[this.stat].bonus);
			} else {
				n += this.stats[this.stat].bonus;
			}
			n += this.modifiers.encounter;
			n += this.modifiers.test;
			if (n < 1) n = 1;
			let dice = [];
			for (let i = 0; i < n; i++) {
				let value = 1 + Math.floor(Math.random() * 6);
				let rnd = 1 + Math.floor(Math.random() * 30);
				dice.push({ value: value, rnd: rnd });
			}
			this.dice = dice;
		},
		reroll(index) {
			let value = 1 + Math.floor(Math.random() * 6);
			let rnd = 1 + Math.floor(Math.random() * 30);
			this.dice[index] = { value: value, rnd: rnd };
		},
		clear() {
			this.dice = [];
		}
	}
};

Vue.createApp(App).mount("#app");
