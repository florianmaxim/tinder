import * as THREE from 'three';
import * as OIMO from 'oimo';

import * as config from './config.json'
import {log} from './helpers'

import Picture from './components/ComponentPicture';

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

Math.degrees = function(radians) {
	return radians * 180 / Math.PI;
}

/**
 * @author mrdoob / http://mrdoob.com
 * @author stewdio / http://stewd.io
 */

THREE.ViveController = function ( id ) {

	THREE.Object3D.call( this );

	var scope = this;
	var gamepad;

	var axes = [ 0, 0 ];
	var thumbpadIsPressed = false;
	var triggerIsPressed = false;
	var gripsArePressed = false;
	var menuIsPressed = false;

	function findGamepad( id ) {

		// Iterate across gamepads as Vive Controllers may not be
		// in position 0 and 1.

		var gamepads = navigator.getGamepads && navigator.getGamepads();

		for ( var i = 0, j = 0; i < gamepads.length; i ++ ) {

			var gamepad = gamepads[ i ];

			if ( gamepad && ( gamepad.id === 'OpenVR Gamepad' || gamepad.id.startsWith( 'Oculus Touch' ) || gamepad.id.startsWith( 'Spatial Controller' ) ) ) {

				if ( j === id ) return gamepad;

				j ++;

			}

		}

	}

	this.matrixAutoUpdate = false;
	this.standingMatrix = new THREE.Matrix4();

	this.getGamepad = function () {

		return gamepad;

	};

	this.getButtonState = function ( button ) {

		if ( button === 'thumbpad' ) return thumbpadIsPressed;
		if ( button === 'trigger' ) return triggerIsPressed;
		if ( button === 'grips' ) return gripsArePressed;
		if ( button === 'menu' ) return menuIsPressed;

	};

	this.update = function () {

		gamepad = findGamepad( id );

		if ( gamepad !== undefined && gamepad.pose !== undefined ) {

			if ( gamepad.pose === null ) return; // No user action yet

			//  Position and orientation.

			var pose = gamepad.pose;

			if ( pose.position !== null ) scope.position.fromArray( pose.position );
			if ( pose.orientation !== null ) scope.quaternion.fromArray( pose.orientation );
			scope.matrix.compose( scope.position, scope.quaternion, scope.scale );
			scope.matrix.premultiply( scope.standingMatrix );	
			scope.matrixWorldNeedsUpdate = true;
			scope.visible = true;

			//  Thumbpad and Buttons.

			if ( axes[ 0 ] !== gamepad.axes[ 0 ] || axes[ 1 ] !== gamepad.axes[ 1 ] ) {

				axes[ 0 ] = gamepad.axes[ 0 ]; //  X axis: -1 = Left, +1 = Right.
				axes[ 1 ] = gamepad.axes[ 1 ]; //  Y axis: -1 = Bottom, +1 = Top.
				scope.dispatchEvent( { type: 'axischanged', axes: axes } );

			}

			if ( thumbpadIsPressed !== gamepad.buttons[ 0 ].pressed ) {

				thumbpadIsPressed = gamepad.buttons[ 0 ].pressed;
				scope.dispatchEvent( { type: thumbpadIsPressed ? 'thumbpaddown' : 'thumbpadup', axes: axes } );

			}

			if ( triggerIsPressed !== gamepad.buttons[ 1 ].pressed ) {

				triggerIsPressed = gamepad.buttons[ 1 ].pressed;
				scope.dispatchEvent( { type: triggerIsPressed ? 'triggerdown' : 'triggerup' } );

			}

			if ( gripsArePressed !== gamepad.buttons[ 2 ].pressed ) {

				gripsArePressed = gamepad.buttons[ 2 ].pressed;
				scope.dispatchEvent( { type: gripsArePressed ? 'gripsdown' : 'gripsup' } );

			}

			if ( menuIsPressed !== gamepad.buttons[ 3 ].pressed ) {

				menuIsPressed = gamepad.buttons[ 3 ].pressed;
				scope.dispatchEvent( { type: menuIsPressed ? 'menudown' : 'menuup' } );

			}

		} else {

			scope.visible = false;

		}

	};

};

THREE.ViveController.prototype = Object.create( THREE.Object3D.prototype );
THREE.ViveController.prototype.constructor = THREE.ViveController;


