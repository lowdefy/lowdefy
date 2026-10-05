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
import Client from '@lowdefy/client';
import { pageInstanceKey } from '@lowdefy/helpers';

import BuildErrorPage from '../lib/client/BuildErrorPage.jsx';
import InstallingPluginsPage from '../lib/client/InstallingPluginsPage.jsx';
import RedirectingPage from '../lib/client/RedirectingPage.jsx';
import usePageConfig from '../lib/client/utils/usePageConfig.js';

const Page = ({
  auth,
  Components,
  config,
  jsMap,
  lowdefy,
  onPageShown,
  path,
  resetContext,
  router,
  types,
}) => {
  const { data } = usePageConfig(path, router.basePath);
  const pageConfig = data?.pageConfig;

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

  // Tells the in-page dev tools which page instance is on screen, from the fetched page.
  useEffect(() => {
    if (pageConfig) {
      onPageShown({
        pageId: data.pageId,
        pathParams: data.pathParams,
        instanceKey: pageInstanceKey({
          pageId: data.pageId,
          path: pageConfig.path,
          pathParams: data.pathParams,
        }),
      });
    }
  }, [pageConfig, data?.pageId, data?.pathParams, onPageShown]);

  // Full load to the sign-in page so it can return here after sign-in — an
  // effect, not a fetcher side effect, so the redirect re-fires if the same
  // cached result renders again.
  useEffect(() => {
    if (data?.authRedirect) {
      window.location.assign(data.authRedirect);
    }
  }, [data?.authRedirect]);

  if (!data) {
    router.replace({ pathname: '/404' });
    return '';
  }
  if (data.authRedirect) {
    return <RedirectingPage redirect={data.authRedirect} />;
  }
  if (data.buildError) {
    return <BuildErrorPage errors={data.errors} message={data.message} source={data.source} />;
  }
  if (data.installing) {
    return <InstallingPluginsPage packages={data.packages} />;
  }

  // Merge dynamic JS entries fetched after JIT build with the static jsMap
  const mergedJsMap = pageConfig._jsEntries ? { ...jsMap, ...pageConfig._jsEntries } : jsMap;

  // Merge JIT-delivered icon data into the static icons map. Icons are data
  // (IconData), and createIcon looks up Icons[name] on every render from the
  // captured reference, so mutating the original object makes them available
  // immediately.
  if (pageConfig._dynamicIcons) {
    Object.assign(types.icons, pageConfig._dynamicIcons);
  }

  // The build this config was served under, for the recorder to stamp on each
  // interaction. Set during render, like the icons above, so it is in place
  // before any interaction on this config.
  lowdefy._devBuildId = pageConfig._buildId ?? null;

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
      matchedPath={data.matchedPath}
      pathParams={data.pathParams}
      resetContext={resetContext}
      router={router}
      stage="dev"
      types={types}
      window={window}
    />
  );
};

export default Page;
