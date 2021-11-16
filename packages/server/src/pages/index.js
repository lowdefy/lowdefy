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
import createApiContext from '@lowdefy/api/context/createApiContext';
import getHomePageId from '@lowdefy/api/routes/rootConfig/getHomePageId.js';
import getPageConfig from '@lowdefy/api/routes/page/getPageConfig';
import getRootConfig from '@lowdefy/api/routes/rootConfig/getRootConfig';

import Page from '../components/Page.js';

export async function getServerSideProps() {
  const apiContext = await createApiContext({ buildDirectory: './.lowdefy/build' });
  const homePageIdData = await getHomePageId(apiContext);
  if (homePageIdData.configured === false) {
    return {
      redirect: {
        destination: `/${homePageIdData.homePageId}`,
        permanent: false,
      },
    };
  }

  const [rootConfig, pageConfig] = await Promise.all([
    getRootConfig(apiContext),
    getPageConfig(apiContext, { pageId: homePageIdData.homePageId }),
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
