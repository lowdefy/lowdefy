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

import { type } from '@lowdefy/helpers';

function flexFactor(value, fallback) {
  if (type.isNumber(value) && value >= 0) return value;
  if (value === true) return 1;
  if (value === false) return 0;
  return fallback;
}

// A size in points (120 or '120px'), a percentage, or 'auto'. A size in points grows by the
// area's column gap, which the block takes as left padding (see childStyle).
function flexBasis({ columnGap, size }) {
  if (type.isNumber(size)) return size + columnGap;
  if (type.isString(size)) {
    const points = /^(-?(?:\d+(?:\.\d+)?|\.\d+))px$/.exec(size.trim());
    if (points) return Number(points[1]) + columnGap;
    if (size.trim().endsWith('%')) return size.trim();
  }
  return 'auto';
}

// flex as CSS writes it: a number, or "grow shrink basis".
function parseFlex({ columnGap, flex }) {
  if (type.isNumber(flex)) {
    return { flex };
  }
  const [grow, shrink, size] = String(flex).trim().split(/\s+/);
  return {
    flexGrow: flexFactor(Number(grow), 0),
    flexShrink: flexFactor(Number(shrink ?? 1), 1),
    flexBasis: flexBasis({ columnGap, size: size ?? '0%' }),
  };
}

/**
 * The flex placement of a block that sets flex, grow, shrink or size, as deriveLayout
 * (@lowdefy/layout) writes it: `flex: true` is "0 1 auto", a number or "grow shrink basis" string
 * is used as given, and grow, shrink and size fill in "grow shrink basis" (default "0 1 auto").
 */
function flexChildStyle({ columnGap, layout }) {
  const { flex, grow, shrink, size } = layout;
  if (flex === true) {
    return { flexGrow: 0, flexShrink: 1, flexBasis: 'auto' };
  }
  if (!type.isNone(flex) && flex !== false) {
    return parseFlex({ columnGap, flex });
  }
  return {
    flexGrow: flexFactor(grow, 0),
    flexShrink: flexFactor(shrink, 1),
    flexBasis: flexBasis({ columnGap, size }),
  };
}

export default flexChildStyle;
