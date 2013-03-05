/*
 * grunt-gui
 * 
 *
 * Copyright (c) 2013 Guardian Interactive team
 * Licensed under the none license.
 */

'use strict';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		
		// Deployment parameters
		guid: 'abce',

		baseUrl: 'http://interactive.guim.co.uk/',

		projectPath: 'deploy-test-3',
		versionDir: '/v/<%= version %>',
		versionPath: '<%= projectPath %><%= versionDir %>',
		
		projectUrl: '<%= baseUrl %><%= projectPath %>',
		versionUrl: '<%= baseUrl %><%= projectPath %><%= versionDir %>',

		s3: {
			bucket: 'gdn-cdn'
		},

		jshint: {
			all: [
				'Gruntfile.js',
				'tasks/*.js',
				'<%= nodeunit.tests %>',
			],
			options: {
				jshintrc: '.jshintrc',
			},
		},

		// Before generating any new files, remove any previously-created files.
		clean: {
			tmp: ['tmp'],
		},

		// Configuration to be run (and then tested).
		

		// Unit tests.
		nodeunit: {
			tests: ['test/*_test.js'],
		},


		// Render variables
		replaceTags: {
			preDeploy: {
				files: [
					{
						expand: true,
						cwd: 'test/fixtures/sample/boot/',
						src: [ '**/*' ],
						dest: 'tmp/boot'
					}
				],
				options: {
					variables: {
						projectUrl: '<%= projectUrl %>',
						versionUrl: '<%= versionUrl %>'
					}
				}
			}
		},


		// Download from S3
		downloadFromS3: {
			options: {
				bucket: '<%= s3.bucket %>'
			},
			manifest: {
				options: {
					key: '<%= projectPath %>/manifest.json',
					dest: 'tmp/manifest.json'
				}
			}
		},


		// Verify manifest
		verifyManifest: {
			options: {
				src: 'tmp/manifest.json'
			}
		},


		lockProject: {
			options: {
				bucket: '<%= s3.bucket %>',
				lockfile: '<%= projectPath %>/locked.txt'
			}
		},

		// Upload to S3
		uploadToS3: {
			options: {
				bucket: '<%= s3.bucket %>'
			},
			manifest: {
				options: {
					key: '<%= projectPath %>/manifest.json',
					data: '{"guid":"<%= guid %>","version":<%= version %>}',
					params: {
						CacheControl: 'no-cache',
						ContentType: 'application/json'
					}
				}
			},
			version: {
				options: {
					root: 'test/fixtures/sample/version/',
					pathPrefix: '<%= versionPath %>',
					params: {
						CacheControl: 'max-age=31536000'
					}
				}
			},
			boot: {
				options: {
					root: 'tmp/boot/',
					pathPrefix: '<%= projectPath %>',
					params: {
						CacheControl: 'max-age=20'
					}
				}
			}
		},

		// shell commands
		shell: {
			open: {
				command: 'open <%= projectUrl %>/index.html'
			}
		}

	});

	// Actually load this plugin's task(s).
	grunt.loadTasks( 'tasks' );

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-shell');


	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint']);


	// deploy sequence
	grunt.registerTask( 'deploy', [
		'clean',
		'createS3Instance',
		'downloadFromS3:manifest',
		'verifyManifest',
		'replaceTags:preDeploy',
		'lockProject',
		'uploadToS3:manifest',
		'uploadToS3:version',
		'uploadToS3:boot',
		'lockProject:unlock',
		'shell:open'
	]);

};
