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

import React from 'react';

import createLogin from './auth/createLogin';
import createLogout from './auth/createLogout';
import getCookie from './utils/getCookie';
import parseJwt from './auth/parseJwt';
import useRootData from './swr/useRootData';

const lowdefy = {
  basePath: window.lowdefy.basePath,
  // TODO: rename contexts to pages
  contexts: {},
  displayMessage: () => () => undefined,
  document,
  imports: {
    jsActions: window.lowdefy.imports.jsActions,
    jsOperators: window.lowdefy.imports.jsOperators,
  },
  inputs: {},
  link: () => {},
  localStorage,
  registerJsAction: window.lowdefy.registerJsAction,
  registerJsOperator: window.lowdefy.registerJsOperator,
  updaters: {},
  window,
};

delete window.lowdefy.imports;
if (window.location.origin.includes('http://localhost')) {
  window.lowdefy = lowdefy;
}

const LowdefyContext = ({ children }) => {
  const { data } = useRootData();

  lowdefy.auth = {
    login: createLogin(lowdefy),
    logout: createLogout(lowdefy),
  };
  lowdefy.homePageId = data.homePageId;
  lowdefy.lowdefyGlobal = data.lowdefyGlobal;
  lowdefy.menus = data.menus;
  lowdefy.updateBlock = (blockId) => lowdefy.updaters[blockId] && lowdefy.updaters[blockId]();
  lowdefy.user = {};

  if (data.authenticated) {
    const idToken = getCookie(lowdefy, { cookieName: 'idToken' });

    if (!idToken) {
      lowdefy.auth.logout();
      // Throw promise to suspend till user is logged out.
      throw new Promise(() => {});
    }
    // eslint-disable-next-line no-unused-vars
    const { iat, exp, aud, iss, ...user } = parseJwt(idToken);
    lowdefy.user = user;
  }

  return <>{children}</>;
};

export default LowdefyContext;
