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
import { Pagination } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-tools';
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

const PaginationBlock = ({ blockId, methods, properties, value }) => {
  return (
    <Pagination
      id={blockId}
      onShowSizeChange={createChangeHandler({ eventName: 'onSizeChange', methods })}
      onChange={createChangeHandler({ eventName: 'onChange', methods })}
      total={properties.total !== undefined ? properties.total : 100}
      size={properties.size}
      simple={!!properties.simple}
      showTotal={
        properties.showTotal && ((total, range) => `${range[0]}-${range[1]} of ${total} items`)
      }
      showSizeChanger={properties.showSizeChanger}
      showQuickJumper={properties.showQuickJumper}
      pageSizeOptions={properties.pageSizeOptions || [10, 20, 30, 40]}
      hideOnSinglePage={properties.hideOnSinglePage}
      disabled={properties.disabled}
      pageSize={getPageSize({ properties, value })}
      current={
        type.isNone(value) || !type.isObject(value) || !type.isNumber(value.current)
          ? 1
          : value.current
      }
    />
  );
};

PaginationBlock.defaultProps = blockDefaultProps;

export default PaginationBlock;