THREE.OBJLoader = ( function () {

	// o object_name | g group_name
	var object_pattern = /^[og]\s*(.+)?/;
	// mtllib file_reference
	var material_library_pattern = /^mtllib /;
	// usemtl material_name
	var material_use_pattern = /^usemtl /;

	function ParserState() {

		var state = {
			objects: [],
			object: {},

			vertices: [],
			normals: [],
			colors: [],
			uvs: [],

			materialLibraries: [],

			startObject: function ( name, fromDeclaration ) {

				// If the current object (initial from reset) is not from a g/o declaration in the parsed
				// file. We need to use it for the first parsed g/o to keep things in sync.
				if ( this.object && this.object.fromDeclaration === false ) {

					this.object.name = name;
					this.object.fromDeclaration = ( fromDeclaration !== false );
					return;

				}

				var previousMaterial = ( this.object && typeof this.object.currentMaterial === 'function' ? this.object.currentMaterial() : undefined );

				if ( this.object && typeof this.object._finalize === 'function' ) {

					this.object._finalize( true );

				}

				this.object = {
					name: name || '',
					fromDeclaration: ( fromDeclaration !== false ),

					geometry: {
						vertices: [],
						normals: [],
						colors: [],
						uvs: []
					},
					materials: [],
					smooth: true,

					startMaterial: function ( name, libraries ) {

						var previous = this._finalize( false );

						// New usemtl declaration overwrites an inherited material, except if faces were declared
						// after the material, then it must be preserved for proper MultiMaterial continuation.
						if ( previous && ( previous.inherited || previous.groupCount <= 0 ) ) {

							this.materials.splice( previous.index, 1 );

						}

						var material = {
							index: this.materials.length,
							name: name || '',
							mtllib: ( Array.isArray( libraries ) && libraries.length > 0 ? libraries[ libraries.length - 1 ] : '' ),
							smooth: ( previous !== undefined ? previous.smooth : this.smooth ),
							groupStart: ( previous !== undefined ? previous.groupEnd : 0 ),
							groupEnd: - 1,
							groupCount: - 1,
							inherited: false,

							clone: function ( index ) {

								var cloned = {
									index: ( typeof index === 'number' ? index : this.index ),
									name: this.name,
									mtllib: this.mtllib,
									smooth: this.smooth,
									groupStart: 0,
									groupEnd: - 1,
									groupCount: - 1,
									inherited: false
								};
								cloned.clone = this.clone.bind( cloned );
								return cloned;

							}
						};

						this.materials.push( material );

						return material;

					},

					currentMaterial: function () {

						if ( this.materials.length > 0 ) {

							return this.materials[ this.materials.length - 1 ];

						}

						return undefined;

					},

					_finalize: function ( end ) {

						var lastMultiMaterial = this.currentMaterial();
						if ( lastMultiMaterial && lastMultiMaterial.groupEnd === - 1 ) {

							lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3;
							lastMultiMaterial.groupCount = lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart;
							lastMultiMaterial.inherited = false;

						}

						// Ignore objects tail materials if no face declarations followed them before a new o/g started.
						if ( end && this.materials.length > 1 ) {

							for ( var mi = this.materials.length - 1; mi >= 0; mi -- ) {

								if ( this.materials[ mi ].groupCount <= 0 ) {

									this.materials.splice( mi, 1 );

								}

							}

						}

						// Guarantee at least one empty material, this makes the creation later more straight forward.
						if ( end && this.materials.length === 0 ) {

							this.materials.push( {
								name: '',
								smooth: this.smooth
							} );

						}

						return lastMultiMaterial;

					}
				};

				// Inherit previous objects material.
				// Spec tells us that a declared material must be set to all objects until a new material is declared.
				// If a usemtl declaration is encountered while this new object is being parsed, it will
				// overwrite the inherited material. Exception being that there was already face declarations
				// to the inherited material, then it will be preserved for proper MultiMaterial continuation.

				if ( previousMaterial && previousMaterial.name && typeof previousMaterial.clone === 'function' ) {

					var declared = previousMaterial.clone( 0 );
					declared.inherited = true;
					this.object.materials.push( declared );

				}

				this.objects.push( this.object );

			},

			finalize: function () {

				if ( this.object && typeof this.object._finalize === 'function' ) {

					this.object._finalize( true );

				}

			},

			parseVertexIndex: function ( value, len ) {

				var index = parseInt( value, 10 );
				return ( index >= 0 ? index - 1 : index + len / 3 ) * 3;

			},

			parseNormalIndex: function ( value, len ) {

				var index = parseInt( value, 10 );
				return ( index >= 0 ? index - 1 : index + len / 3 ) * 3;

			},

			parseUVIndex: function ( value, len ) {

				var index = parseInt( value, 10 );
				return ( index >= 0 ? index - 1 : index + len / 2 ) * 2;

			},

			addVertex: function ( a, b, c ) {

				var src = this.vertices;
				var dst = this.object.geometry.vertices;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );

			},

			addVertexPoint: function ( a ) {

				var src = this.vertices;
				var dst = this.object.geometry.vertices;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );

			},

			addVertexLine: function ( a ) {

				var src = this.vertices;
				var dst = this.object.geometry.vertices;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );

			},

			addNormal: function ( a, b, c ) {

				var src = this.normals;
				var dst = this.object.geometry.normals;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );

			},

			addColor: function ( a, b, c ) {

				var src = this.colors;
				var dst = this.object.geometry.colors;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );

			},

			addUV: function ( a, b, c ) {

				var src = this.uvs;
				var dst = this.object.geometry.uvs;

				dst.push( src[ a + 0 ], src[ a + 1 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ] );

			},

			addUVLine: function ( a ) {

				var src = this.uvs;
				var dst = this.object.geometry.uvs;

				dst.push( src[ a + 0 ], src[ a + 1 ] );

			},

			addFace: function ( a, b, c, ua, ub, uc, na, nb, nc ) {

				var vLen = this.vertices.length;

				var ia = this.parseVertexIndex( a, vLen );
				var ib = this.parseVertexIndex( b, vLen );
				var ic = this.parseVertexIndex( c, vLen );

				this.addVertex( ia, ib, ic );

				if ( ua !== undefined && ua !== '' ) {

					var uvLen = this.uvs.length;
					ia = this.parseUVIndex( ua, uvLen );
					ib = this.parseUVIndex( ub, uvLen );
					ic = this.parseUVIndex( uc, uvLen );
					this.addUV( ia, ib, ic );

				}

				if ( na !== undefined && na !== '' ) {

					// Normals are many times the same. If so, skip function call and parseInt.
					var nLen = this.normals.length;
					ia = this.parseNormalIndex( na, nLen );

					ib = na === nb ? ia : this.parseNormalIndex( nb, nLen );
					ic = na === nc ? ia : this.parseNormalIndex( nc, nLen );

					this.addNormal( ia, ib, ic );

				}

				if ( this.colors.length > 0 ) {

					this.addColor( ia, ib, ic );

				}

			},

			addPointGeometry: function ( vertices ) {

				this.object.geometry.type = 'Points';

				var vLen = this.vertices.length;

				for ( var vi = 0, l = vertices.length; vi < l; vi ++ ) {

					this.addVertexPoint( this.parseVertexIndex( vertices[ vi ], vLen ) );

				}

			},

			addLineGeometry: function ( vertices, uvs ) {

				this.object.geometry.type = 'Line';

				var vLen = this.vertices.length;
				var uvLen = this.uvs.length;

				for ( var vi = 0, l = vertices.length; vi < l; vi ++ ) {

					this.addVertexLine( this.parseVertexIndex( vertices[ vi ], vLen ) );

				}

				for ( var uvi = 0, l = uvs.length; uvi < l; uvi ++ ) {

					this.addUVLine( this.parseUVIndex( uvs[ uvi ], uvLen ) );

				}

			}

		};

		state.startObject( '', false );

		return state;

	}

	//

	function OBJLoader( manager ) {

		this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

		this.materials = null;

	}

	OBJLoader.prototype = {

		constructor: OBJLoader,

		load: function ( url, onLoad, onProgress, onError ) {

			var scope = this;

			var loader = new THREE.FileLoader( scope.manager );
			loader.setPath( this.path );
			loader.load( url, function ( text ) {

				onLoad( scope.parse( text ) );

			}, onProgress, onError );

		},

		setPath: function ( value ) {

			this.path = value;

			return this;

		},

		setMaterials: function ( materials ) {

			this.materials = materials;

			return this;

		},

		parse: function ( text ) {

			console.time( 'OBJLoader' );

			var state = new ParserState();

			if ( text.indexOf( '\r\n' ) !== - 1 ) {

				// This is faster than String.split with regex that splits on both
				text = text.replace( /\r\n/g, '\n' );

			}

			if ( text.indexOf( '\\\n' ) !== - 1 ) {

				// join lines separated by a line continuation character (\)
				text = text.replace( /\\\n/g, '' );

			}

			var lines = text.split( '\n' );
			var line = '', lineFirstChar = '';
			var lineLength = 0;
			var result = [];

			// Faster to just trim left side of the line. Use if available.
			var trimLeft = ( typeof ''.trimLeft === 'function' );

			for ( var i = 0, l = lines.length; i < l; i ++ ) {

				line = lines[ i ];

				line = trimLeft ? line.trimLeft() : line.trim();

				lineLength = line.length;

				if ( lineLength === 0 ) continue;

				lineFirstChar = line.charAt( 0 );

				// @todo invoke passed in handler if any
				if ( lineFirstChar === '#' ) continue;

				if ( lineFirstChar === 'v' ) {

					var data = line.split( /\s+/ );

					switch ( data[ 0 ] ) {

						case 'v':
							state.vertices.push(
								parseFloat( data[ 1 ] ),
								parseFloat( data[ 2 ] ),
								parseFloat( data[ 3 ] )
							);
							if ( data.length === 8 ) {

								state.colors.push(
									parseFloat( data[ 4 ] ),
									parseFloat( data[ 5 ] ),
									parseFloat( data[ 6 ] )

								);

							}
							break;
						case 'vn':
							state.normals.push(
								parseFloat( data[ 1 ] ),
								parseFloat( data[ 2 ] ),
								parseFloat( data[ 3 ] )
							);
							break;
						case 'vt':
							state.uvs.push(
								parseFloat( data[ 1 ] ),
								parseFloat( data[ 2 ] )
							);
							break;

					}

				} else if ( lineFirstChar === 'f' ) {

					var lineData = line.substr( 1 ).trim();
					var vertexData = lineData.split( /\s+/ );
					var faceVertices = [];

					// Parse the face vertex data into an easy to work with format

					for ( var j = 0, jl = vertexData.length; j < jl; j ++ ) {

						var vertex = vertexData[ j ];

						if ( vertex.length > 0 ) {

							var vertexParts = vertex.split( '/' );
							faceVertices.push( vertexParts );

						}

					}

					// Draw an edge between the first vertex and all subsequent vertices to form an n-gon

					var v1 = faceVertices[ 0 ];

					for ( var j = 1, jl = faceVertices.length - 1; j < jl; j ++ ) {

						var v2 = faceVertices[ j ];
						var v3 = faceVertices[ j + 1 ];

						state.addFace(
							v1[ 0 ], v2[ 0 ], v3[ 0 ],
							v1[ 1 ], v2[ 1 ], v3[ 1 ],
							v1[ 2 ], v2[ 2 ], v3[ 2 ]
						);

					}

				} else if ( lineFirstChar === 'l' ) {

					var lineParts = line.substring( 1 ).trim().split( " " );
					var lineVertices = [], lineUVs = [];

					if ( line.indexOf( "/" ) === - 1 ) {

						lineVertices = lineParts;

					} else {

						for ( var li = 0, llen = lineParts.length; li < llen; li ++ ) {

							var parts = lineParts[ li ].split( "/" );

							if ( parts[ 0 ] !== "" ) lineVertices.push( parts[ 0 ] );
							if ( parts[ 1 ] !== "" ) lineUVs.push( parts[ 1 ] );

						}

					}
					state.addLineGeometry( lineVertices, lineUVs );

				} else if ( lineFirstChar === 'p' ) {

					var lineData = line.substr( 1 ).trim();
					var pointData = lineData.split( " " );

					state.addPointGeometry( pointData );

				} else if ( ( result = object_pattern.exec( line ) ) !== null ) {

					// o object_name
					// or
					// g group_name

					// WORKAROUND: https://bugs.chromium.org/p/v8/issues/detail?id=2869
					// var name = result[ 0 ].substr( 1 ).trim();
					var name = ( " " + result[ 0 ].substr( 1 ).trim() ).substr( 1 );

					state.startObject( name );

				} else if ( material_use_pattern.test( line ) ) {

					// material

					state.object.startMaterial( line.substring( 7 ).trim(), state.materialLibraries );

				} else if ( material_library_pattern.test( line ) ) {

					// mtl file

					state.materialLibraries.push( line.substring( 7 ).trim() );

				} else if ( lineFirstChar === 's' ) {

					result = line.split( ' ' );

					// smooth shading

					// @todo Handle files that have varying smooth values for a set of faces inside one geometry,
					// but does not define a usemtl for each face set.
					// This should be detected and a dummy material created (later MultiMaterial and geometry groups).
					// This requires some care to not create extra material on each smooth value for "normal" obj files.
					// where explicit usemtl defines geometry groups.
					// Example asset: examples/models/obj/cerberus/Cerberus.obj

					/*
					 * http://paulbourke.net/dataformats/obj/
					 * or
					 * http://www.cs.utah.edu/~boulos/cs3505/obj_spec.pdf
					 *
					 * From chapter "Grouping" Syntax explanation "s group_number":
					 * "group_number is the smoothing group number. To turn off smoothing groups, use a value of 0 or off.
					 * Polygonal elements use group numbers to put elements in different smoothing groups. For free-form
					 * surfaces, smoothing groups are either turned on or off; there is no difference between values greater
					 * than 0."
					 */
					if ( result.length > 1 ) {

						var value = result[ 1 ].trim().toLowerCase();
						state.object.smooth = ( value !== '0' && value !== 'off' );

					} else {

						// ZBrush can produce "s" lines #11707
						state.object.smooth = true;

					}
					var material = state.object.currentMaterial();
					if ( material ) material.smooth = state.object.smooth;

				} else {

					// Handle null terminated files without exception
					if ( line === '\0' ) continue;

					throw new Error( 'THREE.OBJLoader: Unexpected line: "' + line + '"' );

				}

			}

			state.finalize();

			var container = new THREE.Group();
			container.materialLibraries = [].concat( state.materialLibraries );

			for ( var i = 0, l = state.objects.length; i < l; i ++ ) {

				var object = state.objects[ i ];
				var geometry = object.geometry;
				var materials = object.materials;
				var isLine = ( geometry.type === 'Line' );
				var isPoints = ( geometry.type === 'Points' );
				var hasVertexColors = false;

				// Skip o/g line declarations that did not follow with any faces
				if ( geometry.vertices.length === 0 ) continue;

				var buffergeometry = new THREE.BufferGeometry();

				buffergeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( geometry.vertices, 3 ) );

				if ( geometry.normals.length > 0 ) {

					buffergeometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( geometry.normals, 3 ) );

				} else {

					buffergeometry.computeVertexNormals();

				}

				if ( geometry.colors.length > 0 ) {

					hasVertexColors = true;
					buffergeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( geometry.colors, 3 ) );

				}

				if ( geometry.uvs.length > 0 ) {

					buffergeometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( geometry.uvs, 2 ) );

				}

				// Create materials

				var createdMaterials = [];

				for ( var mi = 0, miLen = materials.length; mi < miLen; mi ++ ) {

					var sourceMaterial = materials[ mi ];
					var material = undefined;

					if ( this.materials !== null ) {

						material = this.materials.create( sourceMaterial.name );

						// mtl etc. loaders probably can't create line materials correctly, copy properties to a line material.
						if ( isLine && material && ! ( material instanceof THREE.LineBasicMaterial ) ) {

							var materialLine = new THREE.LineBasicMaterial();
							materialLine.copy( material );
							materialLine.lights = false; // TOFIX
							material = materialLine;

						} else if ( isPoints && material && ! ( material instanceof THREE.PointsMaterial ) ) {

							var materialPoints = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false } );
							materialLine.copy( material );
							material = materialPoints;

						}

					}

					if ( ! material ) {

						if ( isLine ) {

							material = new THREE.LineBasicMaterial();

						} else if ( isPoints ) {

							material = new THREE.PointsMaterial( { size: 1, sizeAttenuation: false } );

						} else {

							material = new THREE.MeshPhongMaterial();

						}

						material.name = sourceMaterial.name;

					}

					material.flatShading = sourceMaterial.smooth ? false : true;
					material.vertexColors = hasVertexColors ? THREE.VertexColors : THREE.NoColors;

					createdMaterials.push( material );

				}

				// Create mesh

				var mesh;

				if ( createdMaterials.length > 1 ) {

					for ( var mi = 0, miLen = materials.length; mi < miLen; mi ++ ) {

						var sourceMaterial = materials[ mi ];
						buffergeometry.addGroup( sourceMaterial.groupStart, sourceMaterial.groupCount, mi );

					}

					if ( isLine ) {

						mesh = new THREE.LineSegments( buffergeometry, createdMaterials );

					} else if ( isPoints ) {

						mesh = new THREE.Points( buffergeometry, createdMaterials );

					} else {

						mesh = new THREE.Mesh( buffergeometry, createdMaterials );

					}

				} else {

					if ( isLine ) {

						mesh = new THREE.LineSegments( buffergeometry, createdMaterials[ 0 ] );

					} else if ( isPoints ) {

						mesh = new THREE.Points( buffergeometry, createdMaterials[ 0 ] );

					} else {

						mesh = new THREE.Mesh( buffergeometry, createdMaterials[ 0 ] );

					}

				}

				mesh.name = object.name;

				container.add( mesh );

			}

			console.timeEnd( 'OBJLoader' );

			return container;

		}

	};

	return OBJLoader;

} )();

