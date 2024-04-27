/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
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
