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

import React, { useRef } from 'react';
import { PixelRatio, View } from 'react-native';
import { Icon } from '@lowdefy/client-native';

// A tab bar icon is 24 points; drawn at the screen's scale so it stays sharp.
const SIZE = 24;

const styles = {
  hidden: { left: -1000, opacity: 0, position: 'absolute', top: -1000 },
};

function TabIconImage({ data, onImage }) {
  const ref = useRef(null);
  const drawnRef = useRef(false);
  const scale = PixelRatio.get();
  function draw() {
    if (drawnRef.current) return;
    drawnRef.current = true;
    ref.current.toDataURL(
      (base64) =>
        onImage({ height: SIZE, scale, uri: `data:image/png;base64,${base64}`, width: SIZE }),
      { height: SIZE * scale, width: SIZE * scale }
    );
  }
  return (
    <View onLayout={draw}>
      <Icon color="#000000" data={data} ref={ref} size={SIZE} />
    </View>
  );
}

/**
 * Draws tab icons that have no SF Symbol (every tab off iOS) as images: a native tab bar takes an
 * image source, not a view, so each Lucide icon is drawn once, out of sight, and read back as a
 * PNG with react-native-svg's toDataURL. The image is black on transparent, and the tab bar tints
 * it (selected and unselected).
 *
 * @param {Object} props
 * @param {Object[]} props.items The tabs to draw: `{ pageId, iconData }`.
 * @param {(pageId: string, source: Object) => void} props.onImage Called with each image source.
 */
function TabIconImages({ items, onImage }) {
  return (
    <View pointerEvents="none" style={styles.hidden}>
      {items.map((item) => (
        <TabIconImage
          data={item.iconData}
          key={item.pageId}
          onImage={(source) => onImage(item.pageId, source)}
        />
      ))}
    </View>
  );
}

export default TabIconImages;
