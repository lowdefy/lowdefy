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
import { create, act } from 'react-test-renderer';
import ErrorPage from './ErrorPage';

test('default', () => {
  let comp;
  act(() => {
    comp = create(<ErrorPage />);
  });
  act(() => {
    comp.update(<ErrorPage />);
  });
  expect(comp.toJSON()).toMatchInlineSnapshot(`
    <div
      style={
        Object {
          "alignItems": "center",
          "display": "flex",
          "fontFamily": "system-ui",
          "height": "100%",
          "justifyContent": "center",
          "margin": 0,
        }
      }
    >
      <div
        style={
          Object {
            "flex": "0 1 auto",
            "fontSize": "4.3em",
            "fontWeight": "100",
            "paddingRight": 30,
          }
        }
      >
        500
      </div>
      <div
        style={
          Object {
            "borderLeft": "1px solid #aeaeae",
            "flex": "0 1 auto",
            "maxWidth": 400,
            "paddingLeft": 30,
          }
        }
      >
        <div
          style={
            Object {
              "fontSize": "1.3em",
              "fontWeight": "300",
              "paddingBottom": 10,
            }
          }
        />
        <div
          style={
            Object {
              "fontSize": "0.9em",
            }
          }
        />
        <div
          style={
            Object {
              "fontSize": "0.9em",
            }
          }
        />
        <div
          style={
            Object {
              "paddingTop": 20,
            }
          }
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
  let comp;
  act(() => {
    comp = create(
      <ErrorPage
        code={301}
        description={'Error description'}
        message={'Error message'}
        name={'Error name'}
      />
    );
  });
  act(() => {
    comp.update(
      <ErrorPage
        code={301}
        description={'Error description'}
        message={'Error message'}
        name={'Error name'}
      />
    );
  });
  expect(comp.toJSON()).toMatchInlineSnapshot(`
    <div
      style={
        Object {
          "alignItems": "center",
          "display": "flex",
          "fontFamily": "system-ui",
          "height": "100%",
          "justifyContent": "center",
          "margin": 0,
        }
      }
    >
      <div
        style={
          Object {
            "flex": "0 1 auto",
            "fontSize": "4.3em",
            "fontWeight": "100",
            "paddingRight": 30,
          }
        }
      >
        301
      </div>
      <div
        style={
          Object {
            "borderLeft": "1px solid #aeaeae",
            "flex": "0 1 auto",
            "maxWidth": 400,
            "paddingLeft": 30,
          }
        }
      >
        <div
          style={
            Object {
              "fontSize": "1.3em",
              "fontWeight": "300",
              "paddingBottom": 10,
            }
          }
        >
          Error name
        </div>
        <div
          style={
            Object {
              "fontSize": "0.9em",
            }
          }
        >
          Error message
        </div>
        <div
          style={
            Object {
              "fontSize": "0.9em",
            }
          }
        >
          Error description
        </div>
        <div
          style={
            Object {
              "paddingTop": 20,
            }
          }
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
