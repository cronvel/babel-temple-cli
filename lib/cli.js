/*
	Babel Temple CLI

	Copyright (c) 2019 - 2020 Cédric Ronvel

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



const Temple = require( 'babel-temple' ) ;

const path = require( 'path' ) ;
const fs = require( 'fs' ) ;

const term = require( 'terminal-kit' ).terminal ;
const Promise = require( 'seventh' ) ;

const commands = {} ;

const cliManager = require( 'utterminal' ).cli ;



function cli() {
	/* eslint-disable indent */
	var args = cliManager.package( require( '../package.json' ) )
		.app( 'Babel Temple' )
		.description( "Babel temple CLI." )
		.introIfTTY
		.helpOption
		.commonCommands
		.commandRequired
		.command( 'render' )
            .description( "Render the template with some data." )
			.arg( 'template' ).string
				.typeLabel( 'template-file' )
				.description( "The template file." )
			.opt( 'data' ).string
				.typeLabel( 'data-file' )
				.description( "The data file to load." )
			.opt( 'presets' ).string
				.typeLabel( 'presets-file' )
				.description( "The presets file to load." )
			.opt( [ 'output' , 'o' ] ).string
				.typeLabel( 'output-file' )
				.description( "The output file." )
			.details( "Any extra option will override the data file (if any).\nE.g. to override the data file's name: --name bob\n" )
		.command( 'multi-render' )
            .description( "Render a template with multi-rendering capabilities, with some data. Multiple files will be created." )
			.arg( 'template' ).string
				.typeLabel( 'template-file' )
				.description( "The template file." )
			.opt( 'data' ).string
				.typeLabel( 'data-file' )
				.description( "The data file to load." )
			.opt( 'presets' ).string
				.typeLabel( 'presets-file' )
				.description( "The presets file to load." )
			.opt( [ 'output' , 'o' ] ).string
				.typeLabel( 'output-file' )
				.description( "The output filename model, with -n appended before the extension, 'n' being an integer starting from 1, and incremented for each rendering." )
			.details( "Any extra option will override the data file (if any).\nE.g. to override the data file's name: --name bob\n" )
		.run() ;
	/* eslint-enable indent */

	commands[ args.command ]( args ) ;
}

module.exports = cli ;



commands.render = async function( args ) {
	var argsData ,
		data , dataExt , dataPath , dataDir ,
		presets , presetsExt , presetsPath , presetsDir ,
		template , templatePath , templateDir ,
		lib , rendered , outputPath ;

	argsData = Object.assign( {} , args ) ;
	delete argsData.data ;
	delete argsData.presets ;
	delete argsData.output ;

	/*
	if ( ! config.template ) {
		cliManager.displayHelp() ;
		return ;
	}
	*/

	if ( args.data ) {
		dataExt = path.extname( args.data ) ;
		dataPath = path.isAbsolute( args.data ) ? args.data : path.join( process.cwd() , args.data ) ;
		dataDir = path.dirname( dataPath ) ;
		data = dataExt === '.json' ? require( dataPath ) : require( 'kung-fig' ).load( dataPath ) ;

		if ( data.template && ! path.isAbsolute( data.template ) ) {
			data.template = path.join( dataDir , data.template ) ;
		}
	}
	else {
		data = {} ;
	}

	if ( args.presets ) {
		presetsExt = path.extname( args.presets ) ;
		presetsPath = path.isAbsolute( args.presets ) ? args.presets : path.join( process.cwd() , args.presets ) ;
		presetsDir = path.dirname( presetsPath ) ;
		presets = presetsExt === '.json' ? require( presetsPath ) : require( 'kung-fig' ).load( presetsPath ) ;
		data._ = presets ;
	}

	Object.assign( data , argsData ) ;
	//console.log( "Data:" , data ) ;

	if ( ! data.template ) {
		term.red( "Missing template.\n" ) ;
		cliManager.displayHelp() ;
		return ;
	}

	templatePath = path.isAbsolute( data.template ) ? data.template : path.join( process.cwd() , data.template ) ;
	templateDir = path.dirname( templatePath ) ;
	template = fs.readFileSync( templatePath , 'utf8' ) ;

	lib = new Temple.Lib( {
		loadAsync: function( id ) {
			var promise = new Promise() ,
				depPath = path.join( templateDir , id ) ;

			if ( ! path.extname( depPath ) ) { depPath += '.tpl' ; }

			fs.readFile( depPath , 'utf8' , ( error , content ) => {
				if ( error ) { promise.reject( error ) ; }
				else { promise.resolve( content ) ; }
			} ) ;

			return promise ;
		}
	} ) ;

	template = Temple.parse( template , { lib: lib } ) ;
	await lib.loadDependenciesAsync() ;
	rendered = template.render( data ) ;

	if ( args.output ) {
		outputPath = path.isAbsolute( args.output ) ? args.output : path.join( process.cwd() , args.output ) ;
		fs.writeFileSync( outputPath , rendered ) ;
	}
	else {
		process.stdout.write( rendered ) ;
	}
} ;



