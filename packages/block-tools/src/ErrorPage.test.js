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
import { render } from '@testing-library/react';

import ErrorPage from './ErrorPage.js';

test('default', () => {
  const { container } = render(<ErrorPage />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      style="height: 100%; font-family: system-ui; margin: 0px; display: flex; justify-content: center; align-items: center;"
    >
      <div
        style="flex: 0 1 auto; font-size: 4.3em; font-weight: 100; padding-right: 30px;"
      >
        500
      </div>
      <div
        style="flex: 0 1 auto; padding-left: 30px; max-width: 400px; border-left: 1px solid #aeaeae;"
      >
        <div
          style="font-size: 1.3em; font-weight: 300; padding-bottom: 10px;"
        >
          Error
        </div>
        <div
          style="font-size: 0.9em;"
        >
          An error has occurred.
        </div>
        <div
          style="font-size: 0.9em;"
        />
        <div
          style="padding-top: 20px;"
        >
          <a
            href="/"
          >
            Return to home page
          </a>
        </div>
      </div>
    </div>
  `);
});

test('custom props', () => {
  const { container } = render(
    <ErrorPage
      code={301}
      description={'Error description'}
      message={'Error message'}
      name={'Error name'}
    />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      style="height: 100%; font-family: system-ui; margin: 0px; display: flex; justify-content: center; align-items: center;"
    >
      <div
        style="flex: 0 1 auto; font-size: 4.3em; font-weight: 100; padding-right: 30px;"
      >
        301
      </div>
      <div
        style="flex: 0 1 auto; padding-left: 30px; max-width: 400px; border-left: 1px solid #aeaeae;"
      >
        <div
          style="font-size: 1.3em; font-weight: 300; padding-bottom: 10px;"
        >
          Error name
        </div>
        <div
          style="font-size: 0.9em;"
        >
          Error message
        </div>
        <div
          style="font-size: 0.9em;"
        >
          Error description
        </div>
        <div
          style="padding-top: 20px;"
        >
          <a
            href="/"
          >
            Return to home page
          </a>
        </div>
      </div>
    </div>
  `);
});
