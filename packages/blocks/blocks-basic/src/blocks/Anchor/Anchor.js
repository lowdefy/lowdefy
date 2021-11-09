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

// TODO move to basic, use link, fix icon
import React from 'react';
import { get, type } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-utils';

const Strong = ({ children, strong }) => (strong ? <b>{children}</b> : <>{children}</>);
const Tag = ({ blockId, children, className, disabled, href, newTab, rel, onClick }) =>
  disabled ? (
    <span id={blockId} className={className}>
      {children}
    </span>
  ) : (
    <a
      id={blockId}
      className={className}
      href={href}
      onClick={onClick}
      rel={rel || 'noopener noreferrer'}
      target={newTab ? '_blank' : '_self'}
    >
      {children}
    </a>
  );

const AnchorBlock = ({ blockId, events, Icon, loading, methods, properties }) => {
  const title = type.isNone(properties.title)
    ? type.isNone(properties.href)
      ? properties.href
      : blockId
    : properties.title;
  const showLoading = get(events, 'onClick.loading') || loading;
  const disabled = properties.disabled || showLoading;
  return (
    <Tag
      blockId={blockId}
      className={methods.makeCssClass([
        properties.style,
        disabled && { color: '#BEBEBE', cursor: 'not-allowed' },
      ])}
      disabled={disabled}
      href={properties.href}
      rel={properties.rel}
      newTab={properties.newTab}
      onClick={() => methods.triggerEvent({ name: 'onClick' })}
    >
      <Strong strong={properties.strong}>
        {properties.icon && (
          <Icon
            blockId={`${blockId}_icon`}
            events={events}
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
