// Copyright 2002-2013, University of Colorado Boulder

/**
 * A marker that is used to mark a position on the plank.
 */
define( function( require ) {
  'use strict';

  // Imports
  var Circle = require( 'SCENERY/nodes/Circle' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Line = require( 'SCENERY/nodes/Line' );
  var Node = require( 'SCENERY/nodes/Node' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var Text = require( 'SCENERY/nodes/Text' );

  // Constants
  var color = 'rgb( 255, 153, 0 )';
  var LINE_LENGTH = 15; // empirically chosen
  var CIRCLE_RADIUS = 3; // empirically chosen

  function PositionMarkerNode( labelText, options ) {
    Node.call( this );
    var line = new Line( 0, 0, 0, LINE_LENGTH, { stroke: color, lineWidth: 2, lineDash: [ 2, 3 ] } );
    this.addChild( line );
    var circle = new Circle( CIRCLE_RADIUS, { fill: color, centerX: 0, centerY: LINE_LENGTH} );
    this.addChild( circle );
    this.addChild( new Text( labelText, { font: new PhetFont( {size: 12, weight: 'bold'} ), centerX: 0, top: circle.bottom + 1 } ) );
    this.mutate( options );
  }

  return inherit( Node, PositionMarkerNode );
} );
