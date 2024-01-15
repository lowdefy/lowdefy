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
import { blockDefaultProps } from '@lowdefy/block-utils';
import { Pagination } from 'antd';
import { type } from '@lowdefy/helpers';

const getPageSize = ({ properties, value }) => {
  if (type.isObject(value) && type.isNumber(value.pageSize)) {
    return value.pageSize;
  }
  if (type.isArray(properties.pageSizeOptions)) {
    return properties.pageSizeOptions[0];
  }
  return 10;
};

const createChangeHandler =
  ({ eventName, methods }) =>
  (current, pageSize) => {
    methods.setValue({ current, pageSize, skip: (current - 1) * pageSize });
    methods.triggerEvent({
      name: eventName,
      event: { current, pageSize, skip: current * pageSize },
    });
  };

const PaginationBlock = ({ blockId, loading, methods, properties, value }) => {
  const showTotal = type.isFunction(properties.showTotal)
    ? properties.showTotal
    : (total, range) => {
        if (type.isString(properties.showTotal)) {
          return properties.showTotal;
        }
        if (total === 0) {
          return 'No items';
        }
        return `${range[0]}-${range[1]} of ${total} items`;
      };
  return (
    <Pagination
      id={blockId}
      disabled={properties.disabled || loading}
      hideOnSinglePage={properties.hideOnSinglePage}
      onChange={createChangeHandler({ eventName: 'onChange', methods })}
      onShowSizeChange={createChangeHandler({ eventName: 'onSizeChange', methods })}
      pageSize={getPageSize({ properties, value })}
      pageSizeOptions={properties.pageSizeOptions || [10, 20, 30, 40]}
      showQuickJumper={properties.showQuickJumper}
      showSizeChanger={properties.showSizeChanger}
      showTotal={showTotal}
      simple={!!properties.simple}
      size={properties.size}
      total={properties.total !== undefined ? properties.total : 100}
      current={
        type.isNone(value) || !type.isObject(value) || !type.isNumber(value.current)
          ? 1
          : value.current
      }
    />
  );
};

PaginationBlock.defaultProps = blockDefaultProps;
PaginationBlock.meta = {
  valueType: 'object',
  initValue: {
    current: 0,
    pageSize: 10,
    skip: 0,
  },
  category: 'input',
  icons: [],
  styles: ['blocks/Pagination/style.less'],
};

export default PaginationBlock;
