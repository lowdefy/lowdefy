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
import { type } from '@lowdefy/helpers';
import { Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-tools';

const itemLink = (item, methods) => {
  if (type.isString(item.pageId)) {
    return (
      <Link to={`/${item.pageId}`} className={methods.makeCssClass(item.linkStyle)}>
        {item.label || item.pageId}
      </Link>
    );
  }
  if (type.isString(item.url)) {
    return (
      <a href={item.url} className={methods.makeCssClass(item.linkStyle)}>
        {item.label || item.url}
      </a>
    );
  }
  return item.label;
};

const BreadcrumbBlock = ({ blockId, properties, methods }) => (
  <Breadcrumb
    id={blockId}
    separator={properties.separator}
    className={methods.makeCssClass(properties.style)}
  >
    {(properties.list || []).map((item, i) => (
      <Breadcrumb.Item key={i}>
        {type.isString(item) ? item : itemLink(item, methods)}
      </Breadcrumb.Item>
    ))}
  </Breadcrumb>
);

BreadcrumbBlock.defaultProps = blockDefaultProps;

export default BreadcrumbBlock;
