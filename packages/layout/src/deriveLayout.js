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

import { type } from '@lowdefy/helpers';

const sanitizeGrow = (value) => {
  if (value === 'unset' || value === 'inherit' || value === 'initial') {
    return value;
  }
  if (type.isNumber(value) && value >= 0) {
    return value;
  }
  if (value === true) {
    return 1;
  }
  if (value === false) {
    return 0;
  }
  return 0;
};

const sanitizeShrink = (value) => {
  if (value === 'unset' || value === 'inherit' || value === 'initial') {
    return value;
  }
  if (type.isNumber(value) && value >= 0) {
    return value;
  }
  if (value === true) {
    return 1;
  }
  if (value === false) {
    return 0;
  }
  return 1;
};

const sanitizeSize = (value) => {
  if (type.isNumber(value)) {
    return `${value}px`;
  }
  if (type.isString(value)) {
    return value;
  }
  return 'auto';
};

const deriveFlex = ({ flex, grow, shrink, size }) => {
  if (type.isNone(flex) && type.isNone(grow) && type.isNone(shrink) && type.isNone(size)) {
    return false;
  }
  if (flex) {
    return flex === true ? '0 1 auto' : flex;
  }
  return `${sanitizeGrow(grow)} ${sanitizeShrink(shrink)} ${sanitizeSize(size)}`;
};

const diffOffsetAndSpan = (obj) => {
  if (obj.offset && !obj.span) {
    obj.span = 24 - obj.offset;
    return obj;
  }
  if (!obj.span) {
    obj.span = 24;
  }
  return obj;
};

const deriveLayout = ({
  flex,
  offset,
  order,
  pull,
  push,
  span,
  grow,
  shrink,
  size,
  xs,
  sm,
  md,
  lg,
  xl,
  xxl,
}) => {
  let colProps = {
    xs: { span: 24 },
    sm: { span: 24 },
    md: diffOffsetAndSpan({ offset, order, pull, push, span }),
  };
  const flexValue = deriveFlex({ flex, grow, shrink, size });
  if (flexValue) {
    colProps = { flex: flexValue, order };
  }
  if (type.isObject(sm)) {
    colProps.sm = { ...colProps.sm, ...diffOffsetAndSpan(sm) };
    colProps.xs = { ...colProps.xs, ...diffOffsetAndSpan(sm) };
  }
  if (type.isObject(xs)) {
    colProps.xs = { ...colProps.xs, ...diffOffsetAndSpan(xs) };
  }
  if (type.isObject(md)) {
    colProps.md = { ...colProps.md, ...diffOffsetAndSpan(md) };
  }
  if (type.isObject(lg)) {
    colProps.lg = diffOffsetAndSpan(lg);
  }
  if (type.isObject(xl)) {
    colProps.xl = diffOffsetAndSpan(xl);
  }
  if (type.isObject(xxl)) {
    colProps.xxl = diffOffsetAndSpan(xxl);
  }
  return colProps;
};
export default deriveLayout;
