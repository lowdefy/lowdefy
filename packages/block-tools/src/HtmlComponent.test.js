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

import HtmlComponent from './HtmlComponent.js';
import makeCssClass from './makeCssClass.js';

const methods = {
  makeCssClass,
};

test('Render default', () => {
  const { container } = render(<HtmlComponent methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    />
  `);
});

test('Render default and id', () => {
  const { container } = render(<HtmlComponent id="test-id" methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
      data-testid="test-id"
      id="test-id"
    />
  `);
});

test('Render string and update', () => {
  const { container, rerender } = render(<HtmlComponent html="A string value" methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    >
      A string value
    </span>
  `);
  rerender(<HtmlComponent html="A string value updated" methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    >
      A string value updated
    </span>
  `);
});

test('Render number', () => {
  const { container, rerender } = render(<HtmlComponent html={123} methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    >
      123
    </span>
  `);
  rerender(<HtmlComponent html={1000} methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    >
      1000
    </span>
  `);
});

test('Render number 0 1', () => {
  const { container, rerender } = render(<HtmlComponent html={0} methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    >
      0
    </span>
  `);
  rerender(<HtmlComponent html={1} methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    >
      1
    </span>
  `);
});

test('Render boolean true false', () => {
  const { container, rerender } = render(<HtmlComponent html={true} methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    >
      true
    </span>
  `);
  rerender(<HtmlComponent html={false} methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    >
      false
    </span>
  `);
});

test('Render null, undefined', () => {
  const { container, rerender } = render(<HtmlComponent html={null} methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    />
  `);
  rerender(<HtmlComponent html={undefined} methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    />
  `);
});

test('Render html', () => {
  const { container, rerender } = render(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background</div>'}
      methods={methods}
    />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    >
      <div
        style="background: green; padding: 10px;"
      >
        Content green background
      </div>
    </span>
  `);
  rerender(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background updated</div>'}
      methods={methods}
    />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    >
      <div
        style="background: green; padding: 10px;"
      >
        Content green background updated
      </div>
    </span>
  `);
});

test('Render html div', () => {
  const { container, rerender } = render(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background</div>'}
      methods={methods}
      div={true}
    />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      class="emotion-0"
    >
      <div
        style="background: green; padding: 10px;"
      >
        Content green background
      </div>
    </div>
  `);
  rerender(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background updated</div>'}
      methods={methods}
      div={true}
    />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      class="emotion-0"
    >
      <div
        style="background: green; padding: 10px;"
      >
        Content green background updated
      </div>
    </div>
  `);
});

test('Render html and style', () => {
  const { container, rerender } = render(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background</div>'}
      methods={methods}
      style={{ color: 'red' }}
    />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    .emotion-0 {
      color: red;
    }

    <span
      class="emotion-0"
    >
      <div
        style="background: green; padding: 10px;"
      >
        Content green background
      </div>
    </span>
  `);
  rerender(
    <HtmlComponent
      html={
        '<div style="background: green; padding: 10px; updated: true;">Content green background</div>'
      }
      methods={methods}
      style={{ color: 'red updated' }}
    />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    .emotion-0 {
      color: red updated;
    }

    <span
      class="emotion-0"
    >
      <div
        style="background: green; padding: 10px; updated: true;"
      >
        Content green background
      </div>
    </span>
  `);
});

test('Render html iframe', () => {
  const { container } = render(
    <HtmlComponent
      html={
        '<iframe width="560" height="315" src="https://www.youtube.com/embed/7N7GWdlQJlU" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
      }
      methods={methods}
    />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    />
  `);
});

test('Render bad html', async () => {
  const { container } = render(
    <HtmlComponent
      html={`
      <h1>Link<h1>
      <a href="https://lowdefy.com">Lowdefy link</a>
      <font size="+10">Description</font>
      <h1>Bad HTML</h1>
      <div onmouseover="alert('alpha')">
        <a href="javascript:alert('bravo')">delta</a>
        <img src="x" onerror="alert('charlie')"><iframe src="javascript:alert('delta')"></iframe>
        <math><mi xlink:href="data:x,<script>alert('echo')</script>"></mi></math>
      </div><script>alert('script tag');</script>
      `}
      methods={methods}
    />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <span
      class="emotion-0"
    >
      
          
      <h1>
        Link
      </h1>
      <h1>
        
          
        <a
          href="https://lowdefy.com"
        >
          Lowdefy link
        </a>
        
          
        <font
          size="+10"
        >
          Description
        </font>
        
          
      </h1>
      <h1>
        Bad HTML
      </h1>
      
          
      <div>
        
            
        <a>
          delta
        </a>
        
            
        <img
          src="x"
        />
        
            
        <math>
          <mi />
        </math>
        
          
      </div>
      
          
    </span>
  `);
});