var WEBVR = {

	createButton: function ( renderer, options ) {

		function showEnterVR( device ) {

			button.style.display = '';

			button.style.cursor = 'pointer';
			button.style.left = 'calc(50% - 150px)';
			button.style.width = '100px';

			button.textContent = 'ENTER VR';

			button.onmouseenter = function () { button.style.opacity = '1.0'; };
			button.onmouseleave = function () { button.style.opacity = '0.5'; };

			button.onclick = function () {

				device.isPresenting ? device.exitPresent() : device.requestPresent( [ { source: renderer.domElement } ] );

			};

			renderer.vr.setDevice( device );

		}

		function showEnterXR( device ) {

			var currentSession = null;

			function onSessionStarted( session ) {

				if ( options === undefined ) options = {};
				if ( options.frameOfReferenceType === undefined ) options.frameOfReferenceType = 'stage';

				session.addEventListener( 'end', onSessionEnded );

				renderer.vr.setSession( session, options );
				button.textContent = 'EXIT XR';

				currentSession = session;

			}

			function onSessionEnded( event ) {

				currentSession.removeEventListener( 'end', onSessionEnded );

				renderer.vr.setSession( null );
				button.textContent = 'ENTER XR';

				currentSession = null;

			}

			//

			button.style.display = '';

			button.style.cursor = 'pointer';
			button.style.left = 'calc(50% - 50px)';
			button.style.width = '100px';

			button.textContent = 'ENTER XR';

			button.onmouseenter = function () { button.style.opacity = '1.0'; };
			button.onmouseleave = function () { button.style.opacity = '0.5'; };

			button.onclick = function () {

				if ( currentSession === null ) {

					device.requestSession( { exclusive: true } ).then( onSessionStarted );

				} else {

					currentSession.end();

				}

			};

			renderer.vr.setDevice( device );

		}

		function showVRNotFound() {

			button.style.display = '';

			button.style.cursor = 'auto';
			button.style.left = 'calc(50% - 75px)';
			button.style.width = '150px';

			button.textContent = 'VR NOT FOUND';

			button.onmouseenter = null;
			button.onmouseleave = null;

			button.onclick = null;

			renderer.vr.setDevice( null );

		}

		function stylizeElement( element ) {

			element.style.position = 'absolute';
			element.style.bottom = '20px';
			element.style.padding = '12px 6px';
			element.style.border = '1px solid #fff';
			element.style.borderRadius = '4px';
			element.style.background = 'black';
			element.style.color = '#fff';
			element.style.font = 'normal 13px sans-serif';
			element.style.textAlign = 'center';
			element.style.opacity = '0.5';
			element.style.outline = 'none';
			element.style.zIndex = '999';

		}

		var isWebXR = false;

		if ( 'xr' in navigator ) {

			isWebXR = true;

			var button = document.createElement( 'button' );
			button.style.display = 'none';

			stylizeElement( button );

			navigator.xr.requestDevice().then( function ( device ) {

				device.supportsSession( { exclusive: true } ).then( function () {

					showEnterXR( device );

				} ).catch( showVRNotFound );

			} ).catch( showVRNotFound );

			return button;

		} else if ( 'getVRDisplays' in navigator ) {

			var button = document.createElement( 'button' );
			button.style.display = 'none';

			stylizeElement( button );

			window.addEventListener( 'vrdisplayconnect', function ( event ) {

				showEnterVR( event.display );

			}, false );

			window.addEventListener( 'vrdisplaydisconnect', function ( event ) {

				showVRNotFound();

			}, false );

			window.addEventListener( 'vrdisplaypresentchange', function ( event ) {

				button.textContent = event.display.isPresenting ? 'EXIT VR' : 'ENTER VR';

			}, false );

			window.addEventListener( 'vrdisplayactivate', function ( event ) {

				event.display.requestPresent( [ { source: renderer.domElement } ] );

			}, false );

			navigator.getVRDisplays()
				.then( function ( displays ) {

					if ( displays.length > 0 ) {

						showEnterVR( displays[ 0 ] );

					} else {

						showVRNotFound();

					}

				} );

			return button;

		} else {

			var message = document.createElement( 'a' );
			message.href = 'https://webvr.info';
			message.innerHTML = 'WEBVR NOT SUPPORTED';

			message.style.left = 'calc(50% - 90px)';
			message.style.width = '180px';
			message.style.textDecoration = 'none';

			stylizeElement( message );

			return message;

		}

	},

	// DEPRECATED

	checkAvailability: function () {
		console.warn( 'WEBVR.checkAvailability has been deprecated.' );
		return new Promise( function () {} );
	},

	getMessageContainer: function () {
		console.warn( 'WEBVR.getMessageContainer has been deprecated.' );
		return document.createElement( 'div' );
	},

	getButton: function () {
		console.warn( 'WEBVR.getButton has been deprecated.' );
		return document.createElement( 'div' );
	},

	getVRDisplay: function () {
		console.warn( 'WEBVR.getVRDisplay has been deprecated.' );
	}

};

