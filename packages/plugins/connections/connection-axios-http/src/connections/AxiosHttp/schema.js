/*
  Copyright 2020-2026 Lowdefy, Inc

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

import createRefusedPropertiesSchema from './createRefusedPropertiesSchema.js';
import unsupportedProperties from './unsupportedProperties.js';

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - AxiosHttp',
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description: 'The server URL that will be used for the request.',
      errorMessage: {
        type: 'AxiosHttp property "url" should be a string.',
      },
    },
    method: {
      type: 'string',
      enum: ['get', 'delete', 'head', 'options', 'post', 'put', 'patch'],
      description: 'The request method to be used when making the request',
      errorMessage: {
        type: 'AxiosHttp property "method" should be a string.',
        enum: 'AxiosHttp property "method" is not a valid value.',
      },
    },
    baseURL: {
      type: 'string',
      description:
        'baseURL will be prepended to url unless url is absolute. It can be convenient to set baseURL for an axios connection so that requests can use relative urls.',
      errorMessage: {
        type: 'AxiosHttp property "baseURL" should be a string.',
      },
    },
    headers: {
      type: 'object',
      description:
        'An object with custom headers to be sent with the request. The object keys should be header names, and the values should be the string header values.',
      errorMessage: {
        type: 'AxiosHttp property "headers" should be an object.',
      },
    },
    params: {
      type: 'object',
      description: 'An object with URL parameters to be sent with the request.',
      errorMessage: {
        type: 'AxiosHttp property "params" should be an object.',
      },
    },
    data: {
      description:
        "The data to be sent as the request body. Only applicable for request methods 'put', 'post', and 'patch'. Can be an object, array or a string in the format 'Country=USA&City=New York'.",
    },
    timeout: {
      type: 'number',
      description:
        'The number of milliseconds before the request times out. If the request takes longer than timeout, the request will be aborted. Set to 0 for no timeout.',
      default: 0,
      errorMessage: {
        type: 'AxiosHttp property "timeout" should be a number.',
      },
    },
    auth: {
      type: 'object',
      description:
        'Indicates that HTTP Basic authorization should be used, and supplies credentials. This will set an Authorization header, overwriting any existing Authorization custom headers you have set using headers. Only HTTP Basic auth is configurable through this parameter, for Bearer tokens and such, use Authorization custom headers instead.',
      properties: {
        username: {
          type: 'string',
          description: 'HTTP Basic authorization username.',
          errorMessage: {
            type: 'AxiosHttp property "auth.username" should be a string.',
          },
        },
        password: {
          type: 'string',
          description: 'HTTP Basic authorization password.',
          errorMessage: {
            type: 'AxiosHttp property "auth.password" should be a string.',
          },
        },
      },
      errorMessage: {
        type: 'AxiosHttp property "auth" should be an object.',
      },
    },
    responseType: {
      type: 'string',
      enum: ['json', 'document', 'text'],
      description: 'The type of data that the server should respond with.',
      default: 'json',
      errorMessage: {
        type: 'AxiosHttp property "responseType" should be a string.',
        enum: 'AxiosHttp property "responseType" is not a valid value.',
      },
    },
    responseEncoding: {
      type: 'string',
      description: 'Indicates encoding to use for decoding responses.',
      default: 'utf8',
      errorMessage: {
        type: 'AxiosHttp property "responseEncoding" should be a string.',
      },
    },
    maxContentLength: {
      type: 'number',
      description: 'Defines the max size of the http response content allowed in bytes.',
      errorMessage: {
        type: 'AxiosHttp property "maxContentLength" should be a number.',
      },
    },
    maxRedirects: {
      type: 'number',
      description:
        'Defines the maximum number of redirects to follow. If set to 0, no redirects will be followed.',
      default: 5,
      errorMessage: {
        type: 'AxiosHttp property "maxRedirects" should be a number.',
      },
    },
    proxy: {
      type: 'object',
      description:
        'Defines the hostname and port of the proxy server. Connection only. Needs "allowInternalAddresses: true", since the server cannot check the address a proxy connects to.',
      errorMessage: {
        type: 'AxiosHttp property "proxy" should be an object.',
      },
    },
    allowInternalAddresses: {
      type: 'boolean',
      default: false,
      description:
        'Allow requests to addresses that are not public: localhost, private networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), link-local addresses such as the cloud metadata endpoint, and the like. Set it to call a service on the same machine or network, such as a localhost API, a Docker service name or a private network API. Also needed for "socketPath", "proxy" and "httpVersion: 2". Connection only.',
      errorMessage: {
        type: 'AxiosHttp property "allowInternalAddresses" should be a boolean.',
      },
    },
    allowedHosts: {
      type: 'array',
      items: {
        type: 'string',
      },
      description:
        'The hostnames requests may connect to, matched exactly and ignoring case (no wildcards or ports). A request to any other host, including a redirect to one, is refused. Applies alongside "allowInternalAddresses": an internal host must be listed and allowed. Connection only.',
      errorMessage: {
        type: 'AxiosHttp property "allowedHosts" should be an array of strings.',
      },
    },
    httpAgentOptions: {
      type: 'object',
      description: 'Options for the Node.js http.Agent used by requests. Connection only.',
      errorMessage: {
        type: 'AxiosHttp property "httpAgentOptions" should be an object.',
      },
    },
    httpsAgentOptions: {
      type: 'object',
      description: 'Options for the Node.js https.Agent used by requests. Connection only.',
      errorMessage: {
        type: 'AxiosHttp property "httpsAgentOptions" should be an object.',
      },
    },
    socketPath: {
      type: 'string',
      description:
        'A Unix socket to send requests to instead of a host. Needs "allowInternalAddresses: true". Connection only.',
      errorMessage: {
        type: 'AxiosHttp property "socketPath" should be a string.',
      },
    },
    ...createRefusedPropertiesSchema({
      keys: unsupportedProperties,
      reason: 'is not supported, since AxiosHttp sets it to check the address it connects to.',
    }),
  },
};
