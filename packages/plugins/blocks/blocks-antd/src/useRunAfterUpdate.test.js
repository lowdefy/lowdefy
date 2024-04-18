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

const useLayoutEffect = jest.fn();
const current = jest.fn();
const ref = { current };
const useRef = () => ref;

jest.mock('react', () => {
  return { useLayoutEffect, useRef };
});
beforeEach(() => {
  ref.current.mockReset();
  useLayoutEffect.mockReset();
  useLayoutEffect.mockImplementation((fn) => fn());
});

test('default call', async () => {
  const useRunAfterUpdateFn = await import('./useRunAfterUpdate.js');
  const useRunAfterUpdate = useRunAfterUpdateFn.default;
  const res = useRunAfterUpdate();
  expect(useLayoutEffect).toHaveBeenCalledTimes(1);
  expect(current).toBeCalledTimes(1);
  res(() => 'one');
  expect(ref.current()).toEqual('one');
  useRunAfterUpdate();
  expect(useLayoutEffect).toHaveBeenCalledTimes(2);
  expect(current).toBeCalledTimes(1);
  useRunAfterUpdate();
  expect(useLayoutEffect).toHaveBeenCalledTimes(3);
  expect(ref.current).toEqual(null);
  expect(current).toBeCalledTimes(1);
});