var container;

var camera, scene, renderer;
var controller1, controller2;

var raycaster, intersected = [];
var tempMatrix = new THREE.Matrix4();

let picturesMeshes;

let pictures = [];
let picturesGrabbed = [];

let world;
let bodies = [];

let intersectedPicture;

let pause = false

let triggerDown = false
let selectedMesh = undefined

init();
animate();

function fetchRecommendations() {

	log('fetch recs')

	if(config.simulation){

			const size = {
				x: 1,
				y: 1.7,
				z: .1
			}

			const position = {
				x: randomIntFromInterval(-.5,.5),
				y: randomIntFromInterval(5, 10),
				z: randomIntFromInterval(-.5,.5)
			}

			const rotation = {
				x:Math.random() * 2 * Math.PI,
				y:Math.random() * 2 * Math.PI,
				z:Math.random() * 2 * Math.PI
			}

			const factor = config.picture.fixedScale!==false?config.picture.fixedScale:Math.random()
			const scale = {
				x:factor,
				y:factor,
				z:factor
			}

			//Add Picture
			const picture = new Picture({

				size: size,

				position: position,
				rotation: rotation,
				scale: scale,

				containerWireframe: config.picture.containerWireframe,
				containerOpacity: config.picture.containerOpacity,
				containerColor: 0xff0000,
				
				images: ['models/textures/me.jpg']

			})

			pictures.push(picture)
			picture.getMesh().userData._index = pictures.indexOf(picture)
			picturesMeshes.add(picture.getMesh())

			var body = world.add({ 
				type:'box', // type of shape : sphere, box, cylinder 
				size:[size.x*scale.x,size.y*scale.y,size.z*scale.z], // size of shape
				pos:[position.x,position.y,position.z], // start position in degree
				rot:[0,0,0], // start rotation in degree
				move:true, // dynamic or statique
				density: 1,
				friction: .5,
				restitution: 0.2,
				belongsTo: 1, // The bits of the collision groups to which the shape belongs.
				collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
			});

			bodies.push(body)
		return
	}
	
	fetch(`${config.API.BASE_URL}/recs/${config.API.TOKEN}`)
	.then((response) => response.json())
	.then((response) => {

		log(response)

		let count = 0;
		response.results.forEach(element => {

			if(count>=config.fetch.ItemsPerCall) return

			count++;

			const id = element._id

			let imageURLs = []

			//Collect image urls
			element.photos.forEach(element => {

				const photoId = element.id
				const dimensions = `640x640`;
				const url = `${config.API.BASE_URL}/image/crop/${id}/${dimensions}_${photoId}`

				imageURLs.push(url)

				log(url)

			})

			const size = {
				x: 1,
				y: 1.7,
				z: .1
			}

			const position = {
				x: randomIntFromInterval(-.5,.5),
				y: randomIntFromInterval(5, 10),
				z: randomIntFromInterval(-.5,.5)
			}

			const rotation = {
				x:Math.random() * 2 * Math.PI,
				y:Math.random() * 2 * Math.PI,
				z:Math.random() * 2 * Math.PI
			}

			const factor = config.picture.fixedScale!==false?config.picture.fixedScale:Math.random()
			const scale = {
				x:factor,
				y:factor,
				z:factor
			}

			//Add Picture
			const picture = new Picture({

				size: size,

				position: position,
				rotation: rotation,
				scale: scale,

				containerWireframe: config.picture.containerWireframe,
				containerOpacity: config.picture.containerOpacity,
				containerColor: 0xff0000,
				
				images: imageURLs

			})

			pictures.push(picture)
			picture.getMesh().userData._index = pictures.indexOf(picture)
			picturesMeshes.add(picture.getMesh())

			var body = world.add({ 
				type:'box', // type of shape : sphere, box, cylinder 
				size:[size.x*scale.x,size.y*scale.y,size.z*scale.z], // size of shape
				pos:[position.x,position.y,position.z], // start position in degree
				rot:[0,0,0], // start rotation in degree
				move:true, // dynamic or statique
				density: 1,
				friction: .5,
				restitution: 0.2,
				belongsTo: 1, // The bits of the collision groups to which the shape belongs.
				collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
			});

			bodies.push(body)

		});

	});
}

