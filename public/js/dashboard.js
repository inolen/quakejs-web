(function (root) {

var dashboard = root.dashboard = {};

var serverid = function (server) {
	return server.addr.replace(/\./g, '_') + '_' + server.port;
};

dashboard.error = function (err) {
	var statusElement = document.getElementById('servers-status');
	var serversElement = document.getElementById('servers-list');

	statusElement.style.display = 'block';
	statusElement.innerHTML = '<div class="alert alert-error">' + (err.message || err) + '</div>';

	serversElement.style.display = 'none';
};

dashboard.init = function (root, host, port, views) {
	var self = this;
	var serversView = views.servers;
	var serverView = views.server;

	this.views = views;

	root.innerHTML = serversView.render();

	var statusElement = document.getElementById('servers-status');
	var serversElement = document.getElementById('servers-list');

	// show spinner while connecting in status
	var spinner = new Spinner({ color: '#fff' }).spin(statusElement);
	statusElement.style.display = 'block';

	// hide the servers list
	serversElement.style.display = 'none';

	// this callback is fired each time a group / individual server is received
	master.connect(host, port, function (err, servers) {
		// make sure the spinner is stopped
		if (spinner) {
			spinner.stop();
			spinner = null;
		}

		if (err) {
			self.error(err);

			// attempt to reconnect in a minute
			setTimeout(self.init.bind(self, root, host, port, views), 60000);

			return;
		}

		// hide status / show servers
		statusElement.style.display = 'none';
		serversElement.style.display = 'table';

		servers.forEach(function (server) {
			master.scanServer(server, function (err, info) {
				if (err) {
					console.log('Failed to scan ' + server.addr + ':' + server.port + ', ' + err.message);
					self.removeServer(server);
					return;
				}

				self.updateServer(server, info);
			});
		});
	});
};

dashboard.updateServer = function (server, info) {
	var serverView = this.views.server;
	var tbody = document.getElementById('servers-list').querySelectorAll('tbody')[0];

	var id = serverid(server);
	var row = document.getElementById(id);

	if (!row) {
		row = tbody.insertRow(-1);
		row.id = id;
	} else {
		// empty it out
		row.innerHTML = '';
	}

	row.innerHTML = serverView.render({
		info: info
	});

	row.onclick = function () {
		window.location = '/play?connect%20' + server.addr + ':' + server.port;
	};
};

dashboard.removeServer = function (server) {
	var id = serverid(server);

	var row = document.getElementById(id);
	
	if (!row) {
		return;
	}

	row.parentNode.removeChild(row);
};

})(this);
