// Copyright 2013-2020, University of Colorado Boulder

/**
 * This class defines a mass in the model that carries with it an associated image that should be presented in the view.
 * The image can change at times, such as when it is dropped on the balance.
 * <p/>
 * IMPORTANT: All images used by this class are assumed to have their center of mass in the horizontal direction in the
 * center of the image.  In order to make this work for an image, it may be necessary to have some blank transparent
 * space on one side.
 * <p/>
 * @author John Blanco
 */

import Property from '../../../../axon/js/Property.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import inherit from '../../../../phet-core/js/inherit.js';
import balancingAct from '../../balancingAct.js';
import Mass from './Mass.js';

/**
 * @param mass
 * @param image
 * @param height
 * @param initialPosition
 * @param isMystery
 * @param {Object} [options]
 * @constructor
 */
function ImageMass( mass, image, height, initialPosition, isMystery, options ) {
  Mass.call( this, mass, initialPosition, isMystery, options );

  // Property that contains the current image.
  this.imageProperty = new Property( image );

  // Property that contains the current height of the corresponding model object.  Only height is used, as opposed to
  // both height and width, because the aspect ratio of the image is expected to be maintained, so the model element's
  // width can be derived from a combination of its height and the aspect ratio of the image that represents it.
  // A property is used because the size may change during animations.
  this.heightProperty = new Property( height );

  // Flag that indicates whether this node should be represented by a reversed version of the current image, must be
  // set prior to image updates.
  this.reverseImage = false;

  // Expected duration of the current animation.
  this.expectedAnimationTime = 0;
}

balancingAct.register( 'ImageMass', ImageMass );

inherit( Mass, ImageMass, {

  reset: function() {
    this.heightProperty.reset();
    this.imageProperty.reset();
    Mass.prototype.reset.call( this );
  },

  getMiddlePoint: function() {
    const position = this.positionProperty.get();
    return new Vector2( position.x, position.y + this.heightProperty.get() / 2 );
  },

  // TODO: this seems too tricky, see https://github.com/phetsims/balancing-act/issues/107
  createCopy: function() {
    // This clever invocation supports the creation of subclassed instances.
    return new this.constructor( this.positionProperty.get().copy(), this.isMystery );
  }
} );

export default ImageMass;