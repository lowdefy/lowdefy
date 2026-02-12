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
import Client from '@lowdefy/client';
import Head from 'next/head';
import Link from 'next/link';

import actions from '../../build/plugins/actions.js';
import blocks from '../../build/plugins/blocks.js';
import icons from '../../build/plugins/icons.js';
import operators from '../../build/plugins/operators/client.js';
import jsMap from '../../build/plugins/operators/clientJsMap.js';

const Page = ({ auth, lowdefy, pageConfig, rootConfig }) => {
  const router = useRouter();
  return (
    <Client
      auth={auth}
      Components={{ Head, Link }}
      config={{
        pageConfig,
        rootConfig,
      }}
      jsMap={jsMap}
      lowdefy={lowdefy}
      router={router}
      types={{
        actions,
        blocks,
        icons,
        operators,
      }}
      window={window}
    />
  );
};

export default Page;
