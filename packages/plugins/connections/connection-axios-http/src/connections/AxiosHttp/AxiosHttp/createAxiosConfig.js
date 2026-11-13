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

import http from 'node:http';
import https from 'node:https';

import axios from 'axios';
import { mergeObjects, type } from '@lowdefy/helpers';

import checkAllowedHost from './checkAllowedHost.js';
import connectionOnlyProperties from '../connectionOnlyProperties.js';
import createPublicAgent from './createPublicAgent.js';
import unsupportedProperties from '../unsupportedProperties.js';

function createAxiosConfig({ connection, request }) {
  const config = mergeObjects([connection, request]);
  // Request properties can be filled from the client payload, so the properties that decide where
  // the server may connect always hold the connection's value. The request schema refuses them
  // too; this keeps that true for any caller that skips the schema.
  connectionOnlyProperties.forEach((key) => {
    if (type.isUndefined(connection[key])) {
      delete config[key];
    } else {
      config[key] = connection[key];
    }
  });
  unsupportedProperties.forEach((key) => {
    delete config[key];
  });

  const { allowedHosts, allowInternalAddresses, httpAgentOptions, httpsAgentOptions } = config;
  delete config.allowedHosts;
  delete config.allowInternalAddresses;
  delete config.httpAgentOptions;
  delete config.httpsAgentOptions;

  // The http adapter sends every socket through the agents below. The fetch adapter would not.
  config.adapter = 'http';
  config.beforeRedirect = (options) => checkAllowedHost({ allowedHosts, url: options.href });
  checkAllowedHost({ allowedHosts, url: axios.getUri(config) });

  if (allowInternalAddresses === true) {
    if (!type.isNone(httpAgentOptions)) {
      config.httpAgent = new http.Agent(httpAgentOptions);
    }
    if (!type.isNone(httpsAgentOptions)) {
      config.httpsAgent = new https.Agent(httpsAgentOptions);
    }
    return config;
  }

  // Each of these connects somewhere the agents' address check cannot see: a local socket, a
  // proxy that resolves and connects on the server's behalf, or the HTTP/2 transport, which
  // does not use the agents.
  if (!type.isNone(config.socketPath)) {
    throw new Error(
      'AxiosHttp property "socketPath" needs "allowInternalAddresses: true" on the connection.'
    );
  }
  if (!type.isNone(config.proxy)) {
    throw new Error(
      'AxiosHttp property "proxy" needs "allowInternalAddresses: true" on the connection, since the server cannot check the address a proxy connects to.'
    );
  }
  if (config.httpVersion === 2) {
    throw new Error(
      'AxiosHttp property "httpVersion: 2" needs "allowInternalAddresses: true" on the connection, since HTTP/2 connections skip the address check.'
    );
  }
  // false, not undefined: undefined makes axios read HTTP_PROXY and HTTPS_PROXY from the environment.
  config.proxy = false;
  config.httpAgent = createPublicAgent({ Agent: http.Agent, agentOptions: httpAgentOptions });
  config.httpsAgent = createPublicAgent({ Agent: https.Agent, agentOptions: httpsAgentOptions });
  return config;
}

export default createAxiosConfig;
