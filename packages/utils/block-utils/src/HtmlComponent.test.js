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
import { render } from '@testing-library/react';

import HtmlComponent from './HtmlComponent.js';
import makeCssClass from './makeCssClass.js';

const methods = {
  makeCssClass,
};

test('Render default', () => {
  const { container } = render(<HtmlComponent methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render default and id', () => {
  const { container } = render(<HtmlComponent id="test-id" methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render string and update', () => {
  const { container, rerender } = render(<HtmlComponent html="A string value" methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
  rerender(<HtmlComponent html="A string value updated" methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render number', () => {
  const { container, rerender } = render(<HtmlComponent html={123} methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
  rerender(<HtmlComponent html={1000} methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render number 0 1', () => {
  const { container, rerender } = render(<HtmlComponent html={0} methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
  rerender(<HtmlComponent html={1} methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render boolean true false', () => {
  const { container, rerender } = render(<HtmlComponent html={true} methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
  rerender(<HtmlComponent html={false} methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render null, undefined', () => {
  const { container, rerender } = render(<HtmlComponent html={null} methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
  rerender(<HtmlComponent html={undefined} methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render html', () => {
  const { container, rerender } = render(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background</div>'}
      methods={methods}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
  rerender(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background updated</div>'}
      methods={methods}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
});

test('Render html div', () => {
  const { container, rerender } = render(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background</div>'}
      methods={methods}
      div={true}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
  rerender(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background updated</div>'}
      methods={methods}
      div={true}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
});

test('Render html and style', () => {
  const { container, rerender } = render(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background</div>'}
      methods={methods}
      style={{ color: 'red' }}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
  rerender(
    <HtmlComponent
      html={
        '<div style="background: green; padding: 10px; updated: true;">Content green background</div>'
      }
      methods={methods}
      style={{ color: 'red updated' }}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
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
  expect(container.firstChild).toMatchSnapshot();
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
  expect(container.firstChild).toMatchSnapshot();
});
