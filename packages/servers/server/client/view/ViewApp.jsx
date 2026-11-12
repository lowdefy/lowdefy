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

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { serializer } from '@lowdefy/helpers';

import appMeta from '../../build/appMeta.json';
import rawAuthConfig from '../../build/auth.json';
import createLogUsage from '../../lib/client/createLogUsage.js';
import AppShell from '../AppShell.jsx';
import loadPageTypes from '../loadPageTypes.js';
import createViewAuth from './createViewAuth.js';
import loadViewStart from './loadViewStart.js';
import ViewNewBuild from './ViewNewBuild.jsx';
import ViewPage from './ViewPage.jsx';

const authConfig = serializer.deserialize(rawAuthConfig);

// The app of an MCP App view. start is what loadViewStart answered: the root
// config, the user and the first page. The user comes from /api/user for the
// view's session; no auth client or session hook is loaded.
//
// The frame is never reloaded. When the app answers as another caller, or the
// page asks for a reload, everything is fetched again for the router's
// location and the page is built again on a new lowdefy object, as a reload
// would. A new session for the same person does none of this: the view host
// swaps the token and the page keeps its state. When the app runs another
// build, a button loads it (loadBuild).
function ViewApp({ host, loadBuild, start }) {
  const [shown, setShown] = useState({ ...start, generation: 0 });
  const [newBuild, setNewBuild] = useState(start.newBuild);

  // Usage logging is made once and outlives a page built again, so it keeps
  // the time of its last call. It posts to the app with the view's session.
  const usageDataRef = useRef({});
  usageDataRef.current.user = shown.user?.id;
  const logUsage = useMemo(() => createLogUsage({ host, usageDataRef }), []);

  // buildId is sent with every request and endpoint call so the server refuses
  // calls from a view still running an earlier build.
  const lowdefy = useMemo(
    () => ({ buildId: appMeta.buildId, eventCallback: logUsage }),
    [shown.generation]
  );
  const auth = useMemo(() => createViewAuth({ authConfig, user: shown.user }), [shown.user]);

  useEffect(() => {
    async function showCurrentCaller() {
      try {
        const next = await loadViewStart({ bundleBuildId: appMeta.buildId, host, loadPageTypes });
        if (next.newBuild) {
          setNewBuild(true);
          return;
        }
        setShown((current) => ({ ...next, generation: current.generation + 1 }));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        host.view.end({ message: 'The view could not load the page again.' });
      }
    }
    const stops = [
      host.view.onBuildChange(() => setNewBuild(true)),
      host.view.onCallerChange(showCurrentCaller),
      host.view.onReload(showCurrentCaller),
    ];
    return () => stops.forEach((stop) => stop());
  }, []);

  return (
    <AppShell basePath={host.router.basePath} lowdefy={lowdefy} rootConfig={shown.rootConfig}>
      {newBuild && <ViewNewBuild onLoad={loadBuild} />}
      {shown.page !== null && (
        <ViewPage
          key={shown.generation}
          auth={auth}
          firstPage={shown.page}
          host={host}
          lowdefy={lowdefy}
          rootConfig={shown.rootConfig}
        />
      )}
    </AppShell>
  );
}

export default ViewApp;
