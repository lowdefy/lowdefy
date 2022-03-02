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
import { get } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-utils';

const AnchorBlock = ({ blockId, events, components: { Icon, Link }, methods, properties }) => {
  const showLoading = get(events, 'onClick.loading');
  const disabled = properties.disabled || showLoading;
  return (
    <Link
      id={blockId}
      className={methods.makeCssClass([
        properties.style,
        disabled && { color: '#BEBEBE', cursor: 'not-allowed' },
      ])}
      disabled={disabled}
      onClick={() => methods.triggerEvent({ name: 'onClick' })}
      {...properties}
    >
      {(defaultTitle) => (
        <>
          {properties.icon &&
            (
              <Icon
                blockId={`${blockId}_icon`}
                events={events}
                properties={
                  showLoading ? { name: 'AiOutlineLoading3Quarters', spin: true } : properties.icon
                }
              />
            ) + ` `}
          {properties.title || defaultTitle}
        </>
      )}
    </Link>
  );
};

AnchorBlock.defaultProps = blockDefaultProps;
AnchorBlock.meta = {
  category: 'display',
  loading: {
    type: 'SkeletonParagraph',
    properties: {
      lines: 1,
    },
  },
  icons: ['AiOutlineLoading3Quarters'],
  styles: [],
};

export default AnchorBlock;
