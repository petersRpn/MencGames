// Copyright 2002-2013, University of Colorado Boulder

/**
 * A node that represents a mass that is described by a particular shape (as
 * opposed to an image) in the view.
 *
 * @author John Blanco
 */
define( function( require ) {
  'use strict';

  // Imports
  var inherit = require( 'PHET_CORE/inherit' );
  var kgString = require( 'string!BALANCING_ACT/kg' );
  var MassDragHandler = require( 'BALANCING_ACT/common/view/MassDragHandler' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Path = require( 'SCENERY/nodes/Path' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );
  var Text = require( 'SCENERY/nodes/Text' );
  var unknownMassString = require( 'string!BALANCING_ACT/unknownMassLabel' );
  var Vector2 = require( 'DOT/Vector2' );

  /**
   * @param {Mass} mass
   * @param {ModelViewTransform2} mvt
   * @param {color} fillColor
   * @param {boolean} isLabeled
   * @param {Property} labelVisibleProperty
   * @param {boolean} draggable
   * @constructor
   */
  function ShapeMassNode( mass, mvt, fillColor, isLabeled, labelVisibleProperty, draggable ) {
    Node.call( this, { cursor: 'pointer' } );
    var thisNode = this;
    thisNode.mass = mass;
    thisNode.mvt = mvt;

    // Create and add the main shape node.
    var shapeNode = new Path( mvt.modelToViewShape( mass.shapeProperty.value ), { fill: fillColor, stroke: 'black', lineWidth: 1 } );
    thisNode.addChild( shapeNode );

    // Create and add the mass label.
    if ( isLabeled ) {
      var massLabel;
      if ( mass.isMystery ) {
        massLabel = new Text( unknownMassString, { font: new PhetFont( 12 ) } );
      }
      else {
        // NOTE: The MultiLineText node was tried for this, but the spacing looked bad.
        massLabel = new Node();
        var massValueText = new Text( mass.massValue, { font: new PhetFont( 12 ), centerX: 0 } );
        massLabel.addChild( massValueText );
        massLabel.addChild( new Text( kgString, { font: new PhetFont( 12 ), centerX: 0, top: massValueText.bottom - 4 } ) );
      }
      massLabel.centerX = shapeNode.centerX;
      massLabel.bottom = shapeNode.top - 1;
      thisNode.addChild( massLabel );

      // Control label visibility.
      labelVisibleProperty.link( function( visible ) {
        massLabel.visible = visible;
      } );
    }

    // TODO: Monitoring of dynamic shape changes was here in the original Java version, removed in JavaScript
    // because I (jblanco) don't think it's needed.  Remove this comment once this is certain.

    // Monitor the mass for position and angle changes.
    mass.rotationAngleProperty.link( function() {
      thisNode.updatePositionAndAngle();
    } );
    mass.positionProperty.link( function() {
      thisNode.updatePositionAndAngle();
    } );

    // Add event listener for mouse activity.
    if ( draggable ) {
      this.addInputListener( new MassDragHandler( mass, mvt ) );
    }
  }

  return inherit( Node, ShapeMassNode, {
    updatePositionAndAngle: function() {
      this.rotation = 0;
      // Set the position
      this.centerX = this.mvt.modelToViewX( this.mass.position.x );
      this.bottom = this.mvt.modelToViewY( this.mass.position.y );
      // Set the rotation.  Rotation point is the center bottom.
      this.rotateAround( new Vector2( this.centerX, this.bottom ), -this.mass.rotationAngle );
    }
  } );
} );