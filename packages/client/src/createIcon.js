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
import { cn, withBlockDefaults, ErrorBoundary } from '@lowdefy/block-utils';

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
  const AiOutlineLoading3Quarters = Icons['AiOutlineLoading3Quarters'];
  const AiOutlineExclamationCircle = Icons['AiOutlineExclamationCircle'];

  const formatTitle = (title) => {
    if (!title || !type.isString(title)) {
      return '';
    }
    // Semantic names (edit, more-vertical) read as words: "Edit", "More vertical".
    if (/^[a-z]/.test(title)) {
      const words = title.replace(/-/g, ' ');
      return words.charAt(0).toUpperCase() + words.slice(1);
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
    const propertiesObj = type.isString(properties) ? { name: properties } : properties;
    const spin =
      (propertiesObj.spin || events.onClick?.loading) && !propertiesObj.disableLoadingIcon;
    const iconProps = {
      id: blockId,
      className: cn(classNames.element, { [iconStyles['icon-spin']]: spin }),
      style: {
        cursor: onClick || events.onClick ? 'pointer' : undefined,
        ...styles.element,
      },
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
    const triggerClick = events.onClick && (() => methods.triggerEvent({ name: 'onClick' }));
    return (
      <>
        {spin ? (
          <AiOutlineLoading3Quarters {...iconProps} />
        ) : (
          <ErrorBoundary
            // Keyed so an icon that failed recovers when its name changes.
            key={propertiesObj.name}
            fallback={() => <AiOutlineExclamationCircle {...{ ...iconProps, color: '#F00' }} />}
          >
            <IconComp
              id={blockId}
              onClick={onClick || triggerClick}
              size={propertiesObj.size}
              title={propertiesObj.title}
              {...iconProps} // spread props for to populate props from parent
            />
          </ErrorBoundary>
        )}
      </>
    );
  };
  // antd's Icon renders `component` with React.createElement, so the component
  // must keep its identity across renders or React remounts the <svg> every
  // time. The per-render props travel through a render-function child instead.
  const IconHost = ({ children }) => children();
  const AntIcon = (all) => <Icon component={IconHost}>{() => <IconBlock {...all} />}</Icon>;
  return withBlockDefaults(AntIcon);
};

export default createIcon;
