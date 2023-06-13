/*
  Copyright 2020-2023 Lowdefy, Inc

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

import { getPageConfig, getRootConfig } from '@lowdefy/api';

import logPageView from '../lib/log/logPageView.js';
import requestWrapper from '../lib/requestWrapper.js';
import Page from '../lib/Page.js';

async function getServerSidePropsHandler(nextContext, context) {
  const { pageId } = nextContext.params;
  logPageView({ context, nextContext, pageId });

  const [rootConfig, pageConfig] = await Promise.all([
    getRootConfig(context),
    getPageConfig(context, { pageId }),
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
      session: context.session,
    },
  };
}

export const getServerSideProps = requestWrapper(getServerSidePropsHandler);

export default Page;
