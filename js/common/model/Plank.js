// Copyright 2002-2013, University of Colorado Boulder

/**
 * This is the model for the plank upon which masses can be placed.
 *
 * @author John Blanco
 */
define( function( require ) {
  'use strict';

  // Imports
  var inherit = require( 'PHET_CORE/inherit' );
  var MassForceVector = require( 'BALANCING_ACT/common/model/MassForceVector' );
  var Matrix3 = require( 'DOT/Matrix3' );
  var ObservableArray = require( 'AXON/ObservableArray' );
  var PropertySet = require( 'AXON/PropertySet' );
  var Shape = require( 'KITE/Shape' );
  var Vector2 = require( 'DOT/Vector2' );

  // Constants
  var PLANK_LENGTH = 4.5;// meters
  var PLANK_THICKNESS = 0.05; // meters
  var PLANK_MASS = 75; // kg
  var INTER_SNAP_TO_MARKER_DISTANCE = 0.25; // meters
  var NUM_SNAP_TO_LOCATIONS = Math.floor( PLANK_LENGTH / INTER_SNAP_TO_MARKER_DISTANCE - 1 );
  var MOMENT_OF_INERTIA = PLANK_MASS * ( ( PLANK_LENGTH * PLANK_LENGTH ) + ( PLANK_THICKNESS * PLANK_THICKNESS ) ) / 12;

  /**
   * @param location {Vector2} Initial location of the horizontal center, vertical bottom
   * @param pivotPoint {Vector2} Point around which the plank will pivot
   * @param columnState {Property} Property that indicates current state of support columns.
   * @constructor
   */
  function Plank( location, pivotPoint, columnState ) {
    var thisPlank = this;

    // Create the outline shape of the plank.
    var tempShape = new Shape();
    tempShape.moveTo( 0, 0 );
    tempShape.lineTo( PLANK_LENGTH / 2, 0 );
    tempShape.lineTo( PLANK_LENGTH / 2, PLANK_THICKNESS );
    tempShape.lineTo( 0, PLANK_THICKNESS );
    tempShape.lineTo( -PLANK_LENGTH / 2, PLANK_THICKNESS );
    tempShape.lineTo( -PLANK_LENGTH / 2, 0 );
    tempShape.lineTo( 0, 0 );
    var initialPlankShape = tempShape.transformed( Matrix3.translation( location.x, location.y ) );

    PropertySet.call( this,
      {
        // Point where the bottom center of the plank is currently located.
        // If the plank is sitting on top of the fulcrum, this point will be
        // the same as the pivot point.  When the pivot point is above the
        // plank, as is generally done in this simulation in order to make the
        // plank rebalance if nothing is on it, this location will be
        // different.
        bottomCenterLocation: location,

        // Angle of the plank with respect to the ground.  A value of 0
        // indicates a level plank, positive is tilted right, negative to the
        // left.  In radians.
        tiltAngle: 0,

        // Shape of the plank, which conveys everything about where it is in
        // model space.  TODO: This may or may not be used, based on what the
        // performance is like in scenery.  If it is, some of the other
        // properties aren't needed, or at least don't need to be public.  If
        // it *isn't* used, get rid of it from here.
        shape: initialPlankShape,

        // Property that indicates whether the plank is being manually moved
        // by the user.
        userControlled: false
      } );

    // Externally visible observable lists.
    thisPlank.massesOnSurface = new ObservableArray();
    thisPlank.forceVectors = new ObservableArray();

    //------------------------------------------------------------------------
    // Variables that need to be retained for dynamic behavior, but are not
    // intended to be accessed externally.
    //------------------------------------------------------------------------

    thisPlank.pivotPoint = new Vector2( pivotPoint.x, pivotPoint.y );
    thisPlank.columnState = columnState;
    thisPlank.angularVelocity = 0;
    thisPlank.currentNetTorque = 0;
    thisPlank.massForceVectors = [];
    thisPlank.maxTiltAngle = Math.asin( location.y / ( PLANK_LENGTH / 2 ) );

    // Tracks masses that are on the plank.
    thisPlank.massDistancePairs = [];

    // The original, unrotated shape, which is needed for a number of operations.
    thisPlank.unrotatedShape = initialPlankShape;

    // Maintain the tick mark positions here, since they represent the
    // locations where masses can be placed.
    thisPlank.tickMarks = [];

    // TODO: Temp for testing.
    thisPlank.turningRight = true;
  }

  // Inherit from base class and define the methods for this object.
  return inherit( PropertySet, Plank, {

    step: function( dt ) {
      if ( !this.userControlled ) {
        var angularAcceleration;
        this.updateNetTorque();

        // Update the angular acceleration and velocity.  There is some
        // thresholding here to prevent the plank from oscillating forever
        // with small values, since this can cause odd-looking movements
        // of the planks and masses.  The thresholds were empirically
        // determined.
        angularAcceleration = this.currentNetTorque / MOMENT_OF_INERTIA;
        angularAcceleration = Math.abs( angularAcceleration ) > 0.00001 ? angularAcceleration : 0;
        this.angularVelocity += angularAcceleration;
        this.angularVelocity = Math.abs( this.angularVelocity ) > 0.00001 ? this.angularVelocity : 0;

        // Update the angle of the plank's tilt based on the angular velocity.
        var previousTiltAngle = this.tiltAngle;
        this.tiltAngle += this.angularVelocity * dt;
        if ( Math.abs( this.tiltAngle ) > this.maxTiltAngle ) {
          // Limit the angle when one end is touching the ground.
          this.tiltAngle = this.maxTiltAngle * ( this.tiltAngle < 0 ? -1 : 1 );
          this.angularVelocity = 0;
        }
        else if ( Math.abs( this.tiltAngle ) < 0.0001 ) {
          // Below a certain threshold just force the tilt angle to be
          // zero so that it appears perfectly level.
          this.tiltAngle = 0;
        }

        // Update the shape of the plank and the positions of the masses on
        // the surface, but only if the tilt angle has changed.
        if ( this.tiltAngle !== previousTiltAngle ) {
          this.updatePlank();
          this.updateMassPositions();
        }

        // Simulate friction by slowing down the rotation a little.
        // TODO: Put this back in when shape testing complete.
//        this.angularVelocity *= 0.91;
      }
    },

    // Add a mass to the surface of the plank, chooses a location below the mass.
    addMassToSurface: function( mass ) {
      var massAdded = false;
      var closestOpenLocation = this.getOpenMassDroppedLocation( mass.position );
      if ( this.isPointAbovePlank( mass.getMiddlePoint() ) && closestOpenLocation !== null ) {
        mass.position = closestOpenLocation;
        mass.onPlank = true;
        this.massDistancePairs[ mass ] = this.getPlankSurfaceCenter().distance( mass.position ) * ( mass.position.x > this.getPlankSurfaceCenter().x ? 1 : -1 );

        // Add the force vector for this mass.
        this.forceVectors.push( new MassForceVector( mass ) );

        // Add an observer that will remove this mass when the user picks it up.
        var thisPlank = this;
        var userControlledObserver = function( userControlled ) {
          if ( userControlled ) {
            // The user has picked up this mass, so it is no longer
            // on the surface.
            thisPlank.removeMassFromSurface( mass );
            mass.unlink( userControlledObserver );
          }
        };

        mass.userControlled.link( userControlledObserver );
        this.massesOnSurface.push( mass );
        this.updateMassPositions();
        this.updateNetTorque();
        massAdded = true;
      }

      return massAdded;
    },

    // Add a mass to the specified location on the plank.
    addMassToSurfaceAt: function( mass, distanceFromCenter ) {
      if ( distanceFromCenter <= PLANK_LENGTH / 2 ) {
        throw new Error( 'Warning: Attempt to add mass at invalid distance from center' );
      }
      var vectorToLocation = this.getPlankSurfaceCenter().plus( new Vector2( distanceFromCenter, 0 ).rotated( this.tiltAngle ) );
      // Set the position of the mass to be just above the plank at the
      // appropriate distance so that it will drop to the correct place.
      mass.setPosition( vectorToLocation.x, vectorToLocation.y + 0.01 );
      assert( this.isPointAbovePlank( mass.position ) );  // Need to fix this if mass isn't above the surface.
      this.addMassToSurface( mass );
    },

    updateMassPositions: function() {
      var thisPlank = this;
      this.massesOnSurface.forEach( function( mass ) {
        // Compute the vector from the center of the plank's surface to
        // the center of the mass, in meters.
        var vectorFromCenterToMass = new Vector2( this.getMassDistanceFromCenter( mass ), 0 ).rotated( this.tiltAngle );

        // Set the position and rotation of the mass.
        mass.position = thisPlank.getPlankSurfaceCenter().plus( vectorFromCenterToMass );
        mass.rotationAngle = thisPlank.tiltAngle;
      } );

      // Update the force vectors from the masses.  This mostly just moves
      // them to the correct locations.
      this.forceVectors.forEach( function( forceVectors ) {
        forceVectors.update();
      } );
    },

    removeMassFromSurface: function( mass ) {

      // Remove the mass.
      this.massesOnSurface = this.massesOnSurface.splice( this.massesOnSurface.indexOf( mass ), 1 );

      // Remove the mass-distance pair for this mass.
      for ( var i = 0; i < this.massDistancePairs.length; i++ ) {
        if ( this.massDistancePairs[i].mass === mass ) {
          this.massDistancePairs = this.massDistancePairs.splice( i, 1 );
          break;
        }
      }

      // Reset the attributes of the mass that may have been affected by being on the plank.
      mass.rotationAngle = 0;
      mass.onPlank = false;

      // Remove the force vector associated with this mass.
      for ( var j = 0; j < this.massDistancePairs.length; j++ ) {
        if ( this.forceVectors[j].mass === mass ) {
          this.forceVectors.splice( j, 1 );
          break;
        }
      }

      // Update the torque, since the removal of the mass undoubtedly changed it.
      this.updateNetTorque();
    },

    removeAllMasses: function() {
      var thisPlank = this;
      var massesCopy = this.massesOnSurface.slice( 0 );
      massesCopy.forEach( function( mass ) {
        thisPlank.removeMass( mass );
      } );
    },

    getMassDistanceFromCenter: function( mass ) {
      for ( var i = 0; i < this.massDistancePairs; i++ ) {
        if ( this.massDistancePairs[i].mass === mass ) {
          return this.massDistancePairs[i].distance;
        }
      }
      return 0;
    },

    updatePlank: function() {
      if ( this.pivotPoint.y >= this.unrotatedShape.minY ) {
        throw new Error( 'Pivot point cannot be below the plank.' );
      }
      this.shape = this.unrotatedShape.transformed( Matrix3.rotationAround( this.tiltAngle, this.pivotPoint.x, this.pivotPoint.y ) );
      var attachmentBarVector = new Vector2( 0, this.unrotatedShape.y - this.pivotPoint.y );
      attachmentBarVector = attachmentBarVector.rotated( this.tiltAngle );
      this.bottomCenterPoint = this.pivotPoint.plus( attachmentBarVector );
    },

    // Find the best open location for a mass that was dropped at the given
    // point.  Returns null if no nearby open location is available.
    getOpenMassDroppedLocation: function( p ) {
      var closestOpenLocation = null;
      var candidateOpenLocations = this.getSnapToLocations();
      if ( NUM_SNAP_TO_LOCATIONS % 2 === 1 ) {
        // Remove the location at the center of the plank from the set of
        // candidates, since we don't want to allow users to place things
        // there.
        candidateOpenLocations.splice( NUM_SNAP_TO_LOCATIONS / 2, 1 );
      }

      // Sort through the locations and eliminate those that are already
      // occupied or too far away.
      var copyOfCandidateLocations = candidateOpenLocations.slice( 0 );
      for ( var i = 0; i < copyOfCandidateLocations.length; i++ ) {
        for ( var j = 0; j < this.massesOnSurface.length; j++ ) {
          if ( this.massesOnSurface[j].getPosition().distance( copyOfCandidateLocations[i] ) < INTER_SNAP_TO_MARKER_DISTANCE / 10 ) {
            // This position is already occupied.
            candidateOpenLocations = _.without( candidateOpenLocations, this.massesOnSurface[j] );
          }
        }
      }

      // Find the closest of the open locations.
      candidateOpenLocations.forEach( function( candidateOpenLocation ) {
        // Must be a reasonable distance away in the horizontal direction
        // so that objects don't appear to fall sideways.
        if ( Math.abs( candidateOpenLocation.x - p.x ) <= INTER_SNAP_TO_MARKER_DISTANCE ) {
          // This location is a potential candidate.  Is it better than what was already found?
          if ( closestOpenLocation === null || candidateOpenLocation.distance( p ) < closestOpenLocation.distance( p ) ) {
            closestOpenLocation = candidateOpenLocation;
          }
        }
      } );
      return closestOpenLocation;
    },

    /**
     * Force the plank back to the level position.  This is generally done
     * when the two support columns are put into place.
     */
    forceToLevelAndStill: function() {
      this.forceAngle( 0.0 );
    },

    /**
     * Force the plank to the max tilted position.  This is generally done
     * when the single big support column is put into place.
     */
    forceToMaxAndStill: function() {
      this.forceAngle( this.maxTiltAngle );
    },

    forceAngle: function( angle ) {
      this.angularVelocity = 0;
      this.tiltAngle = angle;
      this.updatePlank();
      this.updateMassPositions();
    },

    isTickMarkOccupied: function( tickMark ) {
      var tickMarkCenter = new Vector2( tickMark.bounds.centerX(), tickMark.bounds.centerY() );
      var tickMarkDistanceFromCenter = this.getPlankSurfaceCenter().distance( tickMarkCenter );
      if ( tickMarkCenter.x < this.getPlankSurfaceCenter().x ) {
        tickMarkDistanceFromCenter = -tickMarkDistanceFromCenter;
      }
      // Since the distance is from the center of the plank to the center of
      // the tick mark, there needs to be some tolerance built in to
      // recognizing whether masses are at the same distance.
      var massAtThisTickMark = false;
      for ( var i = 0; i < this.massesOnSurface; i++ ) {
        var massDistanceFromCenter = this.getMassDistanceFromCenter( this.massesOnSurface[i] );
        if ( massDistanceFromCenter > tickMarkDistanceFromCenter - PLANK_THICKNESS && massDistanceFromCenter < tickMarkDistanceFromCenter + PLANK_THICKNESS ) {
          massAtThisTickMark = true;
          break;
        }
      }
      return massAtThisTickMark;
    },

    updateTickMarks: function() {
      // TODO: Stubbed until I figure out whether to do tick marks the same way as in the Java sim.
      console.log( 'updateTickMarks not implemented yet.' );
    },

    // Obtain the absolute position (in meters) of the center surface (top)
    // of the plank
    getPlankSurfaceCenter: function() {
      // Start at the absolute location of the attachment point, and add the
      // relative location of the top of the plank, accounting for its
      // rotation angle
      return new Vector2( this.bottomCenterLocation ).plus( new Vector2( 0, PLANK_THICKNESS ).rotated( this.tiltAngle ) );
    },

    // Obtain the Y value for the surface of the plank for the specified X
    // value.  Does not check for valid x value.
    getSurfaceYValue: function( xValue ) {
      // Solve the linear equation for the line that represents the surface
      // of the plank.
      var m = Math.tan( this.tiltAngle );
      var b = this.getPlankSurfaceCenter().y - m * this.getPlankSurfaceCenter().x;
      // Does NOT check if the xValue range is valid.
      return m * xValue + b;
    },

    isPointAbovePlank: function( p ) {
      var plankBounds = this.shape.bounds;
      return p.x >= plankBounds.minX && p.x <= plankBounds.maxX && p.y > this.getSurfaceYValue( p.x );
    },

    /*
     * Returns true if the masses and distances on the plank work out such
     * that the plank is balanced, even if it is not yet in the level position.
     * This does NOT pay attention to support columns.
     */
    isBalanced: function() {
      var unCompensatedTorque = 0;
      this.massesOnSurface.forEach( function( mass ) {
        unCompensatedTorque += mass.mass * this.getMassDistanceFromCenter( mass );
      } );

      // Account for floating point error, just make sure it is close enough.
      return Math.abs( unCompensatedTorque ) < 1E-6;
    },

    updateNetTorque: function() {
      this.currentNetTorque = 0;
      if ( this.columnState.value === 'none' ) {

        // Add the torque due to the masses on the surface of the plank.
//        this.currentNetTorque += this.getTorqueDueToMasses();

        // Add in torque due to plank.
//        this.currentNetTorque += ( this.pivotPoint.x - this.bottomCenterLocation.x ) * PLANK_MASS;
        // TODO: Temp for test and demo
        if ( ( this.turningRight && this.maxTiltAngle - this.tiltAngle < 0.001 ) ||
             ( !this.turningRight && this.maxTiltAngle + this.tiltAngle < 0.001 ) ) {
          this.turningRight = !this.turningRight;
        }
        this.currentNetTorque = 1 * this.turningRight ? 1 : -1;
      }
    },

    getTorqueDueToMasses: function() {
      var thisPlank = this;
      var torque = 0;
      this.massesOnSurface.forEach( function( mass ) {
        torque += thisPlank.pivotPoint.x - mass.getPosition().x * mass.mass;
      } );
      return torque;
    },

    getSnapToLocations: function() {
      var snapToLocations = new Array( NUM_SNAP_TO_LOCATIONS );
      var rotationTransform = Matrix3.rotationAround( this.tiltAngle, this.pivotPoint.x, this.pivotPoint.y );
      var unrotatedY = this.unrotatedShape.bounds.maxY;
      var unrotatedMinX = this.unrotatedShape.bounds.minX;
      for ( var i = 0; i < NUM_SNAP_TO_LOCATIONS; i++ ) {
        var unrotatedPoint = new Vector2( unrotatedMinX + ( i + 1 ) * INTER_SNAP_TO_MARKER_DISTANCE, unrotatedY );
        snapToLocations.add( rotationTransform.transformed( unrotatedPoint ) );
      }

      return snapToLocations;
    }
  } );

} );