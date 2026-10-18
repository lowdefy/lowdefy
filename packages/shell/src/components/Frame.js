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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useTheme } from '@lowdefy/client-native';

import FRAME_SLOTS from '../navigation/frameSlots.js';
import getFrame from '../navigation/getFrame.js';
import getTabIcons from '../navigation/getTabIcons.js';
import TabIconImages from './TabIconImages.js';
import { useSessionState, useShell } from '../ShellContext.js';

// One tab's icon: its SF Symbol on iOS, else its Lucide icon drawn as an image once ready.
function TabIcon({ icon, image }) {
  if (icon.sf !== null) {
    return <NativeTabs.Trigger.Icon sf={icon.sf} />;
  }
  if (image === undefined) {
    return null;
  }
  return <NativeTabs.Trigger.Icon renderingMode="template" src={image} />;
}

// The tabs frame: a native tab bar, each tab a route group with its own stack. The selected tab
// takes the theme's tint. iOS 26 draws the bar's glass itself; before it, the bar blurs in the
// mode showing, and Android's bar takes the cell colour. A `role: search` item is iOS 26's search tab, set apart at the
// right of the bar with a magnifier; elsewhere it is a tab with its search icon.
function TabsFrame({ items }) {
  const { isDark, tokens } = useTheme();
  const icons = useMemo(() => getTabIcons({ items, platform: Platform.OS }), [items]);
  const [images, setImages] = useState({});
  const onImage = useCallback(
    (pageId, source) => setImages((current) => ({ ...current, [pageId]: source })),
    []
  );
  const imageItems = icons.filter((icon) => icon.iconData !== null);
  return (
    <>
      <NativeTabs
        backgroundColor={Platform.OS === 'ios' ? undefined : tokens.colorCell}
        blurEffect={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        iconColor={{ selected: tokens.colorTint }}
        labelStyle={{ selected: { color: tokens.colorTint } }}
        tintColor={tokens.colorTint}
      >
        {FRAME_SLOTS.map((slot, index) => {
          const item = items[index];
          return (
            <NativeTabs.Trigger
              hidden={item === undefined}
              key={slot}
              name={`(${slot})`}
              role={item?.role}
            >
              {item === undefined ? null : (
                <TabIcon icon={icons[index]} image={images[item.pageId]} />
              )}
              <NativeTabs.Trigger.Label>
                {item?.title ?? item?.pageId ?? ''}
              </NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
          );
        })}
      </NativeTabs>
      {imageItems.length > 0 ? <TabIconImages items={imageItems} onImage={onImage} /> : null}
    </>
  );
}

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
    return <TabsFrame items={frame.items} />;
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
