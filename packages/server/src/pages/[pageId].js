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

import getPageConfig from '@lowdefy/api/routes/page/getPageConfig.js';
import createContext from '@lowdefy/api/context/createContext.js';

import Page from '../components/Page.js';

export async function getServerSideProps(context) {
  const { pageId } = context.params;
  const apiContext = await createContext({});
  const pageConfig = await getPageConfig(apiContext, { pageId });

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
    },
  };
}

export default Page;
