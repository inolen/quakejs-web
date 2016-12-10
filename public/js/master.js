(function (root) {

var master = root.master = {};

master._formatOOB = function (data) {
	var str = '\xff\xff\xff\xff' + data + '\x00';

	var buffer = new ArrayBuffer(str.length);
	var view = new Uint8Array(buffer);

	for (var i = 0; i < str.length; i++) {
		view[i] = str.charCodeAt(i);
	}

	return buffer;
};

master._stripOOB = function (buffer) {
	var view = new DataView(buffer);

	if (view.getInt32(0) !== -1) {
		return null;
	}

	var str = '';
	for (var i = 4 /* ignore leading -1 */; i < buffer.byteLength - 1 /* ignore trailing \0 */; i++) {
		var c = String.fromCharCode(view.getUint8(i));
		str += c;
	}

	return str;
};

master._parseInfoString = function (str) {
	var data = {};

	if (str) {
		// trim the incoming string
		str = str.replace(/^\\+|\\+$/g, '');

		var split = str.split('\\');

		for (var i = 0; i < split.length - 1; i += 2) {
			var key = split[i];
			var value = split[i+1];
			data[key] = value;
		}
	}

	return data;
};

master._parseServers = function (str) {
	var servers = [];

	str = str.replace(/\\EOT$|^\\/g, '');

	if (str) {
		var split = str.split('\\');

		for (var i = 0; i < split.length; i++) {
			var info = split[i];
			var addr = (info.charCodeAt(0) & 0xff).toString() + '.' + (info.charCodeAt(1) & 0xff).toString() + '.' +
				(info.charCodeAt(2) & 0xff).toString() + '.' + (info.charCodeAt(3) & 0xff).toString();
			var port = ((info.charCodeAt(4) & 0xff) << 8) | (info.charCodeAt(5) & 0xff);

			servers.push({ addr: addr, port: port });
		}
	}

	return servers;
};

master._parsePlayers = function (str) {
	var players = [];

	if (str) {
		// trim the incoming string
		str = str.replace(/^\n+|\n+$/g, '');

		var split = str.split('\n');

		for (var i = 0; i < split.length; i++) {
			var pinfo = split[i];
			var psplit = pinfo.match(/\S+|"[^"]+"/g);  // split on space, combining quoted items

			players.push({
				frags: parseInt(psplit[0], 10),
				ping: parseInt(psplit[1], 10),
				name: psplit[2]
			});
		}
	}

	return players;
};

master.connect = function (address, port, callback) {
	var self = this;

	var errored = false;
	var ws = new WebSocket('ws://' + address + ':' + port);
	ws.binaryType = 'arraybuffer';

	ws.onopen = function () {
		var buffer = self._formatOOB('subscribe');

		ws.send(buffer);
	};

	ws.onmessage = function (event) {
		var data = self._stripOOB(event.data);

		if (data.indexOf('getserversResponse') === 0) {
			data = data.substr(18);

			var servers = master._parseServers(data);

			callback(null, servers);
		}
	};

	ws.onclose = function () {
		if (!errored) {
			callback(new Error('Connection to master server lost.'));
			errored = true;
		}
	};
};

master.scanServer = function (server, callback) {
	var self = this;

	var done = false;
	var ws = new WebSocket('ws://' + server.addr + ':' + server.port);
	ws.binaryType = 'arraybuffer';

	var start, end;

	ws.onopen = function () {
		start = window.performance.now();

		var buffer = self._formatOOB('getstatus');

		ws.send(buffer);
	};

	ws.onmessage = function (event) {
		end = window.performance.now();

		var data = self._stripOOB(event.data);

		if (!done) {
			if (data.indexOf('statusResponse\n') !== 0) {
				callback(new Error('Invalid getinfo response: ' + data));
			} else {
				data = data.substr(15);

				var idx = data.indexOf('\n');
				var variableData = idx !== -1 ? data.substr(0, idx) : data;
				var playerData = idx !== -1 ? data.substr(idx) : null;

				var info = self._parseInfoString(variableData);
				info.ping = parseInt(end - start, 10);
				info.players = self._parsePlayers(playerData);

				callback(null, info);
			}
			done = true;
		}
	};

	ws.onclose = function (ev) {
		if (!done) {
			callback(new Error(ev.reason));
			done = true;
		}
	};
};

})(this);
