/* eslint-disable no-undef */
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

export const breakpoints = [576, 768, 992, 1200, 1600];

export const mq = [
  {
    name: 'xs',
    breakpoints: breakpoints[0],
    media: `@media screen and (max-width: ${breakpoints[0]}px)`,
    mediaReact: `@media screen and (maxWidth: ${breakpoints[0]}px)`,
  },
  {
    name: 'sm',
    breakpoints: breakpoints[0],
    media: `@media screen and (min-width: ${breakpoints[0]}px)`,
    mediaReact: `@media screen and (minWidth: ${breakpoints[0]}px)`,
  },
  {
    name: 'md',
    breakpoints: breakpoints[1],
    media: `@media screen and (min-width: ${breakpoints[1]}px)`,
    mediaReact: `@media screen and (minWidth: ${breakpoints[1]}px)`,
  },
  {
    name: 'lg',
    breakpoints: breakpoints[2],
    media: `@media screen and (min-width: ${breakpoints[2]}px)`,
    mediaReact: `@media screen and (minWidth: ${breakpoints[2]}px)`,
  },
  {
    name: 'xl',
    breakpoints: breakpoints[3],
    media: `@media screen and (min-width: ${breakpoints[3]}px)`,
    mediaReact: `@media screen and (minWidth: ${breakpoints[3]}px)`,
  },
  {
    name: 'xxl',
    breakpoints: breakpoints[4],
    media: `@media screen and (min-width: ${breakpoints[4]}px)`,
    mediaReact: `@media screen and (minWidth: ${breakpoints[4]}px)`,
  },
];

const mediaToCssObject = (obj, options) => {
  // ES2015 key order matters.
  const result = [];
  const media = (options || {}).react ? 'mediaReact' : 'media';
  Object.keys(obj || {}).forEach((key) => {
    switch (key) {
      case 'xs':
        result.push({ key: mq[0][media], value: obj.xs });
        break;
      case 'sm':
        result.push({ key: mq[0][media], value: obj.sm });
        break;
      case 'md':
        result.push({ key: mq[1][media], value: obj.md });
        break;
      case 'lg':
        result.push({ key: mq[2][media], value: obj.lg });
        break;
      case 'xl':
        result.push({ key: mq[3][media], value: obj.xl });
        break;
      case 'xxl':
        result.push({ key: mq[4][media], value: obj.xxl });
        break;
      default:
        result.push({ key, value: obj[key] });
        break;
    }
  });
  result.reverse();
  const value = {};
  result.forEach((item) => {
    value[item.key] = item.value;
  });
  return value;
};

export default mediaToCssObject;
