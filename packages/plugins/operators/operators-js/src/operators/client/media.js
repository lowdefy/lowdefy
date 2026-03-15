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

import { getFromObject } from '@lowdefy/operators';

const breakpoints = {
  xs: 640,
  sm: 768,
  md: 1024,
  lg: 1280,
  xl: 1536,
};

function _media({ arrayIndices, location, params, globals }) {
  const { window } = globals;
  if (!window?.innerWidth) {
    throw new Error(`device window width not available for _media.`);
  }
  let size;
  switch (true) {
    case window.innerWidth < breakpoints.xs:
      size = 'xs';
      break;
    case window.innerWidth < breakpoints.sm:
      size = 'sm';
      break;
    case window.innerWidth < breakpoints.md:
      size = 'md';
      break;
    case window.innerWidth < breakpoints.lg:
      size = 'lg';
      break;
    case window.innerWidth < breakpoints.xl:
      size = 'xl';
      break;
    default:
      size = '2xl';
      break;
  }
  const media = {
    size,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  return getFromObject({
    arrayIndices,
    location,
    object: media,
    operator: '_media',
    params,
  });
}

_media.dynamic = true;

export default _media;
