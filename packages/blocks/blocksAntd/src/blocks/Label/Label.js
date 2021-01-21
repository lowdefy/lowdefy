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

// Derived from https://github.com/ant-design/ant-design/blob/master/components/form/FormItemLabel.tsx
// MIT Copyright (c) 2015-present Ant UED, https://xtech.antfin.com/ - 2020-09-08

import React from 'react';
import classNames from 'classnames';
import { blockDefaultProps } from '@lowdefy/block-tools';
import { Col, Row } from 'antd';
import CSSMotion from 'rc-animate/lib/CSSMotion';
import {
  LoadingOutlined,
  CloseCircleFilled,
  CheckCircleFilled,
  ExclamationCircleFilled,
} from '@ant-design/icons';

import 'antd/es/form/style';
import './style.css';
import labelLogic from './labelLogic';

const iconMap = {
  success: CheckCircleFilled,
  warning: ExclamationCircleFilled,
  error: CloseCircleFilled,
  validating: LoadingOutlined,
};

const Label = ({ blockId, content, methods, properties, required, validation }) => {
  const {
    extraClassName,
    feedbackClassName,
    label,
    labelClassName,
    labelCol,
    labelColClassName,
    rowClassName,
    showExtra,
    showFeedback,
    wrapperCol,
  } = labelLogic({ blockId, content, methods, properties, required, validation });
  const IconNode = validation.status && iconMap[validation.status];
  const icon =
    validation.status && IconNode ? (
      <span className="ant-form-item-children-icon">
        <IconNode />
      </span>
    ) : null;

  return (
    <Row id={blockId} className={rowClassName}>
      {label && (
        <Col {...labelCol} className={labelColClassName}>
          <label htmlFor={`${blockId}_input`} className={labelClassName} title={label}>
            {label}
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
        <CSSMotion visible={showFeedback} motionName="show-help" motionAppear removeOnLeave>
          {({ className: motionClassName }) => (
            <div className={classNames(feedbackClassName, motionClassName)}>
              {validation.errors.length > 0
                ? validation.errors[0]
                : validation.warnings.length > 0
                ? validation.warnings[0]
                : ''}
            </div>
          )}
        </CSSMotion>
        {showExtra && <div className={extraClassName}>{properties.extra}</div>}
      </Col>
    </Row>
  );
};

Label.defaultProps = blockDefaultProps;

export default Label;
