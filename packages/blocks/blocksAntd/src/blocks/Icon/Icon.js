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

import React, { lazy, Suspense, memo } from 'react';
import { Loading3QuartersOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { ErrorBoundary, blockDefaultProps } from '@lowdefy/block-tools';
import { omit, type } from '@lowdefy/helpers';

const lowdefyProps = [
  'actionLog',
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

const IconBlock = ({ blockId, events, methods, properties, ...props }) => {
  const propertiesObj = type.isString(properties) ? { name: properties } : properties;
  if (!type.isString(propertiesObj.name)) {
    propertiesObj.name = 'CloseCircleOutlined';
  }
  const iconProps = {
    id: blockId,
    className: methods.makeCssClass(propertiesObj.style),
    rotate: propertiesObj.rotate,
    spin: propertiesObj.spin,
    twoToneColor: propertiesObj.color,
    ...omit(props, lowdefyProps),
  };
  const IconComp = memo(lazy(() => import(`./icons/${propertiesObj.name}`)));
  return (
    <>
      {events.onClick && events.onClick.loading && !propertiesObj.disableLoadingIcon ? (
        <Loading3QuartersOutlined {...{ ...iconProps, spin: true }} />
      ) : (
        <ErrorBoundary fallback={() => <ExclamationCircleOutlined {...iconProps} />}>
          <Suspense fallback={<Loading3QuartersOutlined {...{ ...iconProps, spin: true }} />}>
            <IconComp
              id={blockId}
              onClick={
                events.onClick &&
                (() =>
                  methods.triggerEvent({
                    name: 'onClick',
                  }))
              }
              style={{ color: propertiesObj.color, fontSize: propertiesObj.size }}
              {...iconProps} // spread props for Ant design to populate props from parent
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
};

IconBlock.defaultProps = blockDefaultProps;

export default IconBlock;
