/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import { getPageConfig, getRootConfig } from '@lowdefy/api';

import serverSidePropsWrapper from '../lib/server/serverSidePropsWrapper.js';
import Page from '../lib/client/Page.js';

async function getServerSidePropsHandler({ context }) {
  const rootConfig = await getRootConfig(context);
  const { home } = rootConfig;
  const { logger, session } = context;
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
      session,
    },
  };
}

export const getServerSideProps = serverSidePropsWrapper(getServerSidePropsHandler);

export default Page;
