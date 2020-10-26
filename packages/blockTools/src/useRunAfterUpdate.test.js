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

import useRunAfterUpdate from './useRunAfterUpdate';
import { useRef, useLayoutEffect } from 'react';

jest.mock('react', () => {
  const useLayoutEffect = (fn) => fn();
  const ref = { current: jest.fn() };
  const useRef = () => ref;
  return { useLayoutEffect, useRef };
});

const ref = useRef();
const { current } = ref;

beforeEach(() => {
  ref.current.mockReset();
});

test('default call', () => {
  const res = useRunAfterUpdate();
  expect(current).toBeCalledTimes(1);
  res('one');
  expect(ref.current).toEqual('one');
});
