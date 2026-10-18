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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, LogBox, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Accelerometer } from 'expo-sensors';
import { installDictationSource } from '@lowdefy/blocks-native/dictation';

import AppProvider from '../components/AppProvider.js';
import ConfirmSheet from './connect/ConfirmSheet.js';
import ConnectScreen from './connect/ConnectScreen.js';
import createDevShellConfig from './connection/createDevShellConfig.js';
import createDeviceInjections from './inject/createDeviceInjections.js';
import createDeviceStore from '../host/createDeviceStore.js';
import createLogBuffer from './menu/createLogBuffer.js';
import createOfflineFetch from './inject/createOfflineFetch.js';
import createServerList, { SERVERS_KEY } from './connection/createServerList.js';
import DevMenu from './menu/DevMenu.js';
import DevTabClient from './tab/DevTabClient.js';
import Frame from '../components/Frame.js';
import getShellConfig from '../config/getShellConfig.js';
import injected, { installInjector } from '../device/injected.js';
import isLoopbackHost from './connection/isLoopbackHost.js';
import networkStatus from '../host/networkStatus.js';
import parseDevLink from './connection/parseDevLink.js';
import reloadApp from './tab/reloadApp.js';
import watchShake from './menu/watchShake.js';

// Lowdefy Dev reports errors in its own log (the dev menu) and to the dev server's build status.
// React Native's LogBox toasts would cover the tab bar and every screenshot an agent takes.
LogBox.ignoreAllLogs();

/**
 * Lowdefy Dev: the shell with developer features, in place of ShellRoot. It opens one app, the
 * dev server it is connected to:
 * - It connects to the last server it used, to a server a `lowdefy-dev://connect` link names, or
 *   to one picked on the connect screen (a scanned code, a typed address, a recent server). It asks
 *   "Connect to <host>?" first for any server not on this device: a simulator's or USB phone's
 *   localhost connects at once, which is how `lowdefy dev --ios` and `--android` open it.
 * - Shaking the phone (or a `lowdefy-dev://menu` link) opens the dev menu.
 * - The open app joins the dev server's tab channel (DevTabClient), which records what is done in
 *   it and takes device injections: the next scan, photo or NFC read, what the next dictation
 *   session hears, a location, a permission answer, or no network, which fails the app's every
 *   fetch and shows the NoConnection banner (createDeviceInjections).
 *
 * @param {Object} props
 * @param {Object} [props.accelerometer] expo-sensors' Accelerometer.
 * @param {Object} [props.kv] The device store.
 * @param {Object} [props.linking] React Native's Linking.
 * @param {Object} [props.shell] The shell config.
 */
function DevShell({
  accelerometer = Accelerometer,
  kv: kvProp,
  linking = Linking,
  shell: shellProp,
}) {
  const shell = useMemo(() => shellProp ?? getShellConfig(), [shellProp]);
  const kv = useMemo(() => kvProp ?? createDeviceStore(), [kvProp]);
  const servers = useMemo(() => createServerList({ kv }), [kv]);
  const logs = useMemo(() => createLogBuffer({ console: globalThis.console }), []);
  const injections = useMemo(() => createDeviceInjections({ networkStatus }), []);
  const rootRef = useRef(null);
  const openApp = useRef(null);
  const [server, setServer] = useState(() => servers.last());
  const [offered, setOffered] = useState(null);
  const [message, setMessage] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openings, setOpenings] = useState(0);

  const connect = useCallback(
    (target) => {
      servers.remember(target);
      setOffered(null);
      setMessage(null);
      setServer({ url: target.url, host: target.host, pair: target.pair ?? null });
    },
    [servers]
  );

  const offer = useCallback(
    (target) => {
      if (isLoopbackHost(target.host)) {
        connect(target);
        return;
      }
      setOffered(target);
    },
    [connect]
  );

  const handleLink = useCallback(
    (link) => {
      const parsed = parseDevLink({ link, scheme: shell.scheme });
      if (parsed === null) return false;
      if (parsed.kind === 'menu') setMenuOpen(true);
      if (parsed.kind === 'invalid') setMessage(parsed.reason);
      if (parsed.kind === 'connect') offer(parsed);
      return true;
    },
    [offer, shell.scheme]
  );

  useEffect(() => logs.install(), [logs]);

  useEffect(() => installInjector(injections), [injections]);

  // The native inputs' dictation plays injected transcripts in place of the microphone.
  useEffect(() => installDictationSource(injected), []);

  useEffect(() => {
    linking.getInitialURL().then((link) => link && handleLink(link));
    const subscription = linking.addEventListener('url', ({ url }) => handleLink(url));
    return () => subscription.remove();
  }, [handleLink, linking]);

  useEffect(() => watchShake({ accelerometer, onShake: () => setMenuOpen(true) }), [accelerometer]);

  useEffect(() => {
    if (server === null) SplashScreen.hideAsync();
  }, [server]);

  const devShell = useMemo(
    () =>
      server === null
        ? null
        : createDevShellConfig({
            fetch: createOfflineFetch({
              fetch: globalThis.fetch,
              isOffline: injections.isOffline,
            }),
            server,
            shell,
          }),
    [injections, server, shell]
  );

  const onApp = useCallback((app) => {
    openApp.current = app;
  }, []);

  // An app that could not open is opened again.
  function reload() {
    if (openApp.current === null) {
      setOpenings((count) => count + 1);
      return;
    }
    reloadApp({ session: openApp.current.session }).catch((error) => logs.add('error', error));
  }

  // Signs out, which removes the session token and every cached page of this server's app, then
  // removes the rest of what the device store holds for apps (keeping Lowdefy Dev's server list)
  // and opens the app afresh.
  async function clearData() {
    if (openApp.current !== null) {
      await openApp.current.auth.signOut();
    }
    kv.keys()
      .filter((key) => key !== SERVERS_KEY)
      .forEach((key) => kv.remove(key));
    setOpenings((count) => count + 1);
  }

  const sheet = (
    <ConfirmSheet
      onCancel={() => setOffered(null)}
      onConfirm={() => connect(offered)}
      server={offered}
    />
  );
  const menu = (
    <DevMenu
      logs={logs}
      onClearData={clearData}
      onClose={() => setMenuOpen(false)}
      onReload={reload}
      onSwitchServer={() => setServer(null)}
      server={server?.host ?? null}
      shell={shell}
      visible={menuOpen}
    />
  );

  if (devShell === null) {
    return (
      <>
        <ConnectScreen
          message={message}
          onOffer={offer}
          onPick={connect}
          onScanned={(text) => {
            if (!handleLink(text)) setMessage('That code is not one lowdefy dev printed.');
          }}
          recent={servers.list()}
          scheme={shell.scheme}
        />
        {sheet}
        {menu}
      </>
    );
  }
  return (
    <View collapsable={false} ref={rootRef} style={{ flex: 1 }}>
      <AppProvider key={`${devShell.app.id}:${openings}`} shell={devShell}>
        <Frame />
        <DevTabClient injections={injections} kv={kv} logs={logs} onApp={onApp} rootRef={rootRef} />
      </AppProvider>
      {sheet}
      {menu}
    </View>
  );
}

export default DevShell;
