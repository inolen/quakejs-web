(function (root) {

var practice = root.practice = {};

var maxBots = 5;

var baseq3 = {
	directory: 'baseq3',
	description: 'Vanilla Q3',
	bots: [
		'grunt',
		'major',
		'sarge',
		'stripe'
	],
	botSkills: [
		{ value: 1, description: "I Can Win" },
		{ value: 2, description: "Bring It On" },
		{ value: 3, description: "Hurt Me Plenty" },
		{ value: 4, description: "Hardcore" },
		{ value: 5, description: "Nightmare!" }
	],
	modes: [
		{
			description: 'Free For All',
			gametype: 0,
			maps: [
				{ name: 'q3dm1', description: 'Arena Gate' },
				{ name: 'q3dm7', description: 'Temple of Retribution' },
				{ name: 'q3dm17', description: 'The Longest Yard' },
				{ name: 'q3tourney2', description: 'The Proving Grounds' }
			]
		},
		{
			description: 'Capture The Flag',
			gametype: 4,
			maps: [
				{ name: 'q3wctf1', description: 'Bloodlust' },
				{ name: 'q3wctf2', description: 'Courtyard Conundrum' },
				{ name: 'q3wctf3', description: 'Finnegan\'s Revenge' }
			]
		}
	]
};

var cpma = {
	directory: 'cpma',
	description: 'Challenge Pro Mode Arena',
	bots: [
		'Apheleon',
		'arQon',
		'grunt',
		'major',
		'rat',
		'sarge',
		'stripe'
	],
	botSkills: [
		{ value: 20, description: "I Can Win" },
		{ value: 40, description: "Bring It On" },
		{ value: 60, description: "Hurt Me Plenty" },
		{ value: 80, description: "Hardcore" },
		{ value: 100, description: "Nightmare!" }
	],
	modes: [
		{
			description: 'Free For All',
			name: 'FFA',
			maps: [
				{ name: 'cpm1a', description: 'Wicked' },
				{ name: 'cpm3a', description: 'Use and Abuse' },
				{ name: 'cpm22', description: 'Aerowalk [Hubster\'s Remix II]' },
				{ name: 'ztn3tourney1', description: 'Blood Run' }
			]
		},
		{
			description: 'Tournament',
			name: '1V1',
			maps: [
				{ name: 'cpm1a', description: 'Wicked' },
				{ name: 'cpm3a', description: 'Use and Abuse' },
				{ name: 'cpm22', description: 'Aerowalk [Hubster\'s Remix II]' },
				{ name: 'ztn3tourney1', description: 'Blood Run' }
			]
		},
		{
			description: 'Clan Arena',
			name: 'CA',
			maps: [
				{
					name: 'ra3map1',
					description: 'High Noon',
					arenas: [
						{ number: 1, description: 'Evolution' },
						{ number: 2, description: 'Thunderstruck' },
						{ number: 3, description: 'Canned Heat' },
						{ number: 4, description: 'Theatre Of Pain' }
					]
				},
				{
					name: 'ra3map11',
					description: 'All The Aces',
					arenas: [
						{ number: 1, description: 'Death Or Glory' },
						{ number: 2, description: 'Dead And Gone' },
						{ number: 3, description: 'Eat The Gun' },
						{ number: 4, description: 'Overkill' }
					]
				},
				{
					name: 'ra3map12',
					description: 'Frag Like An Egytian',
					arenas: [
						{ number: 1, description: 'Smash' },
						{ number: 2, description: 'Drunken Mummy' },
						{ number: 3, description: 'Midlife Crisis' },
						{ number: 4, description: 'Hen House' }
					]
				}
			]
		},
		{
			description: 'Capture The Flag',
			name: 'CTF',
			maps: [
				{ name: 'q3wctf1', description: 'Bloodlust' },
				{ name: 'q3wctf2', description: 'Courtyard Conundrum' },
				{ name: 'q3wctf3', description: 'Finnegan\'s Revenge' }
			]
		},
		{
			description: 'Freeze Tag',
			name: 'FTAG',
			maps: [
				{ name: 'cpm1a', description: 'Wicked' },
				{ name: 'cpm3a', description: 'Use and Abuse' },
				{ name: 'cpm22', description: 'Aerowalk [Hubster\'s Remix II]' },
				{ name: 'ztn3tourney1', description: 'Blood Run' }
			]
		}
	]
};

var games = [ cpma, baseq3 ];

practice.init = function (root, views) {
	var practiceView = views.practice;
	var gameView = views.game;
	var modeView = views.mode;
	var mapView = views.map;
	var botView = views.bot;

	var formEl;
	var gameEl, modeContainer;
	var modeEl, mapContainer;
	var mapEl, botContainer;
	var botSkillEl;

	function bind() {
		formEl = document.getElementById('practice-match');
		formEl.onsubmit = onStartMatch;

		gameEl = document.getElementById('game');
		gameEl.onchange = onGameChange;
		modeContainer = document.getElementById('mode-container');

		modeEl = document.getElementById('mode');
		modeEl.onchange = onModeChange;
		mapContainer = document.getElementById('map-container');

		mapEl = document.getElementById('map');
		mapEl.onchange = onMapChange;
		botContainer = document.getElementById('bot-container');

		botSkillEl = document.getElementById('bot-skill');
	}

	function onGameChange() {
		var game = games[gameEl.value];

		modeContainer.innerHTML = modeView.render({ modes: game.modes });

		bind();

		onModeChange();
	}

	function onModeChange() {
		var game = games[gameEl.value];
		var mode = game.modes[modeEl.value];

		mapContainer.innerHTML = mapView.render({ maps: mode.maps });

		bind();

		onMapChange();
	}

	function onMapChange() {
		var game = games[gameEl.value];
		var mode = game.modes[modeEl.value];
		var map = mode.maps[mapEl.value];

		botContainer.innerHTML = botView.render({ maxBots: maxBots, botSkills: game.botSkills, arenas: map.arenas });

		bind();
	}

	function generateCommandLine() {
		var args = [];

		var game = games[gameEl.value];
		var bots = game.bots;
		var mode = game.modes[modeEl.value];
		var map = mode.maps[mapEl.value];
		var botSkill = botSkillEl.value;

		args.push('set fs_game ' + game.directory);
		if (game === baseq3) {
			args.push('set g_gametype ' + mode.gametype);
		} else if (game === cpma) {
			args.push('set mode_start ' + mode.name);
		}
		args.push('set g_teamAutoJoin 1');
		args.push('map ' + map.name);

		if (!map.arenas) {
			var botCountEl = document.getElementById('bot-count');
			var botCount = botCountEl.value;

			for (var i = 0; i < botCount; i++) {
				var idx = Math.floor(Math.random() * bots.length);
				args.push('addbot ' + bots[idx] + ' ' + botSkill + ' f');
			}
		} else {
			map.arenas.forEach(function (arena) {
				var botCountEl = document.getElementById('bot-count-' + arena.number);
				var botCount = botCountEl.value;

				for (var i = 0; i < botCount; i++) {
					var idx = Math.floor(Math.random() * bots.length);
					args.push('addbot ' + bots[idx] + ' ' + botSkill + ' f ' + arena.number);
				}
			});
		}

		return args;
	}

	function onStartMatch() {
		var args = generateCommandLine();

		window.location.href = '/play?' + args.join('&');

		return false;
	}

	root.innerHTML = practiceView.render({
		gameView: gameView,
		modeView: modeView,
		mapView: mapView,
		botView: botView,
		maxBots: maxBots,
		games: games
	});

	bind();

	onGameChange();
}

})(this);
