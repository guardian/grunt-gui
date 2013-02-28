/*global module, require */

module.exports = function ( grunt ) {

	'use strict';

	grunt.registerTask( 'lockProject', 'Lock project to prevent concurrency errors', function () {

		var done, options, s3, putObjectRequest, deleteObjectRequest, unlock;

		// this is an async task
		done = this.async();

		options = this.options();
		s3 = grunt.s3;

		unlock = this.flags.unlock;

		if ( !s3 ) {
			grunt.log.error( this.name + ' task needs an instance of AWS.S3' );
			done( false );
		}

		if ( unlock ) {
			deleteObjectRequest = s3.client.deleteObject({
				Bucket: options.bucket,
				Key: options.lockfile
			});

			deleteObjectRequest.on( 'error', function () {
				grunt.log.error( 'Could not unlock project' );
				done( false );
			});

			deleteObjectRequest.on( 'success', done );

			deleteObjectRequest.send();
		}

		else {
			putObjectRequest = s3.client.putObject({
				Bucket: options.bucket,
				Key: options.lockfile,
				ACL: 'public-read',
				Body: 'This project is currently locked. Double-check none of the team are currently deploying. If this state persists, something may have gone titsup - delete this file'
			});

			putObjectRequest.on( 'error', function () {
				grunt.log.error( 'Could not lock project' );
				done( false );
			});

			putObjectRequest.on( 'success', done );

			putObjectRequest.send();
		}

	});
};