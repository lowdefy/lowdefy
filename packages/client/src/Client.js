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

import DisplayMessage from './page/DisplayMessage';
import LowdefyContext from './LowdefyContext';
import Page from './page/Page';

const Client = () => (
  <React.StrictMode>
    <ErrorBoundary fullPage>
      <Suspense fallback={<div id="loading-lowdefy-root"></div>}>
        <BrowserRouter>
          <LowdefyContext>
            {(lowdefy) => (
              <>
                <DisplayMessage
                  methods={{
                    registerMethod: (_, method) => {
                      lowdefy.displayMessage = method;
                    },
                  }}
                />
                <Switch>
                  <Route exact path={'/:pageId'}>
                    <Page lowdefy={lowdefy} />
                  </Route>
                </Switch>
              </>
            )}
          </LowdefyContext>
        </BrowserRouter>
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);

export default Client;
