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

/* eslint-disable max-classes-per-file */

import { ApolloError } from 'apollo-server';

class AuthenticationError extends ApolloError {
  constructor(message, additionalProperties) {
    const properties = {
      displayTitle: 'Authentication Error',
      displayMessage: message,
      ...additionalProperties,
    };
    super(message, 'UNAUTHENTICATED', properties);
    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}

class ForbiddenError extends ApolloError {
  constructor(message, additionalProperties) {
    const properties = {
      displayTitle: 'Forbidden',
      displayMessage: message,
      ...additionalProperties,
    };
    super(message, 'FORBIDDEN', properties);
    Object.defineProperty(this, 'name', { value: 'ForbiddenError' });
  }
}

class UserInputError extends ApolloError {
  constructor(message, additionalProperties) {
    const properties = {
      displayTitle: 'User Input Error',
      displayMessage: message,
      ...additionalProperties,
    };
    super(message, 'USER_INPUT_ERROR', properties);
    Object.defineProperty(this, 'name', { value: 'UserInputError' });
  }
}

class ConfigurationError extends ApolloError {
  constructor(message, additionalProperties) {
    const properties = {
      displayTitle: 'Configuration Error',
      displayMessage: message,
      ...additionalProperties,
    };
    super(message, 'CONFIGURATION_ERROR', properties);
    Object.defineProperty(this, 'name', { value: 'ConfigurationError' });
  }
}

class TokenExpiredError extends ApolloError {
  constructor(message, additionalProperties) {
    const properties = {
      displayTitle: 'Token Expired',
      displayMessage: message,
      ...additionalProperties,
    };
    super(message, 'TOKEN_EXPIRED', properties);
    Object.defineProperty(this, 'name', { value: 'TokenExpiredError' });
  }
}

class ServerError extends ApolloError {
  constructor(message, additionalProperties) {
    const properties = {
      displayTitle: 'Server Error',
      displayMessage: message,
      ...additionalProperties,
    };
    super(message, 'INTERNAL_SERVER_ERROR', properties);
    Object.defineProperty(this, 'name', { value: 'ServerError' });
  }
}

class RequestError extends ApolloError {
  constructor(message, additionalProperties) {
    const properties = {
      displayTitle: 'Request Error',
      displayMessage: message,
      ...additionalProperties,
    };
    super(message, 'REQUEST_ERROR', properties);
    Object.defineProperty(this, 'name', { value: 'RequestError' });
  }
}

export {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
  ConfigurationError,
  TokenExpiredError,
  ServerError,
  RequestError,
};
