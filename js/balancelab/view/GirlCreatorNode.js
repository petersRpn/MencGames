// Copyright 2013-2015, University of Colorado Boulder

/**
 * This class represents an young girl in a tool box.  When the user clicks on
 * this node, the corresponding model element is added to the model at the
 * user's mouse location.
 *
 * @author John Blanco
 */
define( function( require ) {
  'use strict';

  // modules
  var balancingAct = require( 'BALANCING_ACT/balancingAct' );
  var Girl = require( 'BALANCING_ACT/common/model/masses/Girl' );
  var inherit = require( 'PHET_CORE/inherit' );
  var ImageMassCreatorNode = require( 'BALANCING_ACT/balancelab/view/ImageMassCreatorNode' );
  var ImageMassNode = require( 'BALANCING_ACT/common/view/ImageMassNode' );
  var ModelViewTransform2 = require( 'PHETCOMMON/view/ModelViewTransform2' );
  var Property = require( 'AXON/Property' );
  var Vector2 = require( 'DOT/Vector2' );

  // Model-view transform for scaling the node used in the tool box.  This
  // may scale the node differently than what is used in the model so that
  // items in the tool box can be sized differently (generally smaller).
  var SCALING_MVT = ModelViewTransform2.createOffsetScaleMapping( Vector2.ZERO, 80 );

  /**
   * @param {BalanceLabModel} model
   * @param {ModelViewTransform2} modelViewTransform
   * @constructor
   */
  function GirlCreatorNode( model, modelViewTransform ) {
    ImageMassCreatorNode.call( this, model, modelViewTransform, new Girl(), true );
    this.setSelectionNode( new ImageMassNode( this.prototypeImageMass, SCALING_MVT, false, new Property( false ), false ) );
    this.positioningOffset = new Vector2( 0, -modelViewTransform.modelToViewDeltaY( this.prototypeImageMass.height / 2 ) );
  }

  balancingAct.register( 'GirlCreatorNode', GirlCreatorNode );

  return inherit( ImageMassCreatorNode, GirlCreatorNode );
} );