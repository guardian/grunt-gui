/*global module, require */

module.exports = function ( grunt ) {

	'use strict';

	grunt.registerMultiTask( 'server', 'Launch a preview server', function () {

		var done, options, app, connect, mime, middleware, listDir, url, fs;

		done = this.async();

		connect = require( 'connect' );
		mime = require( 'mime' );
		url = require( 'url' );
		fs = require( 'fs' );

		options = this.options();
		middleware = [];

		listDir = function ( req, res, next, contents ) {
			var parsedUrl, pathname, html;

			contents.sort( function ( a, b ) {
				if ( ( a.isDir && b.isDir ) || ( !a.isDir && !b.isDir ) ) {
					return a.virtualpath > b.virtualpath;
				}

				return ( a.isDir ? -1 : 1 );
			});

			parsedUrl = url.parse( req.url );
			pathname = parsedUrl.pathname;

			html = '<a href="/readme">README!</a><p>Listing virtual directory ' + pathname + '</p>';

			html += '<table>';

			contents.forEach( function ( item ) {
				if ( item.isDir ) {
					html += '<tr><td><a href="' + item.virtualpath + '"><strong>' + item.virtualpath + '</strong></a></td><td>' + item.filepath + '</td></tr>';
				} else {
					html += '<tr><td><a href="' + item.virtualpath + '">' + item.virtualpath + '</a></td><td>' + item.filepath + '</td></tr>';
				}
			});

			html += '</table>';

			res.setHeader( 'Content-Type', 'text/html' );
			res.end( html );
		};

		options.mappings.forEach( function ( mapping ) {
			middleware[ middleware.length ] = function ( req, res, next ) {
				var prefix, mimetype, data, src, i, complete, folder, relpath, filepath, virtualDirContents, dirContents;

				prefix = mapping.prefix;
				virtualDirContents = [];

				// if the request URL matches the prefix...
				if ( req.url.indexOf( prefix ) === 0 ) {
					
					if ( typeof mapping.src === 'function' ) {
						res.end( mapping.src( req ) );
						return;
					}

					// ... try each of the src folders in turn
					src = ( typeof mapping.src === 'string' ? [ mapping.src ] : mapping.src );

					for ( i=0; i<src.length; i+=1 ) {
						folder = src[i];

						relpath = req.url.substring( prefix.length );
						filepath = folder + relpath;

						if ( grunt.file.exists( filepath ) ) {
							if ( !grunt.file.isDir( filepath ) ) {
								mimetype = mime.lookup( filepath );

								res.setHeader( 'Content-Type', mimetype );
								res.end( grunt.file.read( filepath ) );
								complete = true;
								break;
							}
							
							else {
								// add trailing slash
								if ( req.url.substr( -1 ) !== '/' ) {
									req.url += '/';
								}

								dirContents = fs.readdirSync( filepath ).map( function ( item ) {
									return {
										filepath: filepath + item,
										virtualpath: req.url + item,
										isDir: grunt.file.isDir( filepath + item )
									};
								});

								virtualDirContents = virtualDirContents.concat( dirContents );
							}
						}
					}

					if ( !complete ) {
						if ( virtualDirContents.length ) {
							listDir( req, res, next, virtualDirContents );
						} else {
							next();
						}
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
			res.setHeader( 'Content-Type', 'text/html' );
			res.end( 'File not found: ' + req.url + ' (have you run grunt? See the <a href="/readme">README</a> for more info)' );
		});

		app.listen( options.port );

		grunt.log.writeln( 'Listening on port ' + options.port + '. Hit Ctrl+C to kill server' );

	});

};