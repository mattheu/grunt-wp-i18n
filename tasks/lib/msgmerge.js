/*
 * grunt-wp-i18n
 * https://github.com/cedaro/grunt-wp-i18n
 *
 * Copyright (c) 2015 Cedaro, LLC
 * Licensed under the MIT license.
 */

'use strict'

const gulpUtil = require( 'gulp-util' )
const spawn    = require('child_process').spawn
const path     = require( 'path' )

exports.init = function( grunt ) {

	var exports = {}

	/**
	 * Uses gettext msgmerge to merge a .pot file into a .po
	 *
	 * @param from string File to merge from (generally a .pot file)
	 * @param to string File to merge to (generally a .po file)
	 * @param callback function Callback to call after being done
	 */
	exports.msgMerge = function( from, to, callback ) {

		var msgmerge = spawn( 'msgmerge', [ '--update', '--backup=none', to, from ] )

		msgmerge.stderr.on( 'data', (data) => {
			gulpUtil.fail( 'msgmerge error:' + data )
			callback()
		})

		msgmerge.stdout.on( 'data', (data) => {
			gulpUtil.log( 'POT file merged into ' + path.relative( process.cwd(), to ) )
			callback()
		})

	}

	/**
	 * Searches around a .pot file for .po files
	 *
	 * @param potFile string The .pot file to search around
	 * @param type string Type of project, either wp-plugin or wp-theme
	 * @return string[] poFiles around the given potFile
	 */
	exports.searchPoFiles = function( potFile, type ) {
		return fs.readdirSync( path.dirname( potFile ) )
			.filter( function( fileName ) {
				return fileName.match( /^.+\.po/ )
			} )
	}

	return exports
}
