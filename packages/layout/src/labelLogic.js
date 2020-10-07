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

import get from '@lowdefy/get';
import type from '@lowdefy/type';
import classNames from 'classnames';
import getWrapperCol from './getWrapperCol.js';
import getLabelCol from './getLabelCol.js';

const labelLogic = ({
  blockId,
  content,
  methods,
  properties = {},
  required = false,
  validate = [],
  validated = false,
}) => {
  const wrapperCol = getWrapperCol(properties, properties.inline);
  const labelCol = getLabelCol(properties, properties.inline);
  const validateStatus =
    validated && validate.length === 0
      ? 'success'
      : validate.length !== 0 && !get({ v: validate }, 'v.0.status')
      ? 'error'
      : validate.length !== 0 &&
        get({ v: validate }, 'v.0.status') &&
        get({ v: validate }, 'v.0.status') !== 'info'
      ? get({ v: validate }, 'v.0.status')
      : null;

  // render label priority order: content.label area -> properties.title -> blockId and do not render an empty label
  let label = content.label
    ? content.label()
    : !type.isString(properties.title)
    ? blockId
    : properties.title;
  label = label === '' ? null : label;

  // trim colon when colon is set, and the user inputs a colon, because antd class renders a colon
  if (label && properties.colon && label.trim() !== '') {
    label = label.replace(/[:|：]\s*$/, '');
  }
  const rowClassName = classNames({
    [`ant-form-item`]: true,
    [`ant-form-item-with-help`]: false,
    // Status
    [`ant-form-item-has-feedback`]: validateStatus && properties.hasFeedback !== false,
    [`ant-form-item-has-success`]: validateStatus === 'success',
    [`ant-form-item-has-warning`]: validateStatus === 'warning',
    [`ant-form-item-has-error`]: validateStatus === 'error',
    [`ant-form-item-is-validating`]: validateStatus === 'validating',
    [methods.makeCss({
      flexWrap: properties.inline && 'inherit', // wrap extra content below input
    })]: true,
  });

  const labelColClassName = classNames(
    `ant-form-item-label`,
    (properties.align === 'left' || !properties.align) && `ant-form-item-label-left` // default align left
  );

  const labelClassName = classNames({
    [`ant-form-item-required`]: required,
    [`ant-form-item-no-colon`]: properties.colon === false,
    [methods.makeCss(properties.style)]: true,
  });

  const extraClassName = classNames(
    'ant-form-item-extra',
    methods.makeCss([
      {
        marginTop: properties.size === 'small' ? -4 : 0, // in size small reduce extra top margin
      },
      properties.extraStyle,
    ])
  );
  return {
    extraClassName,
    label: !properties.disabled && label,
    labelClassName,
    labelCol,
    labelColClassName,
    rowClassName,
    validateStatus: properties.hasFeedback !== false && validateStatus,
    wrapperCol,
  };
};

export default labelLogic;
