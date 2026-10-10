/**
 * Stand-in for react-native-svg in the unit tests (the real one needs a
 * phone). Every shape becomes a plain element with the same props.
 */
const React = require('react');

function make(name) {
  const Shape = props => React.createElement(name, props, props.children);
  Shape.displayName = name;
  return Shape;
}

const Svg = make('Svg');
module.exports = {
  __esModule: true,
  default: Svg,
  Svg,
  Circle: make('Circle'),
  Ellipse: make('Ellipse'),
  G: make('G'),
  Line: make('Line'),
  Path: make('Path'),
  Polygon: make('Polygon'),
  Rect: make('Rect'),
};
