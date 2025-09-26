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

import { getFromObject } from '@lowdefy/operators';

const breakpoints = {
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1600,
};

function _media({ arrayIndices, location, params, globals }) {
  const { window } = globals;
  if (!window?.innerWidth) {
    throw new Error(
      `Operator Error: device window width not available for _media. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
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
      size = 'xxl';
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

export default _media;
