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
import { convertStyle } from '@lowdefy/style-native';

import meta from './meta.js';
import SkeletonShape from '../../skeleton/SkeletonShape.js';

// A placeholder shape for a loading block, as the web's: the given width and height, full size by
// default. CSS lengths (`120px`, `50%`) become React Native ones.
function Skeleton({ blockId, properties, styles = {} }) {
  const { style } = convertStyle({
    height: properties.height ?? '100%',
    width: properties.width ?? '100%',
  });
  return <SkeletonShape style={[style, styles.element]} testID={`${blockId}_skeleton`} />;
}

Skeleton.meta = meta;

export default Skeleton;
