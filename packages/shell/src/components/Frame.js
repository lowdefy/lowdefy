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

import React, { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';

import FRAME_SLOTS from '../navigation/frameSlots.js';
import getFrame from '../navigation/getFrame.js';
import { useSessionState, useShell } from '../ShellContext.js';

// The app's frame from its mobile menus: native tabs, one stack per tab, or one stack (with a menu
// button for a drawer). Each tab is a route group of app/(t0,t1,t2,t3,t4); tabs past the menu's
// items are hidden.
function Frame() {
  const { session } = useShell();
  const state = useSessionState();
  const frame = getFrame(state.root.menus);

  // After a caller change the shell starts again from the home page.
  useEffect(() => {
    if (!session.takeHomeRequest()) return;
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  }, [session, state.homeRequests]);

  if (frame.kind === 'tabs') {
    return (
      <NativeTabs>
        {FRAME_SLOTS.map((slot, index) => {
          const item = frame.items[index];
          return (
            <NativeTabs.Trigger hidden={item === undefined} key={slot} name={`(${slot})`}>
              <NativeTabs.Trigger.Label>
                {item?.title ?? item?.pageId ?? ''}
              </NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
          );
        })}
      </NativeTabs>
    );
  }
  return (
    <Stack initialRouteName="(t0)" screenOptions={{ headerShown: false }}>
      {FRAME_SLOTS.map((slot) => (
        <Stack.Screen key={slot} name={`(${slot})`} />
      ))}
    </Stack>
  );
}

export default Frame;
