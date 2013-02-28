/*global module */

module.exports = function ( grunt ) {

	'use strict';

	grunt.registerTask( 'verifyManifest', 'Verify that the project GUID matches the remote manifest', function () {

		var done, config, options, prompt, data, manifest;

		done = this.async();

		prompt = require( 'prompt' );

		config = grunt.config();
		options = this.options();

		// If no manifest is found, prompt user to create version 1
		if ( !grunt.file.exists( options.src ) ) {
			prompt.message = 'Project not found at ' + ( config.projectUrl ).underline;

			prompt.start();

			prompt.get({
				properties: {
					createNew: {
						description: ( 'Create?' ) + ' [y/n]'.bold.green
					}
				}
			}, function ( err, result ) {
				if ( result.createNew.substr( 0, 1 ).toLowerCase() !== 'y' ) {
					done( false );
				}

				else {
					grunt.log.writeln( 'Creating version 1' );
					grunt.config( 'version', 1 );
					done();
				}
			});
		}

		else {
			data = grunt.file.read( options.src );

			// is it JSON?
			try {
				manifest = JSON.parse( data );
			} catch ( err ) {
				grunt.log.error( 'Invalid file' );
				done( false );
				return;
			}

			if ( manifest.guid !== config.guid ) {
				grunt.log.error( 'GUIDs do not match. If you are sure that you want to overwrite this project, edit Gruntfile.js so that it has the following GUID:\n\n' + manifest.guid );
				done( false );
				return;
			}

			grunt.log.writeln( 'GUIDs match. Next version is ' + ( manifest.version + 1 ) );
			grunt.config( 'version', ( manifest.version + 1 ) );

			done();
		}

	});
};