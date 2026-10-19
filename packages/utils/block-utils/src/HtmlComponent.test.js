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

import React from 'react';
import { jest } from '@jest/globals';
import { render } from '@testing-library/react';
import DOMPurify from 'dompurify';

import HtmlComponent from './HtmlComponent.js';

test('Render default', () => {
  const { container } = render(<HtmlComponent />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render default and id', () => {
  const { container } = render(<HtmlComponent id="test-id" />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render string and update', () => {
  const { container, rerender } = render(<HtmlComponent html="A string value" />);
  expect(container.firstChild).toMatchSnapshot();
  rerender(<HtmlComponent html="A string value updated" />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render number', () => {
  const { container, rerender } = render(<HtmlComponent html={123} />);
  expect(container.firstChild).toMatchSnapshot();
  rerender(<HtmlComponent html={1000} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render number 0 1', () => {
  const { container, rerender } = render(<HtmlComponent html={0} />);
  expect(container.firstChild).toMatchSnapshot();
  rerender(<HtmlComponent html={1} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render boolean true false', () => {
  const { container, rerender } = render(<HtmlComponent html={true} />);
  expect(container.firstChild).toMatchSnapshot();
  rerender(<HtmlComponent html={false} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render null, undefined', () => {
  const { container, rerender } = render(<HtmlComponent html={null} />);
  expect(container.firstChild).toMatchSnapshot();
  rerender(<HtmlComponent html={undefined} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Render html', () => {
  const { container, rerender } = render(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background</div>'}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
  rerender(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background updated</div>'}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
});

test('Render html div', () => {
  const { container, rerender } = render(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background</div>'}
      div={true}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
  rerender(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background updated</div>'}
      div={true}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
});

test('Render html with className and style', () => {
  const { container, rerender } = render(
    <HtmlComponent
      html={'<div style="background: green; padding: 10px;">Content green background</div>'}
      className="custom-class"
      style={{ color: 'red' }}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
  rerender(
    <HtmlComponent
      html={
        '<div style="background: green; padding: 10px; updated: true;">Content green background</div>'
      }
      className="custom-class-updated"
      style={{ color: 'blue' }}
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
    />
  );
  expect(container.firstChild).toMatchSnapshot();
});

test('HtmlComponent does not sanitize or reset innerHTML when re-rendered with the same html', () => {
  const sanitize = jest.spyOn(DOMPurify, 'sanitize');
  const { container, rerender } = render(
    <HtmlComponent id="same" html="<details>Info</details>" />
  );
  expect(sanitize).toHaveBeenCalledTimes(1);
  // Stands in for state the browser keeps in the element, like an open <details>.
  container.firstChild.firstChild.setAttribute('open', '');
  rerender(<HtmlComponent id="same" html="<details>Info</details>" style={{ color: 'red' }} />);
  expect(sanitize).toHaveBeenCalledTimes(1);
  expect(container.firstChild.firstChild.hasAttribute('open')).toBe(true);
  sanitize.mockRestore();
});

test('HtmlComponent sanitizes and replaces innerHTML when the html changes', () => {
  const sanitize = jest.spyOn(DOMPurify, 'sanitize');
  const { container, rerender } = render(<HtmlComponent html="<b>One</b>" />);
  rerender(<HtmlComponent html="<b>Two</b>" />);
  expect(sanitize).toHaveBeenCalledTimes(2);
  expect(container.firstChild.innerHTML).toBe('<b>Two</b>');
  sanitize.mockRestore();
});

test('HtmlComponent applies the same html again when the element changes from span to div', () => {
  const { container, rerender } = render(<HtmlComponent html="<b>Same</b>" />);
  expect(container.firstChild.tagName).toBe('SPAN');
  rerender(<HtmlComponent html="<b>Same</b>" div={true} />);
  expect(container.firstChild.tagName).toBe('DIV');
  expect(container.firstChild.innerHTML).toBe('<b>Same</b>');
});
