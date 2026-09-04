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
import { omit, type } from '@lowdefy/helpers';
import Icon from '@ant-design/icons';
import { blockRootProps, cn, withBlockDefaults, ErrorBoundary } from '@lowdefy/block-utils';

import iconStyles from './style.module.css';

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
  'styles',
  'validation',
];

const createIcon = (Icons) => {
  const formatTitle = (title) => {
    if (!title || !type.isString(title)) {
      return '';
    }
    let spacedTitle = title.replace(/([A-Z])/g, ' $1').trim();
    return spacedTitle.substring(spacedTitle.indexOf(' ') + 1);
  };

  const IconBlock = ({
    blockId,
    classNames = {},
    events,
    methods,
    onClick,
    properties,
    styles = {},
    ...props
  }) => {
    // The registry fills up as each page's icons load, so every lookup —
    // the spinner and the unresolved-name fallback included — is made at
    // render time, never captured when the component was created.
    const AiOutlineLoading3Quarters = Icons['AiOutlineLoading3Quarters'];
    const AiOutlineExclamationCircle = Icons['AiOutlineExclamationCircle'];
    const propertiesObj = type.isString(properties) ? { name: properties } : properties;
    const spin =
      (propertiesObj.spin || events.onClick?.loading) && !propertiesObj.disableLoadingIcon;
    const iconProps = {
      // The icon svg is the root the Icon block owns, so it carries the block
      // root contract: id, data-testid, and both the block and element slots of
      // the app author's class and style. Nothing upstream applies them - the
      // layout wrapper is skipped for a block with no layout.
      ...blockRootProps({
        blockId,
        classNames,
        styles,
        className: cn({ [iconStyles['icon-spin']]: spin }),
        style: { cursor: onClick || events.onClick ? 'pointer' : undefined },
      }),
      rotate: propertiesObj.rotate,
      color: propertiesObj.color,
      title: propertiesObj.title ?? formatTitle(propertiesObj.name),
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
  return withBlockDefaults(AntIcon);
};

export default createIcon;
