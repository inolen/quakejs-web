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
			
			.error(function(){
				
				console.log('ERROR READING FROM USER TABLE') ;
				
				res.redirect('/login') ;
				
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
		
		User.find({ where: { email: email } })
			
			.success(function(user) {
				
				if ( user /* user not null */  && bcrypt.compareSync( password , user.password ) /* hashed pass same */) {
					
					req.session.userId = user.id ;
						
					res.redirect('/auth/account');
						
				} else {
					
					returnUserNotFound() ;
					
				}
				
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
		
		if ( email && password && confirmPassword && password === confirmPassword && password.length ) {
			
			var user = User.build({
				
				email : email ,
				password : bcrypt.hashSync( password , 8 )
				
			});
			
			// user.validate returns false if everything is ok. otherwise, returns errors per field
			
			var validationErrors = user.validate() ;
			
			if ( ! validationErrors ) {
				
				Role.getOrCreateRole( 'BETA_USER' , function(beta_user_role){
					
					user.save().success(function(user){
						
						req.session.userId = user.id ;
						
						user.addRole(beta_user_role)
							
							.success( function(user){
							
								res.redirect('/auth/account');
							
							})
						
							.error( function(){
							
								// Log that there was an error setting permissions,
								// but still send the user to their account page because
								// the user WAS saved to the DB, independent of the associated
								// user role.
							
								console.log('ERROR SETTING USER ROLE') ;
							
								res.redirect('/auth/account');
							
							})
							
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
			
			
		} else {
			
			res.render( 'join' , {
				
				error : password != confirmPassword ? "Passwords don't match" : "Email and Password required"
				
			});
		}
		
	};
	
	return methods ;
	
}
