var Sequelize = require('sequelize') ;

module.exports = function( app ){
	
	// TODO
	// Pass in app reference to grab mysql config
	
	var sequelize = new Sequelize('quakejs', 'root' , 'password') ;

	var models = {};

	var Role = models.Role = sequelize.define('role',

		{
			text : {
				type : Sequelize.STRING ,
				unique : true ,
				validate : {
					notEmpty: true ,

				}
			}

		},{

			classMethods : {

				getOrCreateRole : function(roleText , cb){

					Role.find({ where : { text : roleText } })
						.success(function(role){

							if ( role !== null ) {

								cb(role)

							} else {

								Role.create({ text : roleText })

									.success(function(roleText){

										cb(role)

									})

							}

						})

				}

			}

		}
	);

	var User = models.User = sequelize.define('User', 

		{ 

			email : {

				type : Sequelize.STRING ,
				unique : true ,
				validate : {

					isEmail : true ,
					notEmpty: true ,

				}

			},

			password : {

				type : Sequelize.STRING ,

				validate : {
					notEmpty: true ,
				}

			}

		},{

			instanceMethods : {

				hasRoleSync : function ( roleName ) {

					var hasRole = false ;

					this.roles.forEach( function(role){

						if  ( role.text === roleName ) hasRole = true ;

					});
					return hasRole ;
				}

			},

			timestamps: true,
			paranoid: true,
			underscored: true,
			freezeTableName: true
		}
	);

	User.hasMany(Role);

	Role.hasMany(User);

	sequelize.sync();
	
	return models ;
	
};
