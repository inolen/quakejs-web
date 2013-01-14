var routes = module.exports = function (app) {
	
	var authcontroller = require('../controllers/authcontroller')(app) ;
	
	app.all('/auth/*' , authcontroller.authenticateRequest );
	
	app.get('/auth/account' , authcontroller.renderAccountView );
	
	app.get('/login', authcontroller.renderLoginView );
	
	app.post('/login', authcontroller.handleLogin );
	
	app.get('/join', authcontroller.renderJoinView );
	
	app.post('/join', authcontroller.handleJoin );
	
	app.get('/logout', authcontroller.handleLogout );
	
};