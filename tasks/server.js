/*global module, require */

module.exports = function ( grunt ) {

	'use strict';

	grunt.registerMultiTask( 'server', 'Launch a preview server', function () {

		var done, options, app, connect, mime, middleware, listDir, url, fs, path, addTrailingSlash, removeTrailingSlash;

		done = this.async();

		connect = require( 'connect' );
		mime = require( 'mime' );
		url = require( 'url' );
		fs = require( 'fs' );
		path = require( 'path' );

		options = this.options();
		middleware = [];

		addTrailingSlash = function ( str ) {
			if ( str.substr( -1 ) !== '/' ) {
				return str + '/';
			}

			return str;
		};

		removeTrailingSlash = function ( str ) {
			if ( str.length && str.substr( -1 ) === '/' ) {
				return str.substr( 0, str.length - 1 );
			}

			return str;
		};

		listDir = function ( req, res, next, contents ) {
			var parsedUrl, pathname, html, style;

			contents.sort( function ( a, b ) {
				if ( ( a.isDir && b.isDir ) || ( !a.isDir && !b.isDir ) ) {
					return a.virtualpath > b.virtualpath;
				}

				return ( a.isDir ? -1 : 1 );
			});

			parsedUrl = url.parse( req.url );
			pathname = parsedUrl.pathname;

			html = '<a href="/readme">README!</a><h1>Listing virtual directory ' + pathname + '</h1>';

			// add link to parent dir... hack alert
			(function () {
				if ( pathname.substr( -1 ) === '/' ) {
					html += '<a href="../">../</a>';
				} else {
					html += '<a href="./">../</a>';
				}
			}());

			

			html += '<table>';

			contents.forEach( function ( item ) {
				if ( item.isDir ) {
					html += '<tr><td><a href="' + item.virtualpath + '"><strong>' + item.virtualpath + '</strong></a></td><td>' + item.filepath + '</td></tr>';
				} else {
					html += '<tr><td><a href="' + item.virtualpath + '">' + item.virtualpath + '</a></td><td>' + item.filepath + '</td></tr>';
				}
			});

			html += '</table>';

			style = "<style>body {font-family: 'Helvetica Neue', 'Arial'; font-size: 16px; color: #333; } h1 { font-size: 1.4em; } td { padding: 0.3em 1em 0.3em 0; border-bottom: 1px solid #eee; color: #aaa } a { display: block }</style>";

			res.setHeader( 'Content-Type', 'text/html' );
			res.end( style + html );
		};

		options.mappings.forEach( function ( mapping ) {
			middleware[ middleware.length ] = function ( req, res, next ) {
				var prefix, mimetype, data, dataStr, useStr, name, src, i, complete, folder, pathname, relpath, filepath, virtualDirContents, dirContents;

				prefix = mapping.prefix;
				virtualDirContents = [];

				pathname = url.parse( req.url ).pathname;

				// if the request URL matches the prefix...
				if ( pathname.indexOf( prefix ) === 0 ) {
					
					if ( typeof mapping.src === 'function' ) {
						res.end( mapping.src( req ) );
						return;
					}

					// ... try each of the src folders in turn
					src = ( typeof mapping.src === 'string' ? [ mapping.src ] : mapping.src );

					for ( i=0; i<src.length; i+=1 ) {
						folder = removeTrailingSlash( src[i] );
						//folder = src[i];

						relpath = pathname.substring( prefix.length );
						filepath = path.join( folder, relpath );

						if ( grunt.file.exists( filepath ) ) {
							if ( !grunt.file.isDir( filepath ) ) {
								mimetype = mime.lookup( filepath );
								data = fs.readFileSync( filepath );

								// replace tags
								dataStr = data.toString();
								dataStr = dataStr.replace( /<%=\s*([a-zA-Z$_0-9]+)\s*%>/g, function ( match, varName ) {
									if ( varName in options.variables ) {
										useStr = true; // not a binary file
										return options.variables[ varName ];
									}

									return match;
								});

								res.setHeader( 'Content-Type', mimetype );
								res.end( useStr ? dataStr : data );
								complete = true;
								break;
							}
							
							else {
								// add trailing slash
								filepath = addTrailingSlash( filepath );
								pathname = addTrailingSlash( pathname );

								dirContents = fs.readdirSync( filepath ).map( function ( item ) {
									return {
										filepath: filepath + item,
										virtualpath: pathname + item,
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