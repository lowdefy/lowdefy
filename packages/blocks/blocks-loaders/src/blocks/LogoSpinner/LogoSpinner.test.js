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

import React from 'react';
import LogoSpinner from './LogoSpinner.js';
import { render } from '@testing-library/react';

test('default', () => {
  const { container } = render(<LogoSpinner />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <svg
      height="100%"
      version="1.1"
      viewBox="0 0 94 91"
      width="100%"
    >
      <g>
        <path
          d="M94,18.634c0,-10.284 -8.35,-18.634 -18.634,-18.634l-56.732,0c-10.284,0 -18.634,8.35 -18.634,18.634l0,53.732c0,10.284 8.35,18.634 18.634,18.634l56.732,0c10.284,0 18.634,-8.35 18.634,-18.634l0,-53.732Z"
          style="fill: #bfbfbf;"
        />
        <rect
          class="loading-bar"
          height="59"
          style="fill: #f1f1f1;"
          width="30"
          x="16"
          y="15"
        />
        <rect
          class="loading-bar-sm"
          height="25"
          style="fill: #f1f1f1;"
          width="25"
          x="53"
          y="52"
        />
      </g>
    </svg>
  `);
});

test('color props', () => {
  const { container } = render(<LogoSpinner color="red" barColor="green" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <svg
      height="100%"
      version="1.1"
      viewBox="0 0 94 91"
      width="100%"
    >
      <g>
        <path
          d="M94,18.634c0,-10.284 -8.35,-18.634 -18.634,-18.634l-56.732,0c-10.284,0 -18.634,8.35 -18.634,18.634l0,53.732c0,10.284 8.35,18.634 18.634,18.634l56.732,0c10.284,0 18.634,-8.35 18.634,-18.634l0,-53.732Z"
          style="fill: red;"
        />
        <rect
          class="loading-bar"
          height="59"
          style="fill: green;"
          width="30"
          x="16"
          y="15"
        />
        <rect
          class="loading-bar-sm"
          height="25"
          style="fill: green;"
          width="25"
          x="53"
          y="52"
        />
      </g>
    </svg>
  `);
});
