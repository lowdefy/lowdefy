/*
  Copyright 2020-2026 Lowdefy, Inc

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
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { Col, Row } from 'antd';
import classNames from 'classnames';
import CSSMotion from '@rc-component/motion';

import labelLogic from './labelLogic.js';
import './style.module.css';

const validationKeyMap = {
  error: 'errors',
  warning: 'warnings',
};

let iconMap;

const Label = ({
  blockId,
  classNames: blockClassNames = {},
  components: { Icon },
  content,
  properties,
  required,
  styles = {},
  validation,
}) => {
  const {
    extraClassName,
    extraStyle,
    feedbackClassName,
    feedbackStyle,
    iconClassName,
    label,
    labelClassName,
    labelCol,
    labelColClassName,
    labelColStyle,
    labelStyle,
    rowClassName,
    rowStyle,
    showExtra,
    showFeedback,
    wrapperCol,
  } = labelLogic({ blockId, blockClassNames, content, properties, required, styles, validation });
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
    <Row id={blockId} className={rowClassName} style={rowStyle}>
      {label && (
        <Col {...labelCol} className={labelColClassName} style={labelColStyle}>
          <label
            htmlFor={`${blockId}_input`}
            className={labelClassName}
            style={labelStyle}
            title={label}
          >
            {renderHtml({ html: label })}
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
              <div className={classNames(extraClassName, motionClassName)} style={extraStyle}>
                {showFeedback ? (
                  <div className={feedbackClassName} style={feedbackStyle}>
                    {validation[validationKeyMap[validation.status]] &&
                      validation[validationKeyMap[validation.status]].length > 0 &&
                      validation[validationKeyMap[validation.status]][0]}
                  </div>
                ) : (
                  renderHtml({ html: properties.extra })
                )}
              </div>
            )}
          </CSSMotion>
        )}
      </Col>
    </Row>
  );
};

export default withBlockDefaults(Label);
