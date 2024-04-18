/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { omit, type } from '@lowdefy/helpers';
import Icon from '@ant-design/icons';
import { blockDefaultProps, ErrorBoundary, makeCssClass } from '@lowdefy/block-utils';

const lowdefyProps = [
  'actionLog',
  'basePath',
  'components',
  'content',
  'eventLog',
  'list',
  'loading',
  'menus',
  'pageId',
  'registerEvent',
  'registerMethod',
  'schemaErrors',
  'validation',
];

const createIcon = (Icons) => {
  const AiOutlineLoading3Quarters = Icons['AiOutlineLoading3Quarters'];
  const AiOutlineExclamationCircle = Icons['AiOutlineExclamationCircle'];

  const IconBlock = ({ blockId, events, methods, onClick, properties, ...props }) => {
    const propertiesObj = type.isString(properties) ? { name: properties } : properties;
    const spin =
      (propertiesObj.spin || events.onClick?.loading) && !propertiesObj.disableLoadingIcon;
    const iconProps = {
      id: blockId,
      className: classNames({
        [makeCssClass([{ cursor: (onClick || events.onClick) && 'pointer' }, propertiesObj.style])]:
          true,
        'icon-spin': spin,
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
        {spin ? (
          <AiOutlineLoading3Quarters {...iconProps} />
        ) : (
          <ErrorBoundary
            fallback={() => <AiOutlineExclamationCircle {...{ ...iconProps, color: '#F00' }} />}
          >
            <IconComp
              id={blockId}
              onClick={
                onClick ||
                (events.onClick &&
                  (() =>
                    methods.triggerEvent({
                      name: 'onClick',
                    })))
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
  const AntIcon = (all) => <Icon component={() => <IconBlock {...all} />} />;
  AntIcon.defaultProps = blockDefaultProps;
  return AntIcon;
};

export default createIcon;
