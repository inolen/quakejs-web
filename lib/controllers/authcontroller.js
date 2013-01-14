'use strict';

var _ = require('underscore');

var bcrypt = require('bcrypt') ;

module.exports = function(app) {
	
	// Pass in the app reference to grab config for models
	
	var authmodels = require('../data/authmodels')(app) ;

	var Role = authmodels.Role ;

	var User = authmodels.User ;

	var methods = {} ;
	
	methods.authenticateRequest = function( req , res , next ){
		
		User.find( { where : { id : req.session.userId } , include : ['role'] } )
			
			.success(function(user){
				
				if ( user ) {
					
					req.user = user ;
					
					next() ;
					
				} else {
					
					res.redirect('/login') ;
					
				}
				
			})
			
	} ;
	
	methods.handleLogout = function (req, res, next) {
		
		delete req.session.userId ;
		
		res.redirect('/login') ;
		
	};
	
	methods.renderAccountView = function(req,res){
		
		res.render('account' , { user : req.user });
		
	};
	
	methods.renderLoginView = function (req, res, next) {
		
		res.render('login') ;
		
	};
	
	methods.renderJoinView = function (req, res, next) {
		
		res.render('join') ;
		
	};
	
	methods.handleLogin = function (req, res, next) {
		
		var email = req.param('email') ;
		
		var password = req.param('password') ;
		
		var returnUserNotFound = function(){
			
			res.render( 'login' , {
				
				error : 'Username or password was incorrect'
				
			});
			
		};
		
		User.find({ where: {email: email} })
			
			.success(function(user) {
				
				bcrypt.compare( password , user.password , function(err,same) {
					
					if ( ! same ) {
						
						returnUserNotFound();
						
					} else {
						
						req.session.userId = user.id ;
						
						res.redirect('/auth/account');
						
					}
					
				});
				
			})
			
			.error( returnUserNotFound );
			
	};

	methods.handleJoin = function (req, res, next) {

		var email = req.param('email' , false ) ;

		var password = req.param('password' , false ) ;

		var confirmPassword = req.param('confirmPassword' , false );
		
		var renderJoinWithErrors = function( errorText ){
			
			res.render( 'join' , {
				
				error : errorText || 'unknown error'
				
			});
			
		};
		
		var setUserAndRedirect = function(){
			
			req.session.userId = user.id ;
			
			res.redirect('/auth/account');
			
		};
		
		
		if ( email && password && confirmPassword && password === confirmPassword && password.length ) {
			
			bcrypt.hash( password , 10 , function(err, hashedPass ) {
				
				var user = User.build({
					
					email : email ,
					password : hashedPass
					
				});
				
				// user.validate returns false if everything is ok. otherwise, returns errors per field
				
				var validationErrors = user.validate() ;
				
				if ( ! validationErrors ) {
					
					Role.getOrCreateRole( 'BETA_USER' , function(beta_user_role){
						
						user.save().success(function(user){
							
							user.addRole(beta_user_role)
								.success( setUserAndRedirect )
								.error( renderJoinWithErrors )
								
						}).error(function(error){
							
							var errorText = error.code=="ER_DUP_ENTRY" ? 'Email already exists' : 'Unknown error creating user'
							
							renderJoinWithErrors(errorText)
							
						});
						
					});
					
				} else {
					
					var errorStrings = [] ;
					
					_.each( validationErrors , function( errors , fieldName ) {
						
						errorStrings.push( 'Invalid ' + fieldName );
						
					});
					
					renderJoinWithErrors( errorStrings.join(', ') ) ;
					
				}
				
			});
			
		} else {
			
			res.render( 'join' , {
				
				error : password != confirmPassword ? "Passwords don't match" : "Email and Password required"
				
			});
		}
		
	};
	
	return methods ;
	
}
