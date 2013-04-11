/*global module */

module.exports = function ( grunt ) {

	'use strict';

	grunt.registerMultiTask( 'uploadToS3', 'Upload files to S3', function () {

		var done, fs, path, mime, extend, options, config, ignore, s3, S3Batch, batch, normalise, params;

		// this is an async task
		done = this.async();
		
		options = this.options({
			maxage: 60
		});

		// dependencies
		S3Batch = require( 's3-batch' );
		fs = require( 'fs' );
		path = require( 'path' );
		mime = require( 'mime' );
		extend = require( 'extend' );

		// fetch project config
		config = grunt.config();
		ignore = this.flags.ignore;

		// retrieve reference to current s3 instance
		s3 = grunt.s3;

		if ( !s3 ) {
			grunt.log.error( this.name + ' task needs an instance of AWS.S3' );
			done( false );
			return;
		}

		normalise = function ( filepath ) {
			return filepath.split( path.sep ).join( '/' );
		};

		

		batch = new S3Batch( s3, {
			Bucket: config.s3.bucket,
			ACL: 'public-read'
		});

		batch.on( 'error', function ( file ) {
			grunt.log.error( 'Could not upload to ' + file.key );
			done( false );
		});

		batch.on( 'progress', function ( progress, file ) {
			var pad, humanise, percent, numFiles, msg;

			pad = function ( str, len ) {
				while ( str.length < len ) {
					str = ' ' + str;
				}

				return str;
			};

			humanise = function ( size ) {
				if ( size < 1024 ) {
					return size = 'b';
				}

				if ( size < 1024 * 1024 ) {
					return ( size / 1024 ).toFixed( 1 ) + 'kb';
				}

				return ( size / ( 1024 * 1024 ) ).toFixed( 1 ) + 'M';
			};

			percent = pad( ( progress * 100 ).toFixed( 1 ) + '%', 6 );
			numFiles = pad( '(' + this.completed.files + '/' + this.total.files + ')', ( 4 + ( '' + this.total.files ).length * 2 ) );

			grunt.log.writeln( percent + numFiles + ' : ' + file.key + ' (' + humanise( file.data.length ) + ')' );
		});

		batch.on( 'complete', done );



		// we have a single file
		if ( options.key ) {

			// do we have data or a file?
			if ( options.src ) {
				params = extend({ ContentType: mime.lookup( options.src ) }, options.params || {});

				batch.add( options.key, grunt.file.read( options.src ), params );
			}

			else if ( options.data ) {
				batch.add( options.key, options.data, options.params );
			}
		}

		// we have a bunch of files
		else if ( options.root ) {
			

			// add trailing slash, if there isn't one already
			if ( options.pathPrefix.substr( -1 ) !== '/' ) {
				options.pathPrefix += '/';
			}

			grunt.file.recurse( options.root, function ( abspath, rootdir, subdir, filename ) {
				var relpath, data;

				// normalise subdir, for the benefit of bongo and other windows users...
				relpath = ( subdir ? normalise( subdir ) + '/' + filename : filename );

				// data = grunt.file.read( abspath, { encoding: null } );
				data = fs.readFileSync( abspath );

				params = extend({
					ContentType: mime.lookup( filename ),
					CacheControl: 'max-age=' + options.maxage
				}, options.params || {});

				batch.add( options.pathPrefix + relpath, data, params);
			});

		} else if ( this.files ){
			
			var numFiles = this.files.length;
			for(var i = 0; i < numFiles; ++i){
				var file = this.files[i];
				
				if ( !grunt.file.isDir( file.src[0] ) ) {
					var srcPath = normalise(file.src[0]);
					var destPath = normalise(file.dest)

					var data = fs.readFileSync( srcPath );

					params = extend({
						ContentType: mime.lookup( srcPath ),
						CacheControl: 'max-age=' + options.maxage
					}, options.params || {});

					batch.add( options.pathPrefix + destPath, data, params);
				}	
			}
		}
		
		batch.start();
	});

};