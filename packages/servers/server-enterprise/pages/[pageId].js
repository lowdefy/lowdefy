/*
  Copyright (C) 2023 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2027-10-09

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import { getPageConfig, getRootConfig } from '@lowdefy/api';

import serverSidePropsWrapper from '../lib/server/serverSidePropsWrapper.js';
import Page from '../lib/client/Page.js';

async function getServerSidePropsHandler({ context, nextContext }) {
  const { pageId } = nextContext.params;
  const { logger, license, session } = context;
  const [rootConfig, pageConfig] = await Promise.all([
    getRootConfig(context),
    getPageConfig(context, { pageId }),
  ]);

  if (!pageConfig) {
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
      license,
    },
  };
}

export const getServerSideProps = serverSidePropsWrapper(getServerSidePropsHandler);

export default Page;
