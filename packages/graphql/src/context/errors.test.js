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

import { ApolloError } from 'apollo-server';
import {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
  ConfigurationError,
  TokenExpiredError,
  ServerError,
  RequestError,
} from './errors';

test('AuthenticationError', () => {
  const error = new AuthenticationError('Test error.', { extraProp: 'test' });
  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(ApolloError);
  expect(error.displayTitle).toEqual('Authentication Error');
  expect(error.displayMessage).toEqual('Test error.');
  expect(error.name).toEqual('AuthenticationError');
  expect(error.extensions.displayTitle).toEqual('Authentication Error');
  expect(error.extensions.displayMessage).toEqual('Test error.');
  expect(error.extensions.code).toEqual('UNAUTHENTICATED');
  expect(error.extensions.extraProp).toEqual('test');
});

test('ForbiddenError', () => {
  const error = new ForbiddenError('Test error.', { extraProp: 'test' });
  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(ApolloError);
  expect(error.displayTitle).toEqual('Forbidden');
  expect(error.displayMessage).toEqual('Test error.');
  expect(error.name).toEqual('ForbiddenError');
  expect(error.extensions.displayTitle).toEqual('Forbidden');
  expect(error.extensions.displayMessage).toEqual('Test error.');
  expect(error.extensions.code).toEqual('FORBIDDEN');
  expect(error.extensions.extraProp).toEqual('test');
});

test('UserInputError', () => {
  const error = new UserInputError('Test error.', { extraProp: 'test' });
  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(ApolloError);
  expect(error.displayTitle).toEqual('User Input Error');
  expect(error.displayMessage).toEqual('Test error.');
  expect(error.name).toEqual('UserInputError');
  expect(error.extensions.displayTitle).toEqual('User Input Error');
  expect(error.extensions.displayMessage).toEqual('Test error.');
  expect(error.extensions.code).toEqual('USER_INPUT_ERROR');
  expect(error.extensions.extraProp).toEqual('test');
});

test('ConfigurationError', () => {
  const error = new ConfigurationError('Test error.', { extraProp: 'test' });
  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(ApolloError);
  expect(error.displayTitle).toEqual('Configuration Error');
  expect(error.displayMessage).toEqual('Test error.');
  expect(error.name).toEqual('ConfigurationError');
  expect(error.extensions.displayTitle).toEqual('Configuration Error');
  expect(error.extensions.displayMessage).toEqual('Test error.');
  expect(error.extensions.code).toEqual('CONFIGURATION_ERROR');
  expect(error.extensions.extraProp).toEqual('test');
});

test('TokenExpiredError', () => {
  const error = new TokenExpiredError('Test error.', { extraProp: 'test' });
  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(ApolloError);
  expect(error.displayTitle).toEqual('Token Expired');
  expect(error.displayMessage).toEqual('Test error.');
  expect(error.name).toEqual('TokenExpiredError');
  expect(error.extensions.displayTitle).toEqual('Token Expired');
  expect(error.extensions.displayMessage).toEqual('Test error.');
  expect(error.extensions.code).toEqual('TOKEN_EXPIRED');
  expect(error.extensions.extraProp).toEqual('test');
});

test('ServerError', () => {
  const error = new ServerError('Test error.', { extraProp: 'test' });
  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(ApolloError);
  expect(error.displayTitle).toEqual('Server Error');
  expect(error.displayMessage).toEqual('Test error.');
  expect(error.name).toEqual('ServerError');
  expect(error.extensions.displayTitle).toEqual('Server Error');
  expect(error.extensions.displayMessage).toEqual('Test error.');
  expect(error.extensions.code).toEqual('INTERNAL_SERVER_ERROR');
  expect(error.extensions.extraProp).toEqual('test');
});

test('RequestError', () => {
  const error = new RequestError('Test error.', { extraProp: 'test' });
  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(ApolloError);
  expect(error.displayTitle).toEqual('Request Error');
  expect(error.displayMessage).toEqual('Test error.');
  expect(error.name).toEqual('RequestError');
  expect(error.extensions.displayTitle).toEqual('Request Error');
  expect(error.extensions.displayMessage).toEqual('Test error.');
  expect(error.extensions.code).toEqual('REQUEST_ERROR');
  expect(error.extensions.extraProp).toEqual('test');
});
