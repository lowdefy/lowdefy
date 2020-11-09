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

import createContext from './context';

import { PageController } from '../controllers/pageController';
import { ComponentController } from '../controllers/componentController';

const mockLog = jest.fn();

const logger = {
  log: mockLog,
};

const mockGetHeadersFromInput = jest.fn((input) => input.headers);
const mockGetSecrets = jest.fn(() => ({
  CONNECTION_SECRETS: {},
}));

const config = {
  DEPLOYMENT_ID: 'DEPLOYMENT_ID',
  DEPLOYMENT_NAME: 'DEPLOYMENT_NAME',
  DOMAIN_NAME: 'DOMAIN_NAME',
  CONFIGURATION_BASE_PATH: 'DOMAIN_NAME',
  logger,
  getHeadersFromInput: mockGetHeadersFromInput,
  getSecrets: mockGetSecrets,
};

/* TODO:
- headers are mapped to where used
- connection secrets are mapped to request controller
- secrets can only be accessed where they should be
- CONFIGURATION_BASE_PATH is mapped to loaders
*/

test('create context function', () => {
  const contextFn = createContext(config);
  expect(contextFn).toBeInstanceOf(Function);
});

test('context function returns context object with getController and logger', async () => {
  const input = {
    headers: {
      Origin: 'Origin',
      Host: 'Host',
    },
  };
  const contextFn = createContext(config);
  const context = await contextFn(input);
  expect(context).toBeInstanceOf(Object);
  expect(context.logger).toBe(logger);
  expect(context.getController).toBeInstanceOf(Function);
  expect(Object.keys(context)).toEqual(['getController', 'logger']);
});

test('context function returns context object with getController and logger', async () => {
  const input = {
    headers: {
      Origin: 'Origin',
      Host: 'Host',
    },
  };
  const contextFn = createContext(config);
  const context = await contextFn(input);
  expect(context).toBeInstanceOf(Object);
  expect(context.logger).toBe(logger);
  expect(context.getController).toBeInstanceOf(Function);
});

test('getController returns the correct controllers', async () => {
  const input = {
    headers: {
      Origin: 'Origin',
      Host: 'Host',
    },
  };
  const contextFn = createContext(config);
  const context = await contextFn(input);
  const pageController = context.getController('page');
  expect(pageController).toBeInstanceOf(PageController);
  const componentController = context.getController('component');
  expect(componentController).toBeInstanceOf(ComponentController);
});

test('logger is mapped through', async () => {
  const input = {
    headers: {
      Origin: 'Origin',
      Host: 'Host',
    },
  };
  const contextFn = createContext(config);
  const context = await contextFn(input);
  context.logger.log('test');
  expect(mockLog.mock.calls).toEqual([['test']]);
});

test('getHeaders is called', async () => {
  const input = {
    headers: {
      Origin: 'Origin',
      Host: 'Host',
    },
  };
  const contextFn = createContext(config);
  await contextFn(input);
  expect(mockGetHeadersFromInput.mock.calls).toEqual([[input]]);
});

test('getSecrets is called', async () => {
  const input = {
    headers: {
      Origin: 'Origin',
      Host: 'Host',
    },
  };
  const contextFn = createContext(config);
  await contextFn(input);
  expect(mockGetSecrets.mock.calls).toEqual([[]]);
});

test('deployment variables area available for component controller', async () => {
  const input = {
    headers: {
      Origin: 'Origin',
      Host: 'Host',
    },
  };
  const contextFn = createContext(config);
  const context = await contextFn(input);
  const componentController = context.getController('component');
  expect(componentController.DEPLOYMENT_ID).toEqual('DEPLOYMENT_ID');
  expect(componentController.DEPLOYMENT_NAME).toEqual('DEPLOYMENT_NAME');
  expect(componentController.DOMAIN_NAME).toEqual('DOMAIN_NAME');
});

test('Casing of headers', async () => {
  const input = {
    headers: {
      origin: 'Origin',
      host: 'Host',
    },
  };
  const contextFn = createContext(config);
  const context = await contextFn(input);
  expect(context).toBeInstanceOf(Object);
  expect(context.logger).toBe(logger);
  expect(context.getController).toBeInstanceOf(Function);
});
