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
import { View } from 'react-native';

const BACKDROP_STYLE = {
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
  // Lifted by its own height, so its bottom edge sits at the top of the content.
  transform: [{ translateY: '-100%' }],
};

/**
 * A Screen's headerBackdrop: blocks drawn in the space above the content, behind the large title
 * and the translucent bar, such as art beside the title. It is the page's first content, laid out
 * at the top of the content and lifted by its own height with a transform, as PageTint is moved:
 * its layout stays inside the content, so the scroll view's content starts where it did without
 * it, and nothing in the content flow takes its room. It scrolls away with the title and never
 * takes touches. A block with a negative bottom margin reaches down beside the first blocks.
 *
 * @param {Object} props
 * @param {string} props.blockId The Screen's block id.
 * @param {React.ReactNode} props.children The slot's blocks.
 */
function HeaderBackdrop({ blockId, children }) {
  return (
    <View pointerEvents="none" style={BACKDROP_STYLE} testID={`${blockId}_header_backdrop`}>
      {children}
    </View>
  );
}

export default HeaderBackdrop;
