/*
  Copyright 2020 Lowdefy, Inc

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
import { omit, serializer, type } from '@lowdefy/helpers';

const lowdefyProps = [
  'content',
  'homePageId',
  'list',
  'loading',
  'loading',
  'menus',
  'pageId',
  'registerAction',
  'registerAction',
  'registeredMethods',
  'registerMethod',
  'registerMethod',
  'schemaErrors',
  'user',
  'validation',
];
const IconBlock = ({ actions, blockId, methods, properties, ...props }) => {
  let propertiesCopy = serializer.copy(properties);
  if (type.isString(propertiesCopy)) {
    propertiesCopy = { name: propertiesCopy };
  }
  if (!type.isString(propertiesCopy.name)) {
    propertiesCopy.name = 'CloseCircleOutlined';
  }
  const iconProps = {
    id: blockId,
    className: methods.makeCssClass([
      { color: propertiesCopy.color, fontSize: propertiesCopy.size },
      properties.style,
    ]),
    rotate: propertiesCopy.rotate,
    spin: propertiesCopy.spin,
    twoToneColor: propertiesCopy.color,
    ...omit(props, lowdefyProps),
  };
  const IconComp = memo(lazy(() => import(`./icons/${propertiesCopy.name}`)));
  return (
    <>
      {actions.onClick && actions.onClick.loading && !propertiesCopy.disableLoadingIcon ? (
        <Loading3QuartersOutlined {...{ ...iconProps, spin: true }} />
      ) : (
        <ErrorBoundary fallback={<ExclamationCircleOutlined {...iconProps} />}>
          <Suspense fallback={<Loading3QuartersOutlined {...{ ...iconProps, spin: true }} />}>
            <IconComp
              id={blockId}
              onClick={
                actions.onClick &&
                (() =>
                  methods.callAction({
                    action: 'onClick',
                  }))
              }
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
