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

import React, { Suspense } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import { ErrorBoundary } from '@lowdefy/block-tools';
import { get } from '@lowdefy/helpers';

import Page from './page/Page';
import useRootData from './swr/useRootData';

const lowdefy = {
  basePath: window.lowdefy.basePath,
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

const RootData = ({ children, lowdefy }) => {
  const { data } = useRootData();
  console.log('RootData', data);

  lowdefy.homePageId = data.homePageId;
  lowdefy.menus = data.menus;
  lowdefy.lowdefyGlobal = JSON.parse(JSON.stringify(get(data, 'lowdefyGlobal', { default: {} })));
  return <>{children}</>;
};

const Root = () => {
  lowdefy.updateBlock = (blockId) => lowdefy.updaters[blockId] && lowdefy.updaters[blockId]();
  lowdefy.user = {};
  return (
    <RootData lowdefy={lowdefy}>
      <Switch>
        <Route exact path={'/:pageId'}>
          <Page lowdefy={lowdefy} />
        </Route>
      </Switch>
    </RootData>
  );
};

const Client = () => (
  <ErrorBoundary fullPage>
    <Suspense fallback={<div id="loading-lowdefy-root"></div>}>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </Suspense>
  </ErrorBoundary>
);

export default Client;
