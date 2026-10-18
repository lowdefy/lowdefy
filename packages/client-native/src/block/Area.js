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

import React, { useContext } from 'react';
import { View } from 'react-native';

import AreaContext from '../layout/AreaContext.js';
import areaLayout from '../layout/areaLayout.js';
import BreakpointContext from '../layout/BreakpointContext.js';
import layoutStyles from '../layout/layoutStyles.js';
import sortByOrder from '../layout/sortByOrder.js';

/**
 * A block's slot, laid out as its slot settings (and, for content, the block's layout) ask, with
 * its blocks drawn in layout order.
 *
 * A gapped area is two views: the outer one takes the slot's style, the inner one is the row,
 * widened by its column gap (layout-native containerStyle), so a slot style's margin or padding
 * never undoes the widening.
 *
 * @param {Object} props
 * @param {Object[]} props.blocks The slot's blocks.
 * @param {(block: Object) => Object} props.getLayout A block's evaluated layout.
 * @param {(block: Object, index: number) => React.ReactNode} props.renderBlock Draws a block;
 *   `index` is its config position.
 */
const Area = ({ area, areaKey, blocks, getLayout, layout, renderBlock, style }) => {
  const breakpoint = useContext(BreakpointContext);
  const { container, columnGap } = layoutStyles(areaLayout({ area, areaKey, layout }), breakpoint);
  const areaContext = { columnGap, container };
  const children = sortByOrder({ blocks, breakpoint, getLayout }).map(({ block, index }) =>
    renderBlock(block, index)
  );
  if (columnGap === 0) {
    return (
      <AreaContext.Provider value={areaContext}>
        <View style={[container, style]}>{children}</View>
      </AreaContext.Provider>
    );
  }
  return (
    <AreaContext.Provider value={areaContext}>
      <View style={style}>
        <View style={container}>{children}</View>
      </View>
    </AreaContext.Provider>
  );
};

export default Area;
