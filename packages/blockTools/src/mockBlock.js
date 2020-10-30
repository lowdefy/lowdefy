/*
  Copyright 2020 Lowdefy, Inc

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

import stubBlockProps from './stubBlockProps';
import makeCssClass from './makeCssClass';

jest.mock('./makeCssClass', () => {
  const makeCssClass = jest.fn();
  return { default: makeCssClass, __esModule: true };
});
const callAction = jest.fn();
const moveItemDown = jest.fn();
const moveItemUp = jest.fn();
const pushItem = jest.fn();
const registerMethod = jest.fn();
const removeItem = jest.fn();
const setValue = jest.fn();
const unshiftItem = jest.fn();

const mockBlock = ({ meta, logger }) => {
  const methods = {
    callAction,
    makeCssClass,
    moveItemDown,
    moveItemUp,
    pushItem,
    registerMethod,
    removeItem,
    setValue,
    unshiftItem,
  };
  const makeCssImp = (style, op) => JSON.stringify({ style, options: op });
  const before = () => {
    callAction.mockReset();
    makeCssClass.mockReset();
    makeCssClass.mockImplementation(makeCssImp);
    moveItemDown.mockReset();
    moveItemUp.mockReset();
    pushItem.mockReset();
    registerMethod.mockReset();
    removeItem.mockReset();
    setValue.mockReset();
    unshiftItem.mockReset();
  };

  const getProps = (block) => stubBlockProps({ block, meta, logger });
  return { before, methods, getProps };
};

export default mockBlock;
