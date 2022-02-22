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

import { createApiContext, getPageConfig, getRootConfig } from '@lowdefy/api';

import Page from '../lib/components/Page.js';

export async function getServerSideProps(context) {
  const { pageId } = context.params;
  // TODO: get the right api context options
  const apiContext = await createApiContext({ buildDirectory: './build' });

  const [rootConfig, pageConfig] = await Promise.all([
    getRootConfig(apiContext),
    getPageConfig(apiContext, { pageId }),
  ]);

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
