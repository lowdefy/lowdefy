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
import { type, get } from '@lowdefy/helpers';
import { Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-tools';

import Icon from '../Icon/Icon';

const ItemLink = ({ basePath, link, children, className }) => {
  if (type.isString(link.pageId)) {
    return (
      <Link to={`${basePath}/${link.pageId}`} className={className}>
        {children}
      </Link>
    );
  }
  if (type.isString(link.url)) {
    return (
      <a href={link.url} className={className}>
        {children}
      </a>
    );
  }
  return <span className={className}>{children}</span>;
};

const BreadcrumbBlock = ({ basePath, blockId, events, methods, properties, rename }) => {
  const onClickActionName = get(rename, 'events.onClick', { default: 'onClick' });
  return (
    <Breadcrumb
      id={blockId}
      separator={properties.separator}
      className={methods.makeCssClass(properties.style)}
    >
      {(properties.list || []).map((link, index) => (
        <Breadcrumb.Item
          key={index}
          onClick={
            events[onClickActionName] &&
            (() => methods.triggerEvent({ name: onClickActionName, event: { link, index } }))
          }
        >
          <ItemLink
            basePath={basePath}
            className={methods.makeCssClass([
              {
                cursor: events[onClickActionName] && 'pointer',
              },
              link.style,
            ])}
            link={link}
          >
            {link.icon && (
              <Icon
                blockId={`${blockId}_${index}_icon`}
                events={events}
                properties={{
                  name: type.isString(link.icon) && link.icon,
                  ...(type.isObject(link.icon) ? link.icon : {}),
                  style: { paddingRight: 8, ...(link.icon.style || {}) },
                }}
              />
            )}
            {type.isString(link) ? link : link.label || link.pageId || link.url || `Link ${index}`}
          </ItemLink>
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

BreadcrumbBlock.defaultProps = blockDefaultProps;

export default BreadcrumbBlock;
