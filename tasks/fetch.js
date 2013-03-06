module.exports = function ( grunt ) {
	
	grunt.registerMultiTask( 'fetch', 'Fetch files from remote URL', function () {
		var options, task, http, https, getOptions, responseHandler, done, fetch, remaining = 0;

		// fail if no 'data' option set
		grunt.config.requires( 'fetch' );

		// async task
		done = this.async();

		https = require( 'https' );
		http = require( 'http' );

		task = this.data;
		options = this.options();

		
		
		var key, module, request, parsedUrl, result = '';

		if ( task.url && task.dest ) {
			
			remaining += 1;

			parsedUrl = require( 'url' ).parse( task.url );

			if ( parsedUrl.protocol === 'http:' ) {
				module = http;
			} else if ( parsedUrl.protocol === 'https:' ) {
				module = https;
			} else {
				done( false );
			}

			request = https.request( parsedUrl, function ( response ) {
				response.on('data', function( data ) {
					result += data;
				});

				response.on( 'end', function () {
					var processed;

					if ( options.process ) {
						result = options.process( result );
					}

					if ( !result ) {
						grunt.log.write( 'Response failed (%s)', task.dest );
						done( false );
					}

					grunt.log.write( 'Writing data to ' + task.dest + ':\n' );
					grunt.log.write( ( result.length > 200 ? result.substr( 0, 200 ) + '...' : result ) + '\n' );

					grunt.file.write( task.dest, result );

					if ( --remaining ) {
						return;
					}

					done();
				});
			});

			request.end();
		}
	});
};