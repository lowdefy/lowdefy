/*
  Copyright 2020-2026 Lowdefy, Inc

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

import authJson from '../lib/build/auth.js';
import serverSidePropsWrapper from '../lib/server/serverSidePropsWrapper.js';
import Page from '../lib/client/Page.js';

async function getServerSidePropsHandler({ context, nextContext }) {
  const { pageId } = nextContext.params;
  const { logger, session } = context;
  const [rootConfig, pageConfig] = await Promise.all([
    getRootConfig(context),
    getPageConfig(context, { pageId }),
  ]);

  if (!pageConfig) {
    // If auth is configured and user is not authenticated, redirect to first public page
    if (authJson.configured && !session) {
      const loginPage = authJson.pages?.public?.[0] ?? '404';
      logger.info({ event: 'redirect_auth', pageId, loginPage });
      return {
        redirect: {
          destination: `/${loginPage}`,
          permanent: false,
        },
      };
    }
    logger.info({ event: 'redirect_page_not_found', pageId });
    return {
      redirect: {
        destination: '/404',
        permanent: false,
      },
    };
  }
  logger.info({ event: 'page_view', pageId });
  return {
    props: {
      pageConfig,
      rootConfig,
      session,
    },
  };
}

export const getServerSideProps = serverSidePropsWrapper(getServerSidePropsHandler);

export default Page;
