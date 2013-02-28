/*global module */

module.exports = function ( grunt ) {

	'use strict';

	grunt.registerMultiTask( 'downloadFromS3', 'Upload files to S3', function () {

		var done, options, s3, objectRequest;

		// this is an async task
		done = this.async();

		options = this.options();

		// retrieve reference to current s3 instance
		s3 = grunt.s3;

		if ( !s3 ) {
			grunt.log.error( this.name + ' task needs an instance of AWS.S3' );
			done( false );
		}

		
		objectRequest = s3.client.getObject({
			Bucket: options.bucket,
			Key: options.key
		});

		objectRequest.on( 'error', function () {
			done();
		});

		objectRequest.on( 'success', function ( response ) {
			var data, remoteManifest;

			data = response.data.Body.toString();
			
			grunt.file.write( options.dest, data );
			grunt.log.writeln( 'Writing file to disk: ' + options.dest );

			done();
		});

		objectRequest.send();
	});

};