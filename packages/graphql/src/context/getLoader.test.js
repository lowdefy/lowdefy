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

import Dataloader from 'dataloader';
import createGetLoader from './getLoader';
import { testBootstrapContext } from '../test/testContext';

test('get page loader', () => {
  const getLoader = createGetLoader(testBootstrapContext());
  const loader = getLoader('page');
  expect(loader).toBeInstanceOf(Dataloader);
  expect(loader._batchLoadFn.name).toEqual('pageLoader');
});

test('get component loader', () => {
  const getLoader = createGetLoader(testBootstrapContext());
  const loader = getLoader('component');
  expect(loader).toBeInstanceOf(Dataloader);
  expect(loader._batchLoadFn.name).toEqual('componentLoader');
});

test('get request loader', () => {
  const getLoader = createGetLoader(testBootstrapContext());
  const loader = getLoader('request');
  expect(loader).toBeInstanceOf(Dataloader);
  expect(loader._batchLoadFn.name).toEqual('requestLoader');
});

test('get connection loader', () => {
  const getLoader = createGetLoader(testBootstrapContext());
  const loader = getLoader('connection');
  expect(loader).toBeInstanceOf(Dataloader);
  expect(loader._batchLoadFn.name).toEqual('connectionLoader');
});

test('memoise loader', () => {
  const getLoader = createGetLoader(testBootstrapContext());
  const loader1 = getLoader('page');
  const loader2 = getLoader('page');
  expect(loader1).toBe(loader2);
});
