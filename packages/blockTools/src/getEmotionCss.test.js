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

import getEmotionCss from './getEmotionCss';
import createEmotion from 'create-emotion';

jest.mock('create-emotion', () => {
  const emotion = jest.fn();
  return emotion;
});

beforeEach(() => {
  createEmotion.mockReset();
  createEmotion.mockImplementation(() => ({ css: 'emotionCssMock' }));
});

test('catch emotion error', () => {
  createEmotion.mockImplementation(() => {
    throw new Error('No emotion');
  });
  expect(() => getEmotionCss()).toThrowErrorMatchingInlineSnapshot(
    `"Emotion failed to initilize: No emotion"`
  );
});

test('default and memoize', () => {
  const css = getEmotionCss();
  expect(css).toEqual('emotionCssMock');
  expect(createEmotion).toHaveBeenCalledTimes(1);
  const csstwo = getEmotionCss();
  expect(csstwo).toEqual('emotionCssMock');
  expect(createEmotion).toHaveBeenCalledTimes(1);
});
