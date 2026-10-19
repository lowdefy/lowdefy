/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import getPiePath from './getPiePath.js';
import getSemanticColors from '../../shared/getSemanticColors.js';

// On a 16 unit grid, as Linear draws its glyphs.
const CENTRE = 8;
const RING_RADIUS = 6.25;
const RING_WIDTH = 1.5;
const INNER_RADIUS = 3.25;
const MARK_WIDTH = 1.6;
const BAR_X = [1.5, 6.5, 11.5];
const BAR_Y = [8.5, 5.25, 2];
const PRIORITY_BARS = { priorityHigh: 3, priorityMedium: 2, priorityLow: 1 };

function Ring({ color, dashed = false }) {
  return (
    <Circle
      cx={CENTRE}
      cy={CENTRE}
      fill="none"
      r={RING_RADIUS}
      stroke={color}
      strokeDasharray={dashed ? '1.9 1.37' : undefined}
      strokeWidth={RING_WIDTH}
    />
  );
}

function Pie({ color, fraction }) {
  return (
    <Path d={getPiePath({ cx: CENTRE, cy: CENTRE, fraction, r: INNER_RADIUS })} fill={color} />
  );
}

function Mark({ color, d }) {
  return (
    <Path
      d={d}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={MARK_WIDTH}
    />
  );
}

function getShapes({ color, inner, name }) {
  switch (name) {
    case 'backlog':
      return <Ring color={color} dashed />;
    case 'todo':
      return <Ring color={color} />;
    case 'inProgress':
      return [<Ring color={color} key="ring" />, <Pie color={color} fraction={0.5} key="pie" />];
    case 'inReview':
      return [<Ring color={color} key="ring" />, <Pie color={color} fraction={0.75} key="pie" />];
    case 'needsInput':
    case 'unmerged':
      return [
        <Ring color={color} key="ring" />,
        <Circle cx={CENTRE} cy={CENTRE} fill={color} key="dot" r={2.5} />,
      ];
    case 'readyForRelease':
      return [<Ring color={color} key="ring" />, <Pie color={color} fraction={1} key="pie" />];
    case 'done':
      return [
        <Circle cx={CENTRE} cy={CENTRE} fill={color} key="fill" r={7} />,
        <Mark color={inner} d="M5.25 8.25L7.1 10.1L10.9 6.1" key="check" />,
      ];
    case 'cancelled':
      return [
        <Circle cx={CENTRE} cy={CENTRE} fill={color} key="fill" r={7} />,
        <Mark color={inner} d="M5.75 5.75L10.25 10.25M10.25 5.75L5.75 10.25" key="cross" />,
      ];
    case 'priorityUrgent':
      return [
        <Rect fill={color} height={14} key="square" rx={3.5} width={14} x={1} y={1} />,
        <Mark color={inner} d="M8 4.5V8.5" key="stem" />,
        <Circle cx={CENTRE} cy={11.25} fill={inner} key="point" r={1.05} />,
      ];
    case 'priorityHigh':
    case 'priorityMedium':
    case 'priorityLow':
      return BAR_X.map((x, index) => (
        <Rect
          fill={color}
          height={14 - BAR_Y[index]}
          key={x}
          opacity={index < PRIORITY_BARS[name] ? 1 : 0.3}
          rx={1}
          width={3}
          x={x}
          y={BAR_Y[index]}
        />
      ));
    case 'priorityNone':
      return BAR_X.map((x) => (
        <Rect fill={color} height={1.5} key={x} opacity={0.6} rx={0.75} width={3} x={x} y={7.25} />
      ));
    default:
      return <Circle cx={CENTRE} cy={CENTRE} fill={color} r={4} />;
  }
}

/**
 * A Linear-style status, priority or stage glyph, drawn with react-native-svg. The marks inside a
 * filled glyph (the check, the cross, the exclamation) are drawn in the cell colour, so they read
 * as cut out of the glyph in light and dark mode.
 *
 * @param {Object} props
 * @param {string} props.color
 * @param {string} props.name
 * @param {number} props.size
 * @param {string} [props.testID]
 * @param {Object} props.tokens
 */
function StatusGlyph({ color, name, size, testID, tokens }) {
  const inner = getSemanticColors({ tokens }).cell;
  return (
    <Svg height={size} testID={testID} viewBox="0 0 16 16" width={size}>
      {getShapes({ color, inner, name })}
    </Svg>
  );
}

export default StatusGlyph;
