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
import { type } from '@lowdefy/helpers';

import AvatarCircle from './AvatarCircle.js';
import AvatarStack from './AvatarStack.js';
import meta from './meta.js';
import useComponentTokens from '../../useComponentTokens.js';

/**
 * A person's avatar: their initials on a colour their name picks, the same colour everywhere,
 * or their image. With `avatars` it stacks several, overlapping, as a list of assignees does.
 */
function Avatar({ blockId, components, properties, styles }) {
  const { isDark, tokens } = useComponentTokens(properties.theme);
  const size = properties.size ?? 28;
  if (type.isArray(properties.avatars)) {
    return (
      <AvatarStack
        avatars={properties.avatars}
        isDark={isDark}
        max={properties.max}
        imageSource={components.imageSource}
        ringColor={properties.ringColor}
        size={size}
        style={styles.element}
        testID={`${blockId}_avatar`}
        tokens={tokens}
      />
    );
  }
  return (
    <AvatarCircle
      avatar={properties}
      isDark={isDark}
      imageSource={components.imageSource}
      size={size}
      style={styles.element}
      testID={`${blockId}_avatar`}
      tokens={tokens}
    />
  );
}

Avatar.meta = meta;

export default Avatar;