function init() {

	//Physics
	world = new OIMO.World({ 
		timestep: 1/60, 
		iterations: 8, 
		broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
		worldscale: 1, // scale full world 
		random: true,  // randomize sample
		info: false,   // calculate statistic or not
		gravity: [0,config.world.gravity.y,0] 
	});

	document.body.style.margin = '0';

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	var info = document.createElement( 'div' );
	info.style.position = 'absolute';
	info.style.top = '10px';
	info.style.width = '100%';
	info.style.textAlign = 'center';
	container.appendChild( info );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xFFFFFF );

	scene.fog = new THREE.Fog(0xffffff, 0, config.fog.far)

	if(config.space.grid){
		var size = 1000;
		var divisions = 1000;
		scene.add(new THREE.GridHelper( size, divisions ));
	}

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10 );

	var geometry = new THREE.PlaneGeometry( 10000, 10000 );
	var material = new THREE.MeshStandardMaterial( {
		//color: 0x0000ff,		
		color: 0xa0a0a0,
		roughness: 1.0,
		metalness: 0.0,
		transparent: true,
		opacity: config.ground.opacity,
		side: THREE.DoubleSide
	} );
	var floor = new THREE.Mesh( geometry, material );
	floor.rotation.x =  Math.PI / 2;
	floor.receiveShadow = true;
	scene.add( floor );

	var body = { 
		type:'box', // type of shape : sphere, box, cylinder 
		size:[1000, 0.0001,1000], // size of shape
		pos: [0,0,0], // start position in degree
		rot: [0,0,0], // start rotation in degree
		move:false, // dynamic or statique
		density: 1,
		friction: 1,
		restitution: 1,
		belongsTo: 1, // The bits of the collision groups to which the shape belongs.
		collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
	}

	if(config.ground.body)
	world.add(body);

	//scene.add( new THREE.AmbientLight( 0xffffff) );

	var light = new THREE.HemisphereLight( 0x808080, 0x606060, 1 )
	scene.add( light );

	var light = new THREE.DirectionalLight( 0xffffff, 5 );
	light.castShadow = true;

	light.position.set( 2, 5, 0 );
	//light.shadow.camera.top = 2;
	//light.shadow.camera.bottom = -2;
	//light.shadow.camera.right = 2;
	//light.shadow.camera.left = -2;
	light.shadow.mapSize.set( 4096, 4096 );
	scene.add( light );

	picturesMeshes = new THREE.Group();
	scene.add( picturesMeshes );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.shadowMap.enabled = true;
	renderer.vr.enabled = true;
	
	container.appendChild( renderer.domElement );

	document.body.appendChild( WEBVR.createButton( renderer ) );

	// controllers

	controller1 = new THREE.ViveController( 0 );
	controller1.standingMatrix = renderer.vr.getStandingMatrix();
	controller1.addEventListener( 'triggerdown', onTriggerDown );
	controller1.addEventListener( 'triggerup', onTriggerUp );
	scene.add( controller1 );

	controller2 = new THREE.ViveController( 1 );
	controller2.standingMatrix = renderer.vr.getStandingMatrix();
	//controller2.addEventListener( 'triggerdown', onTriggerDown2 );
	//controller2.addEventListener( 'triggerup', onTriggerUp2 );
	scene.add( controller2 );

	var loader = new THREE.OBJLoader();
	loader.setPath( 'models/obj/vive-controller/' );
	loader.load( 'vr_controller_vive_1_5.obj', function ( object ) {

		var loader = new THREE.TextureLoader();
		loader.setPath( 'models/obj/vive-controller/' );

		var controller = object.children[ 0 ];
		controller.material.map = loader.load( 'onepointfive_texture.png' );
		controller.material.specularMap = loader.load( 'onepointfive_spec.png' );

		controller1.add( object.clone() );
		controller2.add( object.clone() );

	} );

	//Lines

	var geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

	var line = new THREE.Line( geometry );
	line.name = 'line';
	line.scale.z = 5;

	controller1.add( line.clone() );
	controller2.add( line.clone() );

	raycaster = new THREE.Raycaster();


	if(config.fetch.interval!==false)
	setInterval(() => {
		fetchRecommendations();
	}, config.fetch.interval)

	fetchRecommendations();

	window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function onTriggerDown( event ) {

	triggerDown = true

	var controller = event.target;

	var intersections = getIntersectionsOfController( controller );

	if ( intersections.length > 0 ) {

		var intersection = intersections[ 0 ];

		tempMatrix.getInverse( controller.matrixWorld );

		var object = intersection.object;
		object.matrix.premultiply( tempMatrix );
		object.matrix.decompose( object.position, object.quaternion, object.scale );
		
		object.material.emissive.b = 1;

		//Apply selected object to controller
		controller.add( object );

		controller.userData.selected = object;

	}

}

