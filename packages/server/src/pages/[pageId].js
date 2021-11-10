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

import path from 'path';
import React from 'react';

import { readFile } from '@lowdefy/node-utils';
import { getSession } from 'next-auth/react';

import Page from '../components/Page.js';

const PageWrapper = ({ lowdefy, pageConfig }) => {
  return <Page lowdefy={lowdefy} pageConfig={pageConfig} />;
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  const { pageId } = context.params;
  const buildDirectory = path.join(process.cwd(), '.lowdefy/build');

  const pageContent = await readFile(path.join(buildDirectory, `pages/${pageId}/${pageId}.json`));

  if (!pageContent) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      session,
      pageConfig: JSON.parse(pageContent),
    },
  };
}

// export async function getStaticPaths(context) {
//   const buildDirectory = path.join(process.cwd(), '.lowdefy/build');
//   const pagesContent = await fs.readFile(path.join(buildDirectory, 'pages.json'), 'utf8');
//   const pagesConfig = JSON.parse(pagesContent);
//   const paths = pagesConfig.pages.map((page) => ({ params: { pageId: page.pageId } }));

//   return {
//     paths,
//     fallback: false,
//   };
// }

export default PageWrapper;
