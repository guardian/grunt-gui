/*global module, require */

module.exports = function ( grunt ) {

	'use strict';

	grunt.registerTask( 'createS3Instance', function () {
		
		var AWS, fs, config, credentials, accessKeyId, secretAccessKey, s3;

		AWS = require( 'aws-sdk' );
		fs = require( 'fs' );

		config = grunt.config( 's3' ) || {};

		// load credentials from task config... (DO NOT DO THIS!)
		if ( config.accessKeyId && config.secretAccessKey ) {
			accessKeyId = config.accessKeyId;
			secretAccessKey = config.secretAccessKey;
		}

		// ...or specified JSON file
		else if ( config.credentials && fs.fileExistsSync( config.credentials ) ) {
			credentials = JSON.parse( grunt.file.read( config.credentials ) );
			accessKeyId = credentials.accessKeyId;
			secretAccessKey = credentials.secretAccessKey;
		}

		// ... or from environment
		else if ( process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ) {
			accessKeyId = process.env.AWS_ACCESS_KEY_ID;
			secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
		}

		// no credentials? boo
		if ( !accessKeyId || !secretAccessKey ) {
			grunt.log.error( 'Missing AWS credentials!' );
			return false;
		}

		// update config
		AWS.config.update({
			accessKeyId: accessKeyId,
			secretAccessKey: secretAccessKey,
			region: config.region || 'us-east-1'
		});

		// get our s3 object
		s3 = new AWS.S3();

		// monkey-patching alert! Is there a better way to do this?
		grunt.s3 = s3;
	});

};