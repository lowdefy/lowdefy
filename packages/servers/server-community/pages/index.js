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

import { getPageConfig, getRootConfig } from '@lowdefy/api';

import serverSidePropsWrapper from '../lib/server/serverSidePropsWrapper.js';
import Page from '../lib/client/Page.js';

async function getServerSidePropsHandler({ context }) {
  const rootConfig = await getRootConfig(context);
  const { home } = rootConfig;
  const { logger } = context;
  if (home.configured === false) {
    logger.info({ event: 'redirect_to_homepage', pageId: home.pageId });
    return {
      redirect: {
        destination: `/${home.pageId}`,
        permanent: false,
      },
    };
  }
  const pageConfig = await getPageConfig(context, { pageId: home.pageId });
  if (!pageConfig) {
    logger.info({ event: 'redirect_page_not_found', pageId: home.pageId });
    return {
      redirect: {
        destination: '/404',
        permanent: false,
      },
    };
  }
  logger.info({ event: 'page_view', pageId: home.pageId });
  return {
    props: {
      pageConfig,
      rootConfig,
      session: context.session,
    },
  };
}

export const getServerSideProps = serverSidePropsWrapper(getServerSidePropsHandler);

export default Page;
