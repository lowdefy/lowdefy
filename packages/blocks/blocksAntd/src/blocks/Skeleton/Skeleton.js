/*
  Copyright 2020-2021 Lowdefy, Inc

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
import { Skeleton } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-tools';

const SkeletonBlock = ({ blockId, events, properties, methods }) => {
  if (properties.button) {
    return (
      <Skeleton.Button
        id={blockId}
        className={methods.makeCssClass(properties.style)}
        events={events}
        active={properties.active || properties.button.active}
        size={properties.size || properties.button.size}
        shape={properties.shape || properties.button.shape}
      />
    );
  }
  if (properties.input) {
    return (
      <Skeleton.Input
        id={blockId}
        className={methods.makeCssClass(properties.style)}
        events={events}
        active={properties.active || properties.input.active}
        size={properties.size || properties.input.size}
      />
    );
  }
  if (properties.avatar && (!properties.title || !properties.paragraph)) {
    return (
      <Skeleton.Avatar
        id={blockId}
        className={methods.makeCssClass(properties.style)}
        events={events}
        active={properties.active || properties.avatar.active}
        size={properties.size || properties.avatar.size}
        shape={properties.shape || properties.avatar.shape}
      />
    );
  }
  return (
    <Skeleton
      id={blockId}
      className={methods.makeCssClass(properties.style)}
      events={events}
      active={properties.active}
      avatar={properties.avatar}
      title={properties.title}
      paragraph={properties.paragraph}
      round={properties.round}
    />
  );
};

SkeletonBlock.defaultProps = blockDefaultProps;

export default SkeletonBlock;
