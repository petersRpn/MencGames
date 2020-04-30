// Copyright 2014-2020, University of Colorado Boulder

/**
 * This class presents a dialog to the user that allows them to enter a mass value.
 *
 * @author John Blanco
 */

import NumberProperty from '../../../../axon/js/NumberProperty.js';
import Dimension2 from '../../../../dot/js/Dimension2.js';
import Range from '../../../../dot/js/Range.js';
import Utils from '../../../../dot/js/Utils.js';
import inherit from '../../../../phet-core/js/inherit.js';
import StringUtils from '../../../../phetcommon/js/util/StringUtils.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Rectangle from '../../../../scenery/js/nodes/Rectangle.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import ArrowButton from '../../../../sun/js/buttons/ArrowButton.js';
import HSlider from '../../../../sun/js/HSlider.js';
import Panel from '../../../../sun/js/Panel.js';
import balancingActStrings from '../../balancingActStrings.js';
import balancingAct from '../../balancingAct.js';

const kgString = balancingActStrings.kg;
const pattern0Value1UnitsString = balancingActStrings.pattern0Value1Units;

// constants
const READOUT_FONT = new PhetFont( 16 );
const ARROW_HEIGHT = 15;
const MAX_MASS = 100;
const TICK_MARK_FONT = new PhetFont( 10 );

/**
 * @constructor
 */
function MassValueEntryNode( options ) {
  Node.call( this );
  const self = this;
  self.massValueProperty = new NumberProperty( 0 );

  // Create and add the readout, including the background.
  const readoutText = new Text( StringUtils.format( pattern0Value1UnitsString, 0, kgString ), { font: READOUT_FONT } );
  const readoutBackground = new Rectangle( 0, 0, readoutText.width * 2.5, readoutText.height * 1.3, 4, 4,
    {
      fill: 'white',
      stroke: 'black'
    }
  );
  const panelContent = new Node();
  panelContent.addChild( readoutBackground );
  readoutText.centerY = readoutBackground.centerY;
  panelContent.addChild( readoutText );

  // Create and add the slider.
  const slider = new HSlider( self.massValueProperty, new Range( 0, MAX_MASS ), {
    thumbSize: new Dimension2( 15, 30 ),
    thumbTouchAreaXDilation: 8,
    thumbTouchAreaYDilation: 8,
    majorTickLength: 15,
    tickLabelSpacing: 2,
    constrainValue: Utils.roundSymmetric
  } );
  panelContent.addChild( slider );
  for ( let i = 0; i <= MAX_MASS; i += 10 ) {
    if ( i % 50 === 0 ) {
      slider.addMajorTick( i, new Text( i, { font: TICK_MARK_FONT } ) );
    }
    else {
      slider.addMinorTick( i, null );
    }
  }

  // Create and add the arrow buttons.
  const arrowButtonOptions = { arrowHeight: ARROW_HEIGHT, arrowWidth: ARROW_HEIGHT * Math.sqrt( 3 ) / 2 };
  const leftArrowButton = new ArrowButton( 'left', function() { self.massValueProperty.value--; }, arrowButtonOptions );
  panelContent.addChild( leftArrowButton );
  const rightArrowButton = new ArrowButton( 'right', function() { self.massValueProperty.value++; }, arrowButtonOptions );
  panelContent.addChild( rightArrowButton );

  // layout
  self.massValueProperty.value = MAX_MASS / 2; // Make sure slider is in the middle during layout.
  readoutBackground.centerX = slider.bounds.width / 2;
  readoutBackground.top = 0;
  slider.left = 0;
  slider.top = readoutBackground.bottom + 5;
  leftArrowButton.right = slider.left - 12;
  leftArrowButton.centerY = slider.centerY;
  rightArrowButton.left = slider.right + 12;
  rightArrowButton.centerY = slider.centerY;
  self.massValueProperty.reset(); // Put slider back to original position.

  // Put the contents into a panel.
  const panel = new Panel( panelContent, { fill: 'rgb( 234, 234, 174 )', xMargin: 7, yMargin: 7 } );
  self.addChild( panel );

  // Update the readout text and arrow button states whenever the value changes.
  self.massValueProperty.link( function( value ) {
    readoutText.text = StringUtils.format( pattern0Value1UnitsString, value, kgString );
    readoutText.centerX = readoutBackground.centerX;
    leftArrowButton.enabled = ( value > 0 );
    rightArrowButton.enabled = ( value < MAX_MASS );
  } );

  self.mutate( options );
}

balancingAct.register( 'MassValueEntryNode', MassValueEntryNode );

inherit( Node, MassValueEntryNode, {
  clear: function() {
    this.massValueProperty.reset();
  },
  showAnswer: function( massValue ) {
    this.massValueProperty.value = massValue;
  }
} );

export default MassValueEntryNode;