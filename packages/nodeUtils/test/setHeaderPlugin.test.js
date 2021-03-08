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

import setHeaderPlugin from '../src/setHeaderPlugin';

test('setHeaderPlugin, no headers', () => {
  const started = setHeaderPlugin.requestDidStart();
  const requestContext = {
    context: {},
    response: {
      http: {
        headers: {
          append: jest.fn(),
        },
      },
    },
  };
  started.willSendResponse(requestContext);
  expect(requestContext.response.http.headers.append.mock.calls).toEqual([]);
});

test('setHeaderPlugin, headers array empty', () => {
  const started = setHeaderPlugin.requestDidStart();
  const requestContext = {
    context: {
      setHeaders: [],
    },
    response: {
      http: {
        headers: {
          append: jest.fn(),
        },
      },
    },
  };
  started.willSendResponse(requestContext);
  expect(requestContext.response.http.headers.append.mock.calls).toEqual([]);
});

test('setHeaderPlugin, headers', () => {
  const started = setHeaderPlugin.requestDidStart();
  const requestContext = {
    context: {
      setHeaders: [
        {
          key: 'header-name',
          value: 'value',
        },
      ],
    },
    response: {
      http: {
        headers: {
          append: jest.fn(),
        },
      },
    },
  };
  started.willSendResponse(requestContext);
  expect(requestContext.response.http.headers.append.mock.calls).toEqual([
    ['header-name', 'value'],
  ]);
});
