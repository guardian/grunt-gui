/*global module, require */

module.exports = function ( grunt ) {

	'use strict';

	grunt.registerMultiTask( 'server', 'Launch a preview server', function () {

		var done, options, app, connect, mime, middleware;

		done = this.async();

		connect = require( 'connect' );
		mime = require( 'mime' );

		options = this.options();
		middleware = [];

		options.mappings.forEach( function ( mapping ) {
			middleware[ middleware.length ] = function ( req, res, next ) {
				var prefix, mimetype, data, src, i, complete, folder, relpath, filepath;

				prefix = mapping.prefix;

				// if the request URL matches the prefix...
				if ( req.url.indexOf( prefix ) === 0 ) {
					// ... try each of the src folders in turn
					src = ( typeof mapping.src === 'string' ? [ mapping.src ] : mapping.src );

					for ( i=0; i<src.length; i+=1 ) {
						folder = src[i];

						relpath = req.url.substring( prefix.length );
						filepath = folder + relpath;

						if ( grunt.file.exists( filepath ) ) {
							mimetype = mime.lookup( filepath );

							res.setHeader( 'Content-Type', mimetype );
							res.end( grunt.file.read( filepath ) );
							complete = true;
							break;
						}
					}

					if ( !complete ) {
						next();
					}
				}

				else {
					next();
				}
			};
		});

		app = connect();

		middleware.forEach( function ( middleware ) {
			app = app.use( middleware );
		});

		app.use( function ( req, res, next ) {
			res.statusCode = 404;
			res.end( 'File not found: ' + req.url + ' (have you run grunt?)' );
		});

		app.listen( options.port );

		grunt.log.writeln( 'Listening on port ' + options.port + '. Hit Ctrl+C to kill server' );

	});

};