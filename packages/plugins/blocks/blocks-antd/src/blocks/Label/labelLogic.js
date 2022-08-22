/*
  Copyright 2020-2022 Lowdefy, Inc

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

import { type } from '@lowdefy/helpers';
import classNames from 'classnames';
import getWrapperCol from './getWrapperCol.js';
import getLabelCol from './getLabelCol.js';

const labelLogic = ({
  blockId,
  content,
  methods,
  properties = {},
  required = false,
  validation = {
    messages: [],
    status: null, // enum: [null, 'success', 'warning', 'error', 'validating']
  },
}) => {
  const wrapperCol = getWrapperCol(properties, properties.inline);
  const labelCol = getLabelCol(properties, properties.inline);

  // render label priority order: content.label area -> properties.title -> blockId and do not render an empty label
  let label = content.label
    ? content.label()
    : !type.isString(properties.title)
    ? blockId
    : properties.title;
  label = label === '' ? null : label;
  // trim colon when colon is set, and the user inputs a colon, because antd class renders a colon
  if (type.isString(label) && properties.colon && label.trim() !== '') {
    label = label.replace(/[:|：]\s*$/, '');
  }
  const rowClassName = classNames({
    [`ant-form-item`]: true,
    [`ant-form-item-with-help`]: false,
    // Status
    [`ant-form-item-has-feedback`]: validation.status && properties.hasFeedback !== false,
    [`ant-form-item-has-success`]: validation.status === 'success',
    [`ant-form-item-has-warning`]: validation.status === 'warning',
    [`ant-form-item-has-error`]: validation.status === 'error',
    [`ant-form-item-is-validating`]: validation.status === 'validating',
    [methods.makeCssClass({
      flexWrap: properties.inline && 'inherit', // wrap extra content below input
      marginBottom: 0,
    })]: true,
  });

  const labelColClassName = classNames({
    [`ant-form-item-label`]: true,
    [`ant-form-item-label-left`]: properties.align === 'left' || !properties.align, // default align left
    [methods.makeCssClass({
      overflow: properties.inline && 'inherit', // wrap label content below input
      whiteSpace: !properties.inline && 'normal', // set label title wrap for long labels
      marginBottom: properties.size === 'small' ? 0 : 8,
      // overflow: 'visible',
    })]: true,
  });

  const labelClassName = classNames({
    [`ant-form-item-required`]: required,
    [`ant-form-item-no-colon`]: properties.colon === false,
    [methods.makeCssClass([
      {
        height: 'fit-content !important',
        minHeight:
          properties.inline &&
          (properties.size === 'large' ? 40 : properties.size === 'small' ? 24 : 32), // set height for inline label to be centered
      },
      properties.style,
    ])]: true,
  });

  const extraClassName = classNames({
    'ant-form-item-explain': true,
    'ant-form-item-extra': true,
    [methods.makeCssClass([
      {
        marginTop: properties.size === 'small' ? -4 : 0, // in size small reduce extra top margin
      },
      properties.extraStyle,
    ])]: true,
  });
  const feedbackClassName = classNames({
    'ant-form-item-explain': true,
    'ant-form-item-extra': true,
    [`ant-form-item-explain-feedback`]: validation.status && properties.hasFeedback !== false,
    [`ant-form-item-explain-success`]: validation.status === 'success',
    [`ant-form-item-explain-warning`]: validation.status === 'warning',
    [`ant-form-item-explain-error`]: validation.status === 'error',
    [`ant-form-item-explain-validating`]: validation.status === 'validating',
    [methods.makeCssClass([
      {
        marginTop: properties.size === 'small' ? -4 : 0, // in size small reduce extra top margin
      },
      properties.feedbackStyle,
    ])]: true,
  });

  const showExtra = !!properties.extra && (!validation.status || validation.status === 'success');
  const showFeedback = validation.status === 'warning' || validation.status === 'error';
  return {
    extraClassName,
    feedbackClassName,
    label: !properties.disabled && label,
    labelClassName,
    labelCol,
    labelColClassName,
    rowClassName,
    showExtra,
    showFeedback,
    wrapperCol,
  };
};

export default labelLogic;
