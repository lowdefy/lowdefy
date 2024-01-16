/* eslint-disable no-undef */
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

const breakpoints = {
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1600,
};
const mediaReact = {
  xs: `@media screen and (maxWidth: ${breakpoints.xs}px)`,
  sm: `@media screen and (minWidth: ${breakpoints.xs}px)`,
  md: `@media screen and (minWidth: ${breakpoints.sm}px)`,
  lg: `@media screen and (minWidth: ${breakpoints.md}px)`,
  xl: `@media screen and (minWidth: ${breakpoints.lg}px)`,
  xxl: `@media screen and (minWidth: ${breakpoints.xl}px)`,
};
const media = {
  xs: `@media screen and (max-width: ${breakpoints.xs}px)`,
  sm: `@media screen and (min-width: ${breakpoints.xs}px)`,
  md: `@media screen and (min-width: ${breakpoints.sm}px)`,
  lg: `@media screen and (min-width: ${breakpoints.md}px)`,
  xl: `@media screen and (min-width: ${breakpoints.lg}px)`,
  xxl: `@media screen and (min-width: ${breakpoints.xl}px)`,
};
const mediaRegex = /@media\s+(xs|sm|md|lg|xl|xxl)\s*{/gm;
const setReplacer = (_, group) => media[group] + ' {';

const mediaToCssObject = (styles, styleObjectOnly) => {
  if (type.isString(styles)) {
    return styles.replace(mediaRegex, setReplacer);
  }
  let styleObjects = styles;
  if (type.isObject(styles)) {
    styleObjects = [styles];
  }
  if (!type.isArray(styleObjects)) {
    return [];
  }
  return styleObjects.map((style) => {
    if (type.isString(style)) {
      return style.replace(mediaRegex, setReplacer);
    }
    if (!type.isObject(style)) {
      return {};
    }
    let mq = media;
    if (styleObjectOnly) {
      mq = mediaReact;
    }
    const { xs, sm, md, lg, xl, xxl, ...others } = style;
    if (xs) {
      others[mq.xs] = xs;
    }
    if (sm) {
      others[mq.sm] = sm;
    }
    if (md) {
      others[mq.md] = md;
    }
    if (lg) {
      others[mq.lg] = lg;
    }
    if (xl) {
      others[mq.xl] = xl;
    }
    if (xxl) {
      others[mq.xxl] = xxl;
    }
    return others;
  });
};

export default mediaToCssObject;
