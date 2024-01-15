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

import { makeCssClass } from '@lowdefy/block-utils';

import stubBlockProps from './stubBlockProps.js';

const mockBlock = ({ meta, schema }) => {
  const mockMath = Object.create(global.Math);
  mockMath.random = () => 0.5;
  global.Math = mockMath;
  const moveItemDown = jest.fn();
  const moveItemUp = jest.fn();
  const pushItem = jest.fn();
  const registerEvent = jest.fn();
  const registerMethod = jest.fn();
  const removeItem = jest.fn();
  const setValue = jest.fn();
  const triggerEvent = jest.fn();
  const unshiftItem = jest.fn();
  const methods = {
    makeCssClass,
    moveItemDown,
    moveItemUp,
    pushItem,
    registerEvent,
    registerMethod,
    removeItem,
    setValue,
    triggerEvent,
    unshiftItem,
  };
  const before = () => {
    triggerEvent.mockReset();
    moveItemDown.mockReset();
    moveItemUp.mockReset();
    pushItem.mockReset();
    registerMethod.mockReset();
    registerEvent.mockReset();
    removeItem.mockReset();
    setValue.mockReset();
    unshiftItem.mockReset();
    // for antd from:
    // https://github.com/ant-design/ant-design/blob/master/tests/setup.js
    // ref: https://github.com/ant-design/ant-design/issues/18774
    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: false,
          media: query.includes('max-width'),
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    }
    if (typeof window !== 'undefined') {
      window.resizeTo = (width, height) => {
        window.innerWidth = width || window.innerWidth;
        window.innerHeight = height || window.innerHeight;
        window.dispatchEvent(new Event('resize'));
      };
      window.scrollTo = () => {};
      // Fix css-animation or rc-motion deps on these
      // https://github.com/react-component/motion/blob/9c04ef1a210a4f3246c9becba6e33ea945e00669/src/util/motion.ts#L27-L35
      // https://github.com/yiminghe/css-animation/blob/a5986d73fd7dfce75665337f39b91483d63a4c8c/src/Event.js#L44
      window.AnimationEvent = window.AnimationEvent || (() => {});
      window.TransitionEvent = window.TransitionEvent || (() => {});
    }
  };
  const getProps = (block) => {
    return stubBlockProps({ block, meta, schema });
  };

  return { before, methods, getProps };
};

export default mockBlock;
