/*global module, require */

module.exports = function ( grunt ) {

	'use strict';

	grunt.registerMultiTask( 'server', 'Launch a preview server', function () {

		var done, options, app, connect, middleware;

		done = this.async();

		connect = require( 'connect' );

		options = this.options();
		middleware = [];

		// dynamic responses
		if ( options.dynamic ) {
			options.dynamic.forEach( function ( item ) {
				middleware[ middleware.length ] = function ( req, res, next ) {
					if ( item.filter( req ) ) {
						res.end( item.response() );
					}

					else {
						next();
					}
				};
			});
		}

		// static responses
		if ( options.static ) {
			options.static.forEach( function ( root ) {
				middleware[ middleware.length ] = connect.static( root );
			});
		}

		app = connect();

		middleware.forEach( function ( middleware ) {
			app = app.use( middleware );
		});

		app.listen( options.port );

	});

};