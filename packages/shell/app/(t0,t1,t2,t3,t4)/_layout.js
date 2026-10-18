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

import React from 'react';
import { Stack } from 'expo-router';

import getFrame from '../../src/navigation/getFrame.js';
import MenuButton from '../../src/components/MenuButton.js';
import { useSessionState } from '../../src/ShellContext.js';

// A deep link opens on top of the group's first screen, so back leads to it.
export const unstable_settings = { initialRouteName: 'index' };

// The stack of one frame group (a tab, or the app's one stack). A drawer frame puts its menu
// button in the header of the group's first screen.
export default function GroupLayout() {
  const { root } = useSessionState();
  const frame = getFrame(root.menus);
  return (
    <Stack screenOptions={{ title: '' }}>
      <Stack.Screen
        name="index"
        options={
          frame.kind === 'drawer' ? { headerLeft: () => <MenuButton items={frame.items} /> } : {}
        }
      />
      <Stack.Screen name="[...path]" />
    </Stack>
  );
}
