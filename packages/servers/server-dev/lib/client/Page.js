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

import React, { useEffect, useRef } from 'react';
import { GenIcon } from 'react-icons/lib';
import Client from '@lowdefy/client';

import BuildErrorPage from './BuildErrorPage.js';
import InstallingPluginsPage from './InstallingPluginsPage.js';
import RestartingPage from './RestartingPage.js';
import usePageConfig from './utils/usePageConfig.js';

const Page = ({
  auth,
  Components,
  config,
  jsMap,
  lowdefy,
  pageId,
  resetContext,
  router,
  types,
}) => {
  const { data: pageConfig } = usePageConfig(pageId, router.basePath);

  // Push build warnings to ErrorBar via runtime error callback
  const pushedWarningsRef = useRef(null);
  useEffect(() => {
    if (pageConfig?._warnings && pageConfig._warnings !== pushedWarningsRef.current) {
      pushedWarningsRef.current = pageConfig._warnings;
      for (const warning of pageConfig._warnings) {
        lowdefy._runtimeErrorCallback?.(warning);
      }
    }
  }, [pageConfig?._warnings, lowdefy]);

  if (!pageConfig) {
    router.replace(`/404`);
    return '';
  }
  if (pageConfig.buildError) {
    return (
      <BuildErrorPage
        errors={pageConfig.errors}
        message={pageConfig.message}
        source={pageConfig.source}
      />
    );
  }
  if (pageConfig.installing) {
    return <InstallingPluginsPage packages={pageConfig.packages} />;
  }
  if (resetContext.restarting) {
    return <RestartingPage />;
  }

  // Merge dynamic JS entries fetched after JIT build with the static jsMap
  const mergedJsMap = pageConfig._jsEntries ? { ...jsMap, ...pageConfig._jsEntries } : jsMap;

  // Merge JIT-discovered icon data into the static icons object.
  // createIcon.js looks up Icons[name] on every render from the captured reference,
  // so mutating the original object makes new icons available immediately.
  if (pageConfig._dynamicIcons) {
    for (const [name, data] of Object.entries(pageConfig._dynamicIcons)) {
      if (!types.icons[name]) {
        types.icons[name] = GenIcon(data);
      }
    }
  }

  return (
    <Client
      auth={auth}
      Components={Components}
      config={{
        ...config,
        pageConfig,
      }}
      jsMap={mergedJsMap}
      lowdefy={lowdefy}
      resetContext={resetContext}
      router={router}
      stage="dev"
      types={types}
      window={window}
    />
  );
};

export default Page;
