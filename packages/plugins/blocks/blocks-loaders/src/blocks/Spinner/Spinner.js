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

import React from 'react';
import { type } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-utils';

const Spinner = ({ properties, methods }) => {
  let size = properties.size ?? 20;
  if (type.isString(size)) {
    switch (properties.size) {
      case 'small':
        size = 20;
        break;
      case 'large':
        size = 32;
        break;
      default:
        size = 24;
    }
  }
  return (
    <span
      className={methods.makeCssClass([
        {
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        properties.style,
      ])}
    >
      <svg
        viewBox="0 0 1024 1024"
        focusable="false"
        data-icon="loading-3-quarters"
        width={size}
        height={size}
        fill="currentColor"
        aria-hidden="true"
        className="spinner"
      >
        <path
          fill="#bfbfbf"
          d="M512 1024c-69.1 0-136.2-13.5-199.3-40.2C251.7 958 197 921 150 874c-47-47-84-101.7-109.8-162.7C13.5 648.2 0 581.1 0 512c0-19.9 16.1-36 36-36s36 16.1 36 36c0 59.4 11.6 117 34.6 171.3 22.2 52.4 53.9 99.5 94.3 139.9 40.4 40.4 87.5 72.2 139.9 94.3C395 940.4 452.6 952 512 952c59.4 0 117-11.6 171.3-34.6 52.4-22.2 99.5-53.9 139.9-94.3 40.4-40.4 72.2-87.5 94.3-139.9C940.4 629 952 571.4 952 512c0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.2C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3s-13.5 136.2-40.2 199.3C958 772.3 921 827 874 874c-47 47-101.8 83.9-162.7 109.7-63.1 26.8-130.2 40.3-199.3 40.3z"
        />
      </svg>
    </span>
  );
};

Spinner.defaultProps = blockDefaultProps;
Spinner.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/Spinner/style.less'],
};

export default Spinner;
