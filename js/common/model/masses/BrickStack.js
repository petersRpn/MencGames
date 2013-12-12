// Copyright 2002-2013, University of Colorado Boulder

/**
 * Class that represents a stack of bricks in the model.  Note that a single
 * brick is represented as a stack of size 1.
 *
 * @author John Blanco
 */

define( function( require ) {
  'use strict';

  // Imports
  var inherit = require( 'PHET_CORE/inherit' );
  var Shape = require( 'KITE/Shape' );
  var ShapeMass = require( 'BALANCING_ACT/common/model/ShapeMass' );
  var BASharedConstants = require( 'BALANCING_ACT/common/BASharedConstants' );
  var Vector2 = require( 'DOT/Vector2' );

  // Constants
  var BRICK_WIDTH = 0.2; // In meters.
  var BRICK_HEIGHT = BRICK_WIDTH / 3;
  var BRICK_MASS = 5; // In kg.

  /**
   * @param {number} numBricks
   * @param {Vector2} initialPosition
   * @constructor
   */
  function BrickStack( numBricks, initialPosition ) {

    // Generate the shape of the brick stack.
    var brickStackShape = new Shape();
    var brickOrigin = Vector2.ZERO;
    for ( var i = 0; i < numBricks; i++ ) {
      brickStackShape.moveTo( brickOrigin.x, brickOrigin.y );
      brickStackShape.lineTo( brickOrigin.x + BRICK_WIDTH / 2, brickOrigin.y );
      brickStackShape.lineTo( brickOrigin.x + BRICK_WIDTH / 2, brickOrigin.y + BRICK_HEIGHT );
      brickStackShape.lineTo( brickOrigin.x - BRICK_WIDTH / 2, brickOrigin.y + BRICK_HEIGHT );
      brickStackShape.lineTo( brickOrigin.x - BRICK_WIDTH / 2, brickOrigin.y );
      brickStackShape.lineTo( brickOrigin.x, brickOrigin.y );
      brickStackShape.close();
      // Move origin to the next brick.
      brickOrigin = new Vector2( brickOrigin.x, brickOrigin.y + BRICK_HEIGHT );
    }

    // Invoke superconstructor.
    ShapeMass.call( this, numBricks * BRICK_MASS, brickStackShape, initialPosition );
  }

  inherit( ShapeMass, BrickStack );

  // Public constants
  BrickStack.BRICK_MASS = BRICK_MASS;
  BrickStack.BRICK_HEIGHT = BRICK_HEIGHT;

  return BrickStack;
} );

