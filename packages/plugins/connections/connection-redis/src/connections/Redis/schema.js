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

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - Redis',
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description:
        'The redis server url to connect to (redis[s]://[[username][:password]@][host][:port][/db-number])',
      errorMessage: {
        type: 'Redis property "url" should be a string.',
      },
    },
    socket: {
      type: 'object',
      description: 'Object defining socket connection properties.',
      properties: {
        host: {
          type: 'string',
          description: 'Hostname to connect to',
          default: 'localhost',
          errorMessage: {
            type: 'Redis property "socket.host" should be a string.',
          },
        },
        port: {
          type: 'number',
          description: 'Port to connect to',
          default: 6379,
          errorMessage: {
            type: 'Redis property "socket.port" should be a number.',
          },
        },
      },
      required: ['host', 'port'],
      errorMessage: {
        type: 'Redis property "socket" should be an object.',
      },
    },
    username: {
      type: 'string',
      description: 'ACL username',
      errorMessage: {
        type: 'Redis property "username" should be a string.',
      },
    },
    password: {
      type: 'string',
      description: 'ACL password',
      errorMessage: {
        type: 'Redis property "password" should be a string.',
      },
    },
    database: {
      type: 'number',
      description: 'Database number to connect to',
      minimum: 0,
      errorMessage: {
        type: 'Redis property "database" should be a number.',
      },
    },
  },
  oneOf: [
    {
      required: ['url'],
    },
    {
      required: ['socket'],
    },
  ],
  errorMessage: {
    type: 'Redis connection properties should be an object.',
    oneOf:
      'Redis connection should have required property "url" or "socket.host" and "socket.port".',
  },
};
