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
import { Platform, ScrollView, Text, View } from 'react-native';
import { BottomSheet } from '@expo/ui/community/bottom-sheet';
import {
  iosColors,
  NaturalSizeContext,
  ThemeContext,
  useScreenFocused,
  useTheme,
} from '@lowdefy/client-native';
import { type } from '@lowdefy/helpers';

import getSheetDetents from './getSheetDetents.js';
import meta from './meta.js';
import SheetCloseButton from '../../shared/SheetCloseButton.js';
import useComponentTokens from '../../useComponentTokens.js';

const CLOSED = -1;
const HEADER_HEIGHT = 44;

/**
 * A native sheet holding child blocks: a SwiftUI sheet with medium and large detents on iOS, a
 * Material modal bottom sheet on Android. It starts closed; the open and close methods present
 * and dismiss it, and onOpen and onClose fire as it does. A swipe down dismisses it too, unless
 * dragToDismiss is false. Its blocks mount while it is presented; their values stay in state.
 *
 * The sheet keeps the system's own background while the app shows the system's colour mode, and
 * takes the theme's elevated background when the app forces the other mode.
 */
function Sheet({ blockId, components, content, methods, properties, styles = {} }) {
  const { isDark, tokens } = useComponentTokens(properties.theme);
  // The sheet's content is drawn on the elevated grouped surfaces, as a presented sheet is on iOS,
  // so a grouped List in it stands off the sheet rather than taking the screen's colours.
  const theme = useTheme();
  const elevatedTheme = useMemo(
    () => ({
      ...theme,
      tokens: { ...theme.tokens, ...iosColors.elevated[isDark ? 'dark' : 'light'] },
    }),
    [isDark, theme]
  );
  // Kept while the colour is unchanged: iOS's BottomSheet re-applies its presentation modifiers
  // when backgroundStyle changes identity, which cancels a touch on the sheet.
  const backgroundColor = elevatedTheme.tokens.colorGroupedBackground;
  const backgroundStyle = useMemo(() => ({ backgroundColor }), [backgroundColor]);
  const [index, setIndex] = useState(CLOSED);
  const isOpen = index !== CLOSED;

  // The latest open state, read by the registered methods.
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  // A sheet is drawn above the whole app, so it closes when its screen stops being the one shown
  // (another tab picked, or a screen pushed over it); otherwise it would sit over the next screen.
  const focused = useScreenFocused();
  useEffect(() => {
    if (!focused && isOpenRef.current) {
      setIndex(CLOSED);
    }
  }, [focused]);

  useEffect(() => {
    methods.registerMethod('open', () => {
      if (isOpenRef.current) return;
      isOpenRef.current = true;
      setIndex(0);
      methods.triggerEvent({ name: 'onOpen' });
    });
    methods.registerMethod('close', () => {
      setIndex(CLOSED);
    });
  });

  const { snapPoints, resizable } = getSheetDetents({
    detents: properties.detents,
    platform: Platform.OS,
  });
  const dragToDismiss = properties.dragToDismiss !== false;
  const closable = properties.closable ?? !dragToDismiss;
  const title = type.isString(properties.title) ? properties.title : null;
  const hasHeader = title !== null || closable || Boolean(content.headerRight);

  return (
    <BottomSheet
      backgroundStyle={backgroundStyle}
      enableDynamicSizing={false}
      enablePanDownToClose={dragToDismiss}
      handleComponent={resizable ? undefined : null}
      index={index}
      onClose={() => {
        isOpenRef.current = false;
        setIndex(CLOSED);
        methods.triggerEvent({ name: 'onClose' });
      }}
      snapPoints={snapPoints}
    >
      <ThemeContext.Provider value={elevatedTheme}>
        <View style={[{ flex: 1 }, styles.element]} testID={blockId}>
          {hasHeader ? (
            <View
              style={[
                {
                  alignItems: 'center',
                  flexDirection: 'row',
                  minHeight: HEADER_HEIGHT,
                  paddingHorizontal: 16,
                },
                styles.header,
              ]}
            >
              {/* Balances the right side so the title sits in the centre, as a navigation bar's. */}
              <View style={{ flex: 1 }} />
              {title === null ? null : (
                <Text
                  accessibilityRole="header"
                  numberOfLines={1}
                  style={[
                    {
                      color: tokens.colorText,
                      fontSize: 17,
                      fontWeight: '600',
                      textAlign: 'center',
                    },
                    styles.title,
                  ]}
                >
                  {title}
                </Text>
              )}
              <View style={{ alignItems: 'flex-end', flex: 1 }}>
                {/* Header blocks are as wide as their content, as a navigation bar's items are. */}
                {content.headerRight ? (
                  <NaturalSizeContext.Provider value={true}>
                    {content.headerRight({ alignItems: 'center', flexWrap: 'nowrap' })}
                  </NaturalSizeContext.Provider>
                ) : null}
                {!content.headerRight && closable ? (
                  <SheetCloseButton
                    components={components}
                    onPress={() => setIndex(CLOSED)}
                    testID={`${blockId}_close`}
                    tokens={tokens}
                  />
                ) : null}
              </View>
            </View>
          ) : null}
          <ScrollView
            contentContainerStyle={[{ padding: 16, paddingBottom: 32 }, styles.body]}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
          >
            {content.content ? content.content() : null}
          </ScrollView>
        </View>
      </ThemeContext.Provider>
    </BottomSheet>
  );
}

Sheet.meta = meta;

export default Sheet;
