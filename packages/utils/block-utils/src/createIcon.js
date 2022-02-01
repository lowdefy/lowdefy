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
import classNames from 'classnames';
import { keyframes } from '@emotion/react';
import { css } from '@emotion/css';
import { omit, type } from '@lowdefy/helpers';

import blockDefaultProps from './blockDefaultProps.js';
import ErrorBoundary from './ErrorBoundary.js';
import makeCssClass from './makeCssClass.js';

const lowdefyProps = [
  'actionLog',
  'basePath',
  'components',
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

const spin = keyframes`{
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(359deg);
  }
}`;

const spinClass = css`
  animation: ${spin} 2s infinite linear;
`;

const createIcon = (Icons) => {
  const AiOutlineLoading3Quarters = Icons['AiOutlineLoading3Quarters'];
  const AiOutlineExclamationCircle = Icons['AiOutlineExclamationCircle'];

  const IconBlock = ({ blockId, events, methods, properties, ...props }) => {
    const propertiesObj = type.isString(properties) ? { name: properties } : properties;
    const iconProps = {
      id: blockId,
      className: classNames({
        [makeCssClass(propertiesObj.style)]: true,
        [spinClass]: propertiesObj.spin,
      }),
      rotate: propertiesObj.rotate,
      color: propertiesObj.color,
      title: propertiesObj.name,
      size: propertiesObj.size,
      // twoToneColor: propertiesObj.color, // TODO: track https://github.com/react-icons/react-icons/issues/508
      ...omit(props, lowdefyProps),
    };
    let IconComp = Icons[propertiesObj.name];
    if (!IconComp) {
      IconComp = AiOutlineExclamationCircle;
    }
    return (
      <>
        {events.onClick && events.onClick.loading && !propertiesObj.disableLoadingIcon ? (
          <AiOutlineLoading3Quarters {...{ ...iconProps, spin: true }} />
        ) : (
          <ErrorBoundary
            fallback={() => <AiOutlineExclamationCircle {...{ ...iconProps, color: '#F00' }} />}
          >
            <IconComp
              id={blockId}
              onClick={
                events.onClick &&
                (() =>
                  methods.triggerEvent({
                    name: 'onClick',
                  }))
              }
              size={propertiesObj.size}
              title={propertiesObj.title}
              {...iconProps} // spread props for to populate props from parent
            />
          </ErrorBoundary>
        )}
      </>
    );
  };
  IconBlock.defaultProps = blockDefaultProps;
  return IconBlock;
};

export default createIcon;