commands['multi-render'] = async function( args ) {
	var argsData ,
		data , dataExt , dataPath , dataDir ,
		presets , presetsExt , presetsPath , presetsDir ,
		template , templatePath , templateDir ,
		lib , rendered , count ,
		outputBasePath , outputExt , outputPath ;

	argsData = Object.assign( {} , args ) ;
	delete argsData.data ;
	delete argsData.presets ;
	delete argsData.output ;

	/*
	if ( ! config.template ) {
		cliManager.displayHelp() ;
		return ;
	}
	*/

	if ( args.data ) {
		dataExt = path.extname( args.data ) ;
		dataPath = path.isAbsolute( args.data ) ? args.data : path.join( process.cwd() , args.data ) ;
		dataDir = path.dirname( dataPath ) ;
		data = dataExt === '.json' ? require( dataPath ) : require( 'kung-fig' ).load( dataPath ) ;

		if ( data.template && ! path.isAbsolute( data.template ) ) {
			data.template = path.join( dataDir , data.template ) ;
		}
	}
	else {
		data = {} ;
	}

	if ( args.presets ) {
		presetsExt = path.extname( args.presets ) ;
		presetsPath = path.isAbsolute( args.presets ) ? args.presets : path.join( process.cwd() , args.presets ) ;
		presetsDir = path.dirname( presetsPath ) ;
		presets = presetsExt === '.json' ? require( presetsPath ) : require( 'kung-fig' ).load( presetsPath ) ;
		data._ = presets ;
	}

	Object.assign( data , argsData ) ;
	//console.log( "Data:" , data ) ;

	if ( ! data.template ) {
		term.red( "Missing template.\n" ) ;
		cliManager.displayHelp() ;
		return ;
	}

	templatePath = path.isAbsolute( data.template ) ? data.template : path.join( process.cwd() , data.template ) ;
	templateDir = path.dirname( templatePath ) ;
	template = fs.readFileSync( templatePath , 'utf8' ) ;

	lib = new Temple.Lib( {
		loadAsync: function( id ) {
			var promise = new Promise() ,
				depPath = path.join( templateDir , id ) ;

			if ( ! path.extname( depPath ) ) { depPath += '.tpl' ; }

			fs.readFile( depPath , 'utf8' , ( error , content ) => {
				if ( error ) { promise.reject( error ) ; }
				else { promise.resolve( content ) ; }
			} ) ;

			return promise ;
		}
	} ) ;

	template = Temple.parse( template , { lib: lib } ) ;
	await lib.loadDependenciesAsync() ;

	count = 0 ;

	if ( args.output ) {
		outputPath = path.isAbsolute( args.output ) ? args.output : path.join( process.cwd() , args.output ) ;
		outputExt = path.extname( outputPath ) ;
		outputBasePath = path.join( path.dirname( outputPath ) , path.basename( outputPath , outputExt ) ) ;

		for ( rendered of template.multiRender( data ) ) {
			fs.writeFileSync( outputBasePath + '-' + ( ++ count ) + outputExt , rendered ) ;
		}
	}
	else {
		for ( rendered of template.multiRender( data ) ) {
			process.stdout.write( count ++ ? '\n' + rendered : rendered ) ;
		}
	}
} ;

