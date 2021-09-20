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

import { renderHtml } from '../src';

import { configure, mount } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
configure({ adapter: new Adapter() });

const mockCMakeCssClass = jest.fn(() => 'test-class');
const methods = {
  makeCssClass: mockCMakeCssClass,
};

test('renderHtml html is undefined', () => {
  expect(renderHtml({ methods })).toBe(undefined);
  expect(renderHtml({ html: undefined, methods })).toBe(undefined);
});

test('renderHtml html string', async () => {
  const wrapper = await mount(renderHtml({ html: '<p>Hello</p>', methods }));
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(
    `"<span class=\\"test-class\\"><p>Hello</p></span>"`
  );
});

test('renderHtml html number 0', async () => {
  const wrapper = await mount(renderHtml({ html: 0, methods }));
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(`"<span class=\\"test-class\\">0</span>"`);
});

test('renderHtml html number 123', async () => {
  const wrapper = await mount(renderHtml({ html: 123, methods }));
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(`"<span class=\\"test-class\\">123</span>"`);
});

test('renderHtml html boolean false', async () => {
  const wrapper = await mount(renderHtml({ html: false, methods }));
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(`"<span class=\\"test-class\\">false</span>"`);
});

test('renderHtml html boolean true', async () => {
  const wrapper = await mount(renderHtml({ html: true, methods }));
  await wrapper.instance().componentDidMount();
  await wrapper.update();
  expect(wrapper.html()).toMatchInlineSnapshot(`"<span class=\\"test-class\\">true</span>"`);
});
