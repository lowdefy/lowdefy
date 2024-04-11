/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { useRouter } from 'next/router';

import Head from 'next/head';
import Link from 'next/link';

import Reload from './Reload.js';
import Page from './Page.js';
import setPageId from './setPageId.js';
import useRootConfig from './utils/useRootConfig.js';

import actions from '../../build/plugins/actions.js';
import blocks from '../../build/plugins/blocks.js';
import icons from '../../build/plugins/icons.js';
import operators from '../../build/plugins/operators/client.js';
import jsMap from '../../build/plugins/operators/clientJsMap.js';

const App = ({ auth, lowdefy }) => {
  const router = useRouter();
  const { data: rootConfig } = useRootConfig(router.basePath);

  const { redirect, pageId } = setPageId(router, rootConfig);
  if (redirect) {
    router.push(`/${pageId}`);
    return '';
  }
  return (
    <Reload basePath={router.basePath} lowdefy={lowdefy}>
      {(resetContext) => (
        <Page
          auth={auth}
          Components={{ Head, Link }}
          config={{
            rootConfig,
          }}
          jsMap={jsMap}
          lowdefy={lowdefy}
          pageId={pageId}
          resetContext={resetContext}
          router={router}
          types={{
            actions,
            blocks,
            icons,
            operators,
          }}
        />
      )}
    </Reload>
  );
};

export default App;
