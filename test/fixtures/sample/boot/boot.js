/*global document */

(function ( doc ) {

	'use strict';

	var projectUrl, versionUrl, img;

	projectUrl = '<%= projectUrl %>';
	versionUrl = '<%= versionUrl %>';

	doc.getElementById( 'projectUrl' ).innerText = projectUrl;
	doc.getElementById( 'versionUrl' ).innerText = versionUrl;

	doc.getElementById( 'success' ).src = '<%= versionUrl %>/success.jpg';

}( document ));