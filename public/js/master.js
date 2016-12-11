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
	var i_start = 4; /* ignore leading -1 */
	var i_end = buffer.byteLength;

	/* ignore trailing whitespace */
	while (i_end > 4 && view.getUint8(i_end - 1) <= 32) {
		--i_end;
	}

	for (var i = i_start; i < i_end; i++) {
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

master._parseStatusResponse = function (data) {
	var self = this;
	if (data.indexOf('statusResponse\n') !== 0) {
		throw new Error('Invalid getstatus response: ' + data);
	}
	data = data.substr(15);

	var idx = data.indexOf('\n');
	var variableData = idx !== -1 ? data.substr(0, idx) : data;
	var playerData = idx !== -1 ? data.substr(idx) : null;

	var info = self._parseInfoString(variableData);
	info.players = self._parsePlayers(playerData);
	return info;
};

master._parseInfoResponse = function (data) {
	var self = this;
	if (data.indexOf('infoResponse\n') !== 0) {
		throw new Error('Invalid getinfo response: ' + data);
	}
	data = data.substr(13);
	var info = self._parseInfoString(data);

	// Compute the number of bots for the template
	info.g_botplayers = info.clients - info.g_humanplayers;

	return info;
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

	var ws = new WebSocket('ws://' + server.addr + ':' + server.port);
	ws.binaryType = 'arraybuffer';
	var start, end;
	var finish = function (err, info) {
		if (callback) {
			callback(err, info);
			callback = null;
		}
		ws.close();
	};

	ws.onopen = function () {
		start = window.performance.now();

		var buffer = self._formatOOB('getinfo');

		ws.send(buffer);
	};

	ws.onmessage = function (event) {
		end = window.performance.now();

		var data = self._stripOOB(event.data);
		var info;
		try {
			info = self._parseInfoResponse(data);
		} catch (err) {
			finish(err);
			return;
		}
		info.ping = parseInt(end - start, 10);
		finish(null, info);
	};

	ws.onclose = function (ev) {
		finish(new Error(ev.reason));
	};
};

})(this);
