/*
 * grunt-wp-i18n
 * https://github.com/cedaro/grunt-wp-i18n
 *
 * Copyright (c) 2014 Cedaro, LLC
 * Licensed under the MIT license.
 */

'use strict';

const through     = require( 'through2' )
const _           = require( 'underscore' );
const gettext     = require( 'gettext-parser' )
const path        = require( 'path' )
const pkg         = require( '../package.json' )
const util        = require( './lib/util' ).init()
const localConfig = util.getLocalConfig()
const wp          = require( './lib/wordpress' ).init()
const msgMerge    = require( './lib/msgmerge' ).init()
const async       = require( 'async' )
const fileExists  = require( 'file-exists' )
const gulpUtil    = require( 'gulp-util' )
const fs          = require( 'fs' )
const spawn       = require('child_process').spawn

// Mix no-conflict string functions into the Underscore namespace.
_.str = require( 'underscore.string' );
_.mixin( _.str.exports() );

/**
 * Generate a POT file for translating strings.
 *
 * php-cli should be in the system path to run this task.
 *
 * @link http://develop.svn.wordpress.org/trunk/tools/i18n/
 */
var makePot = function( options ) {

	var defaultI18nToolsPath = path.resolve( __dirname, '../vendor/wp-i18n-tools/' ),
		gulpBase = process.cwd(),
		cmdArgs,
		originalPot;

	var o = {
		cwd             : process.cwd(),
		domainPath      : '',
		exclude         : [],
		include         : [],
		i18nToolsPath   : defaultI18nToolsPath,
		mainFile        : '',
		potComments     : '',
		potFilename     : '',
		potHeaders      : {},
		processPot      : null,
		type            : 'wp-plugin',
		updateTimestamp : true,
		updatePoFiles   : false
	};

	// Set the current working directory.
	o.cwd = path.resolve( process.cwd(), o.cwd );

	// Attempt to discover the main project file.
	if ( '' === o.mainFile ) {
		o.mainFile = wp.getMainFile( o.type );
	}

	// Use Domain Path header if the domain path hasn't been set.
	if ( '' === o.domainPath ) {
		o.domainPath = wp.getHeader( 'Domain Path', o.mainFile );
	}

	// Use the Text Domain header or project folder name
	// for the pot file if it hasn't been set.
	if ( '' === o.potFilename ) {
		o.potFilename = wp.getHeader( 'Text Domain', o.mainFile ) + '.pot' || wp.slugify() + '.pot';
	}

	o.domainPath = _.ltrim( o.domainPath, [ '/', '\\' ] );
	o.i18nToolsPath = localConfig.i18nToolsPath || o.i18nToolsPath;
	o.potFile = path.join( o.cwd, o.domainPath, o.potFilename );

	// Make sure the makepot.php script exists.
	o.makepotScript = path.join( o.i18nToolsPath, 'makepot.php' );
	if ( ! fileExists( o.makepotScript ) ) {
		gulpUtil.fail( 'makepot.php could not be found in ' + o.i18nToolsPath );
	}

	// Create the domain path directory if it doesn't exist.
	try {
		fs.accessSync( path.resolve( o.cwd, o.domainPath ), fs.F_OK );
	} catch (e) {
		fs.mkdirSync( path.resolve( o.cwd, o.domainPath ) );
	}

	// Exclude the node_modules directory by default.
	o.exclude.push( 'node_modules/.*' );

	// Build the list of CLI args.
	cmdArgs = [
		o.makepotScript,
		o.type,
		o.cwd,
		o.potFile
	];

	// if ( defaultI18nToolsPath === o.i18nToolsPath ) {
	// 	// Use the custom CLI script that extends makepot.php.
	// 	o.makepotScript = path.join( o.i18nToolsPath, 'grunt-makepot.php' );

	// 	// Only add custom CLI args if using the bundled tools.
	// 	cmdArgs[0] = o.makepotScript;
	// 	cmdArgs.push( o.mainFile.split( '.' ).shift() );
	// 	cmdArgs.push( o.exclude.join( ',' ) );
	// 	cmdArgs.push( o.include.join( ',' ) );
	// }

	// Parse the existing POT file to compare for changes.
	if ( ! o.updateTimestamp && fileExists( o.potFile ) ) {
		originalPot = gettext.po.parse( fs.readfileSync( o.potFile ).toString() );
	}

	var makepot = spawn( 'php', cmdArgs, { stdio: 'inherit' } );

	// , function( error, result, code ) {
	// 	var matches, pattern, pot, poFiles;

	// 	if ( 0 === code && grunt.file.exists( o.potFile ) ) {
	// 		pot = grunt.file.read( o.potFile );

	// 		// Update the comments header.
	// 		pattern = /# <!=([\s\S]+?)=!>/;
	// 		if ( '' === o.potComments && ( matches = pot.match( pattern ) ) ) {
	// 			o.potComments = matches[1];
	// 		}
	// 		o.potComments = '# ' + o.potComments.replace( /\n(# )?/g, '\n# ' ).replace( '{year}', new Date().getFullYear() );
	// 		pot = pot.replace( pattern, o.potComments );

	// 		// Remove duplicate entries from the POT file.
	// 		pot = gettext.po.parse( pot );

	// 		// Merge custom headers.
	// 		pot.headers['x-generator'] = 'grunt-wp-i18n ' + pkg.version;
	// 		pot = util.mergeHeaders( pot, o.potHeaders );

	// 		// Allow the POT file to be modified with a callback.
	// 		if ( _.isFunction( o.processPot ) ) {
	// 			pot = o.processPot.call( undefined, pot, o );
	// 		}

	// 		// Determine if the creation date is the only thing that changed.
	// 		if ( ! o.updateTimestamp && ! _.isUndefined( originalPot ) ) {
	// 			pot = util.comparePotFiles( originalPot, pot ) ? originalPot : pot;
	// 		}

	// 		// Fix headers.
	// 		pot = gettext.po.compile( pot ).toString();
	// 		pot = util.fixHeaders( pot );

	// 		// Save the POT file.
	// 		grunt.file.write( o.potFile, pot );
	// 		grunt.log.ok( 'POT file saved to ' + path.relative( process.cwd(), o.potFile ) );

	// 		// Maybe update .po files
	// 		if ( o.updatePoFiles ) {
	// 			poFiles = msgMerge.searchPoFiles( o.potFile, o.type );

	// 			async.eachSeries( poFiles, function( poFile, done ) {
	// 				msgMerge.msgMerge( o.potFile, poFile, done );
	// 			}, done );

	// 		} else {
	// 			done( error, result );
	// 		}
	// 	} else {
	// 		done( error, result );
	// 	}
	// });
}

module.exports = function( options ) {

	// Creating a stream through which each file will pass
	return through.obj( function( file, enc, cb ) {

		if ( file.isNull() ) {
			// return empty file
			return cb( null, file );
		}

		if ( file.isStream() ) {
			cb( new gutil.PluginError( 'gulp-makepot', 'Streaming not supported' ) );
			return;
		}

		makePot( options );

	} );

};
