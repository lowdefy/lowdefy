/*
  Copyright 2020-2022 Lowdefy, Inc

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

import { createApiContext, getPageConfig, getRootConfig } from '@lowdefy/api';

import Page from '../lib/components/Page.js';

export async function getServerSideProps() {
  // TODO: is this build directory configurable from the cli?
  const apiContext = await createApiContext({ buildDirectory: './build' });
  const rootConfig = await getRootConfig(apiContext);
  const { home } = rootConfig;
  if (home.configured === false) {
    return {
      redirect: {
        destination: `/${home.pageId}`,
        permanent: false,
      },
    };
  }
  const pageConfig = await getPageConfig(apiContext, { pageId: home.pageId });
  if (!pageConfig) {
    return {
      redirect: {
        destination: '/404',
        permanent: false,
      },
    };
  }
  return {
    props: {
      pageConfig,
      rootConfig,
    },
  };
}

export default Page;
