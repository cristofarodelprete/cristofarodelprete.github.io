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
					modifier: "Modifier",
					reset: "Reset",
					successMode: {
						label: "Success mode",
						normal: "Normal",
						blessed: "Blessed",
						cursed: "Cursed",
					},
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
					modifier: "Modificatore",
					reset: "Resetta",
					successMode: {
						label: "Modalità successi",
						normal: "Normale",
						blessed: "Benedetto",
						cursed: "Maledetto",
					},
					combatMode: "Modalità combattimento",
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
					combat: 0
				},
				influence: {
					base: 2,
					improvement: 0,
					bonus: 0,
					combat: 0
				},
				observation: {
					base: 2,
					improvement: 0,
					bonus: 0,
					combat: 0
				},
				strength: {
					base: 2,
					improvement: 0,
					bonus: 0,
					combat: 0
				},
				will: {
					base: 2,
					improvement: 0,
					bonus: 0,
					combat: 0
				}
			},
			stat: "lore",
			modifier: 0,
			settings: {
				successes: [ 5, 6 ],
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
			handler(value) {
				localStorage.ehRollerStats = JSON.stringify(value);
			},
			deep: true
		}
	},
	computed: {
		lang() {
			return navigator.language.split("-")[0];
		},
		result() {
			let total = 0;
			for (let i = 0; i < this.dice.length; i++) {
				if (this.settings.sixes && this.dice[i].value == 6) total += 2;
				else if (this.settings.successes.indexOf(this.dice[i].value) >= 0) total++;
				else if (this.settings.ones && this.dice[i].value == 1) total--;
			}
			if (this.settings.combat) {
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
		roll() {
			let n = 0;
			n += this.stats[this.stat].base;
			n += this.stats[this.stat].improvement;
			if (this.settings.combat) {
				n += this.stats[this.stat].combat;
			} else {
				n += this.stats[this.stat].bonus;
			}
			n += this.modifier;
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
