/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TouchableOpacity
 */
'use strict';

// Note (avik): add @flow when Flow supports spread properties in propTypes

var Animated = require('Animated');
var NativeMethodsMixin = require('NativeMethodsMixin');
var React = require('React');
var TimerMixin = require('react-timer-mixin');
var Touchable = require('Touchable');
var TouchableWithoutFeedback = require('TouchableWithoutFeedback');

var ensurePositiveDelayProps = require('ensurePositiveDelayProps');
var flattenStyle = require('flattenStyle');
var keyOf = require('keyOf');

/**
 * A wrapper for making views respond properly to touches.
 * On press down, the opacity of the wrapped view is decreased, dimming it.
 * This is done without actually changing the view hierarchy, and in general is
 * easy to add to an app without weird side-effects.
 *
 * Example:
 *
 * ```
 * renderButton: function() {
 *   return (
 *     <TouchableOpacity onPress={this._onPressButton}>
 *       <Image
 *         style={styles.button}
 *         source={require('image!myButton')}
 *       />
 *     </TouchableOpacity>
 *   );
 * },
 * ```
 * > **NOTE**: TouchableOpacity supports only one child
 * >
 * > If you wish to have to have several child components, wrap them in a View.
 */

var TouchableOpacity = React.createClass({
  mixins: [TimerMixin, Touchable.Mixin, NativeMethodsMixin],

  propTypes: {
    ...TouchableWithoutFeedback.propTypes,
    /**
     * Determines what the opacity of the wrapped view should be when touch is
     * active.
     */
    activeOpacity: React.PropTypes.number,
  },

  getDefaultProps: function() {
    return {
      activeOpacity: 0.2,
    };
  },

  getInitialState: function() {
    return {
      ...this.touchableGetInitialState(),
      anim: new Animated.Value(1),
    };
  },

  componentDidMount: function() {
    ensurePositiveDelayProps(this.props);
  },

  componentDidUpdate: function() {
  },

  componentWillReceiveProps: function(nextProps) {
    ensurePositiveDelayProps(nextProps);
  },

  setOpacityTo: function(value) {
    Animated.timing(
      this.state.anim,
      {toValue: value, duration: 150}
    ).start();
  },

  /**
   * `Touchable.Mixin` self callbacks. The mixin will invoke these if they are
   * defined on your component.
   */
  touchableHandleActivePressIn: function() {
    this.clearTimeout(this._hideTimeout);
    this._hideTimeout = null;
    this._opacityActive();
    this.props.onPressIn && this.props.onPressIn();
  },

  touchableHandleActivePressOut: function() {
    if (!this._hideTimeout) {
      this._opacityInactive();
    }
    this.props.onPressOut && this.props.onPressOut();
  },

  touchableHandlePress: function() {
    this.clearTimeout(this._hideTimeout);
    this._opacityActive();
    this._hideTimeout = this.setTimeout(
      this._opacityInactive,
      this.props.delayPressOut || 100
    );
    this.props.onPress && this.props.onPress();
  },

  touchableHandleLongPress: function() {
    this.props.onLongPress && this.props.onLongPress();
  },

  touchableGetPressRectOffset: function() {
    return PRESS_RECT_OFFSET;   // Always make sure to predeclare a constant!
  },

  touchableGetHighlightDelayMS: function() {
    return this.props.delayPressIn || 0;
  },

  touchableGetLongPressDelayMS: function() {
    return this.props.delayLongPress === 0 ? 0 :
      this.props.delayLongPress || 500;
  },

  touchableGetPressOutDelayMS: function() {
    return this.props.delayPressOut;
  },

  _opacityActive: function() {
    this.setOpacityTo(this.props.activeOpacity);
  },

  _opacityInactive: function() {
    this.clearTimeout(this._hideTimeout);
    this._hideTimeout = null;
    var childStyle = flattenStyle(this.props.style) || {};
    this.setOpacityTo(
      childStyle.opacity === undefined ? 1 : childStyle.opacity
    );
  },

  render: function() {
    return (
      <Animated.View
        accessible={true}
        style={[this.props.style, {opacity: this.state.anim}]}
        testID={this.props.testID}
        onStartShouldSetResponder={this.touchableHandleStartShouldSetResponder}
        onResponderTerminationRequest={this.touchableHandleResponderTerminationRequest}
        onResponderGrant={this.touchableHandleResponderGrant}
        onResponderMove={this.touchableHandleResponderMove}
        onResponderRelease={this.touchableHandleResponderRelease}
        onResponderTerminate={this.touchableHandleResponderTerminate}>
        {this.props.children}
      </Animated.View>
    );
  },
});

/**
 * When the scroll view is disabled, this defines how far your touch may move
 * off of the button, before deactivating the button. Once deactivated, try
 * moving it back and you'll see that the button is once again reactivated!
 * Move it back and forth several times while the scroll view is disabled.
 */
var PRESS_RECT_OFFSET = {top: 20, left: 20, right: 20, bottom: 30};


module.exports = TouchableOpacity;
