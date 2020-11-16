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

import React from 'react';
import { get, type } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-tools';

import Icon from '../Icon/Icon';

const Strong = ({ children, strong }) => (strong ? <b>{children}</b> : <>{children}</>);
const Tag = ({ children, className, disabled, onClick }) =>
  disabled ? (
    <span className={className}>{children}</span>
  ) : (
    <a className={className} onClick={onClick}>
      {children}
    </a>
  );

const AnchorBlock = ({ actions, blockId, loading, methods, properties }) => {
  const title = type.isNone(properties.title) ? blockId : properties.title;
  const showLoading = get(actions, 'onClick.loading') || loading;
  const disabled = properties.disabled || showLoading;
  return (
    <Tag
      className={methods.makeCssClass([
        properties.style,
        disabled && { color: '#BEBEBE', cursor: 'not-allowed' },
      ])}
      disabled={disabled}
      onClick={() => methods.callAction({ action: 'onClick' })}
    >
      <Strong strong={properties.strong}>
        {properties.icon && (
          <Icon
            methods={methods}
            properties={showLoading ? { name: 'LoadingOutlined', spin: true } : properties.icon}
          />
        )}
        {` ${title}`}
      </Strong>
    </Tag>
  );
};

AnchorBlock.defaultProps = blockDefaultProps;

export default AnchorBlock;
