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

// Derived from https://github.com/ant-design/ant-design/blob/master/components/form/FormItemLabel.tsx
// MIT Copyright (c) 2015-present Ant UED, https://xtech.antfin.com/ - 2020-09-08

import React from 'react';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';
import { Col, Row } from 'antd';
import classNames from 'classnames';
import CSSMotion from 'rc-motion';

import labelLogic from './labelLogic.js';

const validationKeyMap = {
  error: 'errors',
  warning: 'warnings',
};

let iconMap;

const Label = ({
  blockId,
  components: { Icon },
  content,
  methods,
  properties,
  required,
  validation,
}) => {
  const {
    extraClassName,
    feedbackClassName,
    iconClassName,
    label,
    labelClassName,
    labelCol,
    labelColClassName,
    rowClassName,
    showExtra,
    showFeedback,
    wrapperCol,
  } = labelLogic({ blockId, content, methods, properties, required, validation });
  if (!iconMap) {
    iconMap = {
      error: () => <Icon properties="AiFillCloseCircle" />,
      success: () => <Icon properties="AiFillCheckCircle" />,
      validating: () => <Icon properties="AiOutlineLoading" />,
      warning: () => <Icon properties="AiFillExclamationCircle" />,
    };
  }
  const IconNode = validation.status && iconMap[validation.status];
  const icon =
    validation.status && IconNode ? (
      <span className={iconClassName}>
        <IconNode />
      </span>
    ) : null;

  return (
    <Row id={blockId} className={rowClassName}>
      {label && (
        <Col {...labelCol} className={labelColClassName}>
          <label htmlFor={`${blockId}_input`} className={labelClassName} title={label}>
            {renderHtml({ html: label, methods })}
          </label>
        </Col>
      )}
      <Col {...wrapperCol} className="ant-form-item-control">
        <div className="ant-form-item-control-input">
          <div className="ant-form-item-control-input-content">
            {content.content && content.content()}
          </div>
          {icon}
        </div>
        {(showFeedback || showExtra) && (
          <CSSMotion
            visible={showFeedback || showExtra}
            motionName="show-help"
            motionAppear
            removeOnLeave
          >
            {({ className: motionClassName }) => (
              <div className={classNames(extraClassName, motionClassName)}>
                {showFeedback ? (
                  <div className={classNames(feedbackClassName)}>
                    {validation[validationKeyMap[validation.status]] &&
                      validation[validationKeyMap[validation.status]].length > 0 &&
                      validation[validationKeyMap[validation.status]][0]}
                  </div>
                ) : (
                  renderHtml({ html: properties.extra, methods })
                )}
              </div>
            )}
          </CSSMotion>
        )}
      </Col>
    </Row>
  );
};

Label.defaultProps = blockDefaultProps;
Label.meta = {
  category: 'container',
  icons: ['AiFillCloseCircle', 'AiFillCheckCircle', 'AiOutlineLoading', 'AiFillExclamationCircle'],
  styles: ['blocks/Label/style.less'],
};

export default Label;
