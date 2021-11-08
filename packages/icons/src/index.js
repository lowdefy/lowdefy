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
import { AiOutlineLoading3Quarters, AiOutlineExclamationCircle } from 'react-icons/ai';
import { ErrorBoundary, blockDefaultProps } from '@lowdefy/block-tools';
import { omit, type } from '@lowdefy/helpers';

const lowdefyProps = [
  'actionLog',
  'basePath',
  'content',
  'eventLog',
  'homePageId',
  'list',
  'loading',
  'menus',
  'pageId',
  'registerEvent',
  'registerMethod',
  'schemaErrors',
  'user',
  'validation',
];

// const spinClass = `.fa-spin {
//   animation: fa-spin 2s infinite linear;
// }
// @keyframes fa-spin {
//   0% {
//     transform: rotate(0deg);
//   }
//   100% {
//     transform: rotate(359deg);
//   }
// }`

const Icon =
  (Icons) =>
  ({ blockId, events, methods, properties, ...props }) => {
    const propertiesObj = type.isString(properties) ? { name: properties } : properties;
    const iconProps = {
      id: blockId,
      className: methods.makeCssClass(propertiesObj.style),
      rotate: propertiesObj.rotate,
      spin: propertiesObj.spin,
      twoToneColor: propertiesObj.color,
      ...omit(props, lowdefyProps),
    };
    const IconComp = Icons[propertiesObj];
    if (!IconComp) {
      propertiesObj.name = 'CloseCircleOutlined';
    }
    return (
      <>
        {events.onClick && events.onClick.loading && !propertiesObj.disableLoadingIcon ? (
          <AiOutlineLoading3Quarters {...{ ...iconProps, spin: true }} />
        ) : (
          <ErrorBoundary fallback={() => <AiOutlineExclamationCircle {...iconProps} />}>
            <IconComp
              id={blockId}
              onClick={
                events.onClick &&
                (() =>
                  methods.triggerEvent({
                    name: 'onClick',
                  }))
              }
              style={{ color: propertiesObj.color }}
              size={propertiesObj.size}
              title={propertiesObj.title}
              {...iconProps} // spread props for to populate props from parent
            />
          </ErrorBoundary>
        )}
      </>
    );
  };

Icon.defaultProps = blockDefaultProps;

export default Icon;
