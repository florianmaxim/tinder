/**
 * @author mrdoob / http://mrdoob.com
 * @author stewdio / http://stewd.io
 */

import * as THREE from 'three';

let scope

var gamepad;
    
var axes = [ 0, 0 ];
var thumbpadIsPressed = false;
var triggerIsPressed = false;
var gripsArePressed = false;
var menuIsPressed = false;

export default class ViveController extends THREE.Object3D {

    constructor( id ){

        super( id )

        //THREE.Object3D.call( this );

        this._id = id;

        scope = this;

        this.matrixAutoUpdate = false;
        this.standingMatrix = new THREE.Matrix4();

    }

	findGamepad( id ) {

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

	getGamepad() {

		return gamepad;

	};

	getButtonState( button ) {

		if ( button === 'thumbpad' ) return thumbpadIsPressed;
		if ( button === 'trigger' ) return triggerIsPressed;
		if ( button === 'grips' ) return gripsArePressed;
		if ( button === 'menu' ) return menuIsPressed;

	};

	update() {

		this.gamepad = this.findGamepad( this._id );

		if ( this.gamepad !== undefined && this.gamepad.pose !== undefined ) {

			if ( this.gamepad.pose === null ) return; // No user action yet

			//  Position and orientation.

			var pose = this.gamepad.pose;

			if ( pose.position !== null ) scope.position.fromArray( pose.position );
			if ( pose.orientation !== null ) scope.quaternion.fromArray( pose.orientation );
			scope.matrix.compose( scope.position, scope.quaternion, scope.scale );
			scope.matrix.premultiply( scope.standingMatrix );	
			scope.matrixWorldNeedsUpdate = true;
			scope.visible = true;

			//  Thumbpad and Buttons.

			if ( axes[ 0 ] !== this.gamepad.axes[ 0 ] || axes[ 1 ] !== this.gamepad.axes[ 1 ] ) {

				axes[ 0 ] = this.gamepad.axes[ 0 ]; //  X axis: -1 = Left, +1 = Right.
				axes[ 1 ] = this.gamepad.axes[ 1 ]; //  Y axis: -1 = Bottom, +1 = Top.
				scope.dispatchEvent( { type: 'axischanged', axes: axes } );

			}

			if ( thumbpadIsPressed !== gamepad.buttons[ 0 ].pressed ) {

				thumbpadIsPressed = this.gamepad.buttons[ 0 ].pressed;
				scope.dispatchEvent( { type: thumbpadIsPressed ? 'thumbpaddown' : 'thumbpadup', axes: axes } );

			}

			if ( triggerIsPressed !== this.gamepad.buttons[ 1 ].pressed ) {

				triggerIsPressed = this.gamepad.buttons[ 1 ].pressed;
				scope.dispatchEvent( { type: triggerIsPressed ? 'triggerdown' : 'triggerup' } );

			}

			if ( gripsArePressed !== this.gamepad.buttons[ 2 ].pressed ) {

				gripsArePressed = this.gamepad.buttons[ 2 ].pressed;
				scope.dispatchEvent( { type: gripsArePressed ? 'gripsdown' : 'gripsup' } );

			}

			if ( menuIsPressed !== this.gamepad.buttons[ 3 ].pressed ) {

				menuIsPressed = this.gamepad.buttons[ 3 ].pressed;
				scope.dispatchEvent( { type: menuIsPressed ? 'menudown' : 'menuup' } );

			}

		} else {

			scope.visible = false;

		}

	};

};