function onTriggerUp( event ) {

	triggerDown = false

	var controller = event.target;

	if ( controller.userData.selected !== undefined ) {

		var object = controller.userData.selected;
		object.matrix.premultiply( controller.matrixWorld );
		object.matrix.decompose( object.position, object.quaternion, object.scale );
		
		object.material.emissive.b = 0;

		//Apply previously selected object back to the meshes group 
		//that is influenced by its rigid bodies
		picturesMeshes.add( object );

		//Update it's rigid bodies
		bodies[ object.userData._index ].resetPosition(object.position.x, object.position.y, object.position.z)
		bodies[ object.userData._index ].resetQuaternion(object.quaternion)

		controller.userData.selected = undefined;

	}

}

function getIntersectionsOfController( controller ) {

	tempMatrix.identity().extractRotation( controller.matrixWorld );

	raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
	raycaster.ray.direction.set( 0, 0, -1 ).applyMatrix4( tempMatrix );

	return raycaster.intersectObjects( picturesMeshes.children );

}

function intersectObjects( controller ) {

	// Do not highlight when already selected
	if ( controller.userData.selected !== undefined ) return;

	var line = controller.getObjectByName( 'line' );
	var intersections = getIntersectionsOfController( controller );

	if ( intersections.length > 0 ) {

		var intersection = intersections[ 0 ];
		var object = intersection.object;

		//object.material.color.setHex(0xff0000)

		intersected.push( object );

		line.scale.z = intersection.distance;

		object.userData.intersected = true;

	} else {

		line.scale.z = 5;

	}

}

function cleanIntersected() {

	while ( intersected.length ) {

		var object = intersected.pop();

		//object.material.color.setHex(0xffffff)

		object.userData.intersected = false;

	}

}

//

function animate() {

	renderer.setAnimationLoop( render );

}

function render() {

	controller1.update();
	controller2.update();

	intersectObjects( controller1 );
	intersectObjects( controller2 );

	cleanIntersected();

	world.step();

	pictures.map((picture, index) => {
		
		const pictureMesh = picture.getMesh()

		if(controller1.userData.selected == pictureMesh) return

		pictureMesh.position.copy( bodies[ index ].getPosition() );
		pictureMesh.quaternion.copy( bodies[ index ].getQuaternion() );

	})

	renderer.render( scene, camera );

}