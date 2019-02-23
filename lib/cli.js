/*
	Babel Temple CLI

	Copyright (c) 2019 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



//const path = require( 'path' ) ;
//const term = require( 'terminal-kit' ).terminal ;
//const Promise = require( 'seventh' ) ;

const cliManager = require( 'utterminal' ).cli ;



function cli() {
	var data , dataExt , dataPath , argsData ;

	/* eslint-disable indent */
	var args = cliManager.package( require( '../package.json' ) )
		.app( 'Babel Temple' )
		.introIfTTY
		.helpOption
		.camel
		.description( "Babel temple CLI." )
		.arg( 'template' ).string
			.typeLabel( 'template-file' )
			.description( "The template file." )
		.opt( 'data' ).string
			.typeLabel( 'data-file' )
			.description( "The data file to load." )
		.opt( [ 'output' , 'o' ] ).string
			.typeLabel( 'output-file' )
			.description( "The output file." )
		.details( "Any extra option will override the data file (if any).\nE.g. to override the data file's name: --name bob\n" )
		.run() ;
	/* eslint-enable indent */

	if ( ! config.template ) {
		cliManager.displayHelp() ;
		return ;
	}

	if ( args.data ) {
		dataExt = path.extname( args.data ) ;
		dataPath = path.join( process.cwd() , args.data ) ;

		if ( dataExt === '.json' ) {
			data = require( dataPath ) ;
		}
		else {
			data = require( 'kung-fig' ).load( dataPath ) ;
		}
	}
	
	argsData = Object.assign( {} , args ) ;
	delete argsData.data ;
	delete argsData.output ;
	
	// Assign after generateKey()
	Object.assign( data , args ) ;
}

module.exports = cli ;

