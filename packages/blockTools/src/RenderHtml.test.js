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

import { RenderHtml } from '../src';

import { configure, mount } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
configure({ adapter: new Adapter() });

const mockCMakeCssClass = jest.fn(() => 'test-class');
const methods = {
  makeCssClass: mockCMakeCssClass,
};

beforeEach(() => {
  mockCMakeCssClass.mockReset();
  mockCMakeCssClass.mockImplementation((obj) => JSON.stringify(obj));
});

test('Render default', async () => {
  const wrapper = await mount(<RenderHtml methods={methods} />);
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(`""`);
  await wrapper.instance().componentDidUpdate();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(`""`);
});

test('Render default and id', async () => {
  const wrapper = await mount(<RenderHtml id="test-id" methods={methods} />);
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(`""`);
});

test('Render string', async () => {
  const wrapper = await mount(<RenderHtml html="A string value" methods={methods} />);
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(`"<span>A string value</span>"`);
});

test('Render number', async () => {
  const wrapper = await mount(<RenderHtml html={123} methods={methods} />);
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(`"<span>123</span>"`);
});

test('Render boolean', async () => {
  const wrapper = await mount(<RenderHtml html={false} methods={methods} />);
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(`""`);
});

test('Render null', async () => {
  const wrapper = await mount(<RenderHtml html={null} methods={methods} />);
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(`""`);
});

test('Render html', async () => {
  const wrapper = await mount(
    <RenderHtml
      html={'<div style="background: green; padding: 10px;">Content green background</div>'}
      methods={methods}
    />
  );
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(
    `"<span><div style=\\"background: green; padding: 10px;\\">Content green background</div></span>"`
  );
});

test('Render html div', async () => {
  const wrapper = await mount(
    <RenderHtml
      html={'<div style="background: green; padding: 10px;">Content green background</div>'}
      methods={methods}
      div={true}
    />
  );
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(
    `"<div><div style=\\"background: green; padding: 10px;\\">Content green background</div></div>"`
  );
});

test('Render html and style', async () => {
  const wrapper = await mount(
    <RenderHtml
      html={'<div style="background: green; padding: 10px;">Content green background</div>'}
      methods={methods}
      style={{ color: 'red' }}
    />
  );
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(
    `"<span class=\\"{&quot;color&quot;:&quot;red&quot;}\\"><div style=\\"background: green; padding: 10px;\\">Content green background</div></span>"`
  );
});

test('Render html iframe', async () => {
  const wrapper = await mount(
    <RenderHtml
      html={
        '<iframe width="560" height="315" src="https://www.youtube.com/embed/7N7GWdlQJlU" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
      }
      methods={methods}
    />
  );
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(`"<span></span>"`);
});

test('Render bad html', async () => {
  const wrapper = await mount(
    <RenderHtml
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
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(`
    "<span>
          <h1>Link</h1><h1>
          <a href=\\"https://lowdefy.com\\">Lowdefy link</a>
          <font size=\\"+10\\">Description</font>
          </h1><h1>Bad HTML</h1>
          <div>
            <a>delta</a>
            <img src=\\"x\\">
            <math><mi></mi></math>
          </div>
          </span>"
  `);
});
