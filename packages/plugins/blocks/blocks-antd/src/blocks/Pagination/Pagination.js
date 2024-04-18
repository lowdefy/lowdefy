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

import React, { useState, useEffect } from 'react';
import { blockDefaultProps } from '@lowdefy/block-utils';
import { Pagination } from 'antd';
import { type } from '@lowdefy/helpers';

const createChangeHandler =
  ({ eventName, methods, setState }) =>
  (current, pageSize) => {
    setState({ current, pageSize, skip: (current - 1) * pageSize });
    methods.setValue({ current, pageSize, skip: (current - 1) * pageSize });
    methods.triggerEvent({
      name: eventName,
      event: { current, pageSize, skip: current * pageSize },
    });
  };

const calculateState = ({ defaultCurrent, defaultPageSize, value }) => {
  const state = {
    current: type.isInt(value?.current) ? value?.current : defaultCurrent,
    pageSize: type.isInt(value?.pageSize) ? value?.pageSize : defaultPageSize,
  };
  state.skip = (state.current - 1) * state.pageSize;
  return state;
};

const PaginationBlock = ({ blockId, loading, methods, properties, value }) => {
  const [state, setState] = useState(() =>
    calculateState({
      defaultCurrent: 1,
      defaultPageSize: properties.pageSizeOptions?.[0] ?? 10,
      value,
    })
  );
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(state)) {
      const nextState = calculateState({
        defaultCurrent: state.current,
        defaultPageSize: state.pageSize,
        value,
      });
      setState(nextState);
      methods.setValue({ ...nextState });
    }
  }, [value]);
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
      onChange={createChangeHandler({ eventName: 'onChange', methods, setState })}
      onShowSizeChange={createChangeHandler({ eventName: 'onSizeChange', methods, setState })}
      pageSize={state.pageSize}
      pageSizeOptions={properties.pageSizeOptions || [10, 20, 30, 40]}
      showQuickJumper={properties.showQuickJumper}
      showSizeChanger={properties.showSizeChanger}
      showTotal={showTotal}
      simple={!!properties.simple}
      size={properties.size}
      total={properties.total !== undefined ? properties.total : 100}
      current={state.current}
    />
  );
};
PaginationBlock.defaultProps = blockDefaultProps;
PaginationBlock.meta = {
  valueType: 'object',
  initValue: {
    current: 1,
  },
  category: 'input',
  icons: [],
  styles: ['blocks/Pagination/style.less'],
};
export default PaginationBlock;
