/*
 * grunt-wp-i18n
 * https://github.com/cedaro/grunt-wp-i18n
 *
 * Copyright (c) 2014 Cedaro, LLC
 * Licensed under the MIT license.
 */

'use strict';

const fileExists = require('file-exists');
const fs = require('fs');
const gutil = require('gulp-util');

exports.init = function() {
	var exports = {},
		path = require( 'path' );

	/**
	 * Get the value of a plugin or theme header.
	 *
	 * @param {string} name Name of the header.
	 * @param {string} file Optional. Path of the main file.
	 *
	 * @return {string|bool}
	 */
	exports.getHeader = function( name, file ) {
		var matches, pattern;

		if ( 'undefined' === typeof file ) {
			file = exports.getMainFile();
		}

		if ( fileExists( file ) ) {

			pattern = new RegExp( name + ':(.*)$', 'mi' );
			matches = fs.readFileSync( file ).toString().match( pattern );

			if ( matches ) {
				return matches.pop().trim();
			}

		}

		if ( 'Text Domain' === name ) {
			return exports.slugify();
		}

		return '';
	};

	/**
	 * Discover the main project file.
	 *
	 * For themes, the main file will be style.css. The main file for plugins
	 * contains the plugin headers.
	 *
	 * @param {string} type Project type. Either wp-theme or wp-plugin.
	 *
	 * @return {string|bool}
	 */
	exports.getMainFile = function( type ) {
		var slug = exports.slugify(),
			pluginFile = slug + '.php',
			found;

		if ( 'wp-theme' === type || ( 'undefined' === typeof type && fileExists( 'style.css' ) ) ) {
			return 'style.css';
		}

		if ( fileExists( pluginFile ) && exports.getHeader( 'Plugin Name', pluginFile ) ) {
			return pluginFile;
		}

		// Search for plugin headers in php files in the main directory.
		fs.readdirSync( './' ).forEach( function( fileName ) {

			if ( ! fileName.match( /^.+\.php/ ) ) {
				return;
			}

			if ( exports.getHeader( 'Plugin Name', process.cwd() + '/' + fileName ) ) {
				found = process.cwd() + '/' + fileName;
			}

		});

		return found;
	};

	/**
	 * Guess the project slug.
	 *
	 * See MakePOT::guess_plugin_slug() in makepot.php
	 *
	 * @return {string}
	 */
	exports.slugify = function() {
		var slug = path.basename( process.cwd() ),
			slug2 = path.basename( path.dirname( process.cwd() ) );

		if ( 'trunk' === slug ) {
			slug = slug2;
		} else if ( -1 !== [ 'branches', 'tags' ].indexOf( slug2 ) ) {
			slug = path.basename( path.dirname( path.dirname( process.cwd() ) ) );
		}

		return slug;
	};

	return exports;
};
