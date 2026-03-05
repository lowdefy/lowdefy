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

const resolveSpan = (span, offset) => {
  if (type.isNone(span)) {
    return offset ? 24 - offset : 24;
  }
  return span;
};

const applyBreakpoint = (cssVars, classes, bp, obj) => {
  const suffix = bp ? `-${bp}` : '';
  const span = resolveSpan(obj.span, obj.offset);

  cssVars[`--lf-display${suffix}`] = span === 0 ? 'none' : 'initial';
  cssVars[`--lf-span${suffix}`] = span;

  if (!type.isNone(obj.offset)) cssVars[`--lf-offset${suffix}`] = obj.offset;
  if (!type.isNone(obj.order)) cssVars[`--lf-order${suffix}`] = obj.order;
  if (!type.isNone(obj.push)) {
    cssVars[`--lf-push${suffix}`] = obj.push;
    if (!classes.includes('lf-col-push')) classes.push('lf-col-push');
  }
  if (!type.isNone(obj.pull)) {
    cssVars[`--lf-pull${suffix}`] = obj.pull;
    if (!classes.includes('lf-col-pull')) classes.push('lf-col-pull');
  }
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
  '2xl': bp2xl,
}) => {
  const flexValue = deriveFlex({ flex, grow, shrink, size });
  if (flexValue) {
    return {
      className: '',
      style: { flex: flexValue, order },
    };
  }

  const classes = ['lf-col'];
  const cssVars = {};

  // Base (xs): always full width
  cssVars['--lf-span'] = 24;

  // md: uses top-level span/offset/order/push/pull
  // Always emit --lf-span-md to break the CSS var() fallback chain
  const mdSpan = resolveSpan(span, offset);
  cssVars['--lf-span-md'] = mdSpan;
  if (mdSpan === 0) cssVars['--lf-display-md'] = 'none';
  if (!type.isNone(offset)) cssVars['--lf-offset-md'] = offset;
  if (!type.isNone(order)) cssVars['--lf-order-md'] = order;
  if (!type.isNone(push)) {
    cssVars['--lf-push-md'] = push;
    classes.push('lf-col-push');
  }
  if (!type.isNone(pull)) {
    cssVars['--lf-pull-md'] = pull;
    classes.push('lf-col-pull');
  }

  // sm: cascades down to xs (base vars) AND sets -sm vars
  if (type.isObject(sm)) {
    const smObj = { ...sm };
    const smSpan = resolveSpan(smObj.span, smObj.offset);
    cssVars['--lf-span'] = smSpan;
    cssVars['--lf-display'] = smSpan === 0 ? 'none' : 'initial';
    if (!type.isNone(smObj.offset)) cssVars['--lf-offset'] = smObj.offset;
    if (!type.isNone(smObj.order)) cssVars['--lf-order'] = smObj.order;
    if (!type.isNone(smObj.push)) {
      cssVars['--lf-push'] = smObj.push;
      if (!classes.includes('lf-col-push')) classes.push('lf-col-push');
    }
    if (!type.isNone(smObj.pull)) {
      cssVars['--lf-pull'] = smObj.pull;
      if (!classes.includes('lf-col-pull')) classes.push('lf-col-pull');
    }
    applyBreakpoint(cssVars, classes, 'sm', smObj);
  }

  // xs: applied AFTER sm, overrides the sm→xs cascade
  if (type.isObject(xs)) {
    applyBreakpoint(cssVars, classes, null, { ...xs });
  }

  // md override: spread-merge with baseline
  if (type.isObject(md)) {
    applyBreakpoint(cssVars, classes, 'md', {
      offset,
      order,
      push,
      pull,
      ...md,
    });
  }

  // lg, xl, 2xl: direct assignment — no baseline merge
  if (type.isObject(lg)) applyBreakpoint(cssVars, classes, 'lg', lg);
  if (type.isObject(xl)) applyBreakpoint(cssVars, classes, 'xl', xl);
  if (type.isObject(bp2xl)) applyBreakpoint(cssVars, classes, '2xl', bp2xl);

  return {
    className: classes.join(' '),
    style: cssVars,
  };
};
export default deriveLayout;
