/*global module, require */

module.exports = function ( grunt ) {

	'use strict';

	grunt.registerMultiTask( 'replaceTags', 'Replace all <%= tags %> in a set of files with variables', function () {

		var config, options, pattern, render, file, template, i;

		options = this.options();
		pattern = /<%=\s*([a-zA-Z_$][a-zA-Z_$0-9]*)\s*%>/g;

		render = function ( template, variables ) {
			var result = template.replace( pattern, function ( match, varName ) {
				if ( variables[ varName ] !== undefined ) {
					return variables[ varName ];
				}

				return match;
			});

			return result;
		};

		i = this.files.length;
		while ( i-- ) {
			file = this.files[i];

			if ( file.src.length !== 1 ) {
				grunt.log.error( 'Each file can only have one source!' );
				return false;
			}

			template = grunt.file.read( file.src[0] );

			grunt.file.write( file.dest, render( template, options.variables ) );
		}

	});
};