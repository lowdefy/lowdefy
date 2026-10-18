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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { convertStyle } from '@lowdefy/style-native';

import htmlToText from '../../htmlToText.js';
import meta from './meta.js';
import useComponentTokens from '../../useComponentTokens.js';

// The tabs to show: the `tabs` property, or one tab per slot named by its key, less the extra slot.
function getTabs({ content, properties }) {
  const tabs =
    properties.tabs ??
    Object.keys(content)
      .sort()
      .map((key) => ({ key, title: key }));
  return tabs.filter((tab) => tab.key !== properties.extraAreaKey);
}

function getTitleFontSize({ size, tokens }) {
  if (size === 'large') return tokens.titleFontSizeLG ?? tokens.fontSizeLG;
  if (size === 'small') return tokens.titleFontSizeSM ?? tokens.fontSize;
  return tokens.titleFontSize ?? tokens.fontSize;
}

function getItemPadding({ card, size, tokens }) {
  if (card) {
    if (size === 'large') return tokens.cardPaddingLG ?? '11px 16px';
    if (size === 'small') return tokens.cardPaddingSM ?? '4px 8px';
    return tokens.cardPadding ?? '8px 16px';
  }
  if (size === 'large') return tokens.horizontalItemPaddingLG ?? '16px 0';
  if (size === 'small') return tokens.horizontalItemPaddingSM ?? '8px 0';
  return tokens.horizontalItemPadding ?? '12px 0';
}

function getIndicatorAlign(align) {
  if (align === 'start') return 'flex-start';
  if (align === 'end') return 'flex-end';
  return 'center';
}

/**
 * antd's Tabs as phone top tabs: a scrolling tab bar (line or card type) over the active tab's
 * slot, or under it with `tabPlacement: bottom`. Changing tab fires onChange with `{ activeKey }`
 * and the tab's own eventName with `{ key }`; the setActiveKey method changes tab from actions.
 * Inactive tabs stay mounted, hidden, so their blocks keep their state, unless destroyOnHidden.
 */
function Tabs({ blockId, components, content, methods, properties, styles = {} }) {
  const { tokens } = useComponentTokens(properties.theme);
  const tabs = getTabs({ content, properties });
  const [activeKey, setActiveKey] = useState(properties.defaultActiveKey ?? tabs[0].key);

  // The latest tabs, read in the stable handler.
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  const fireTabChange = useCallback(
    (nextKey) => {
      setActiveKey(nextKey);
      methods.triggerEvent({ name: 'onChange', event: { activeKey: nextKey } });
      const nextTab = tabsRef.current.find((tab) => tab.key === nextKey);
      if (nextTab?.eventName) {
        methods.triggerEvent({ name: nextTab.eventName, event: { key: nextKey } });
      }
    },
    [methods]
  );

  useEffect(() => {
    methods.registerMethod('setActiveKey', ({ activeKey: nextKey }) => {
      if (nextKey !== activeKey) {
        fireTabChange(nextKey);
      }
    });
  });

  const card = properties.tabType === 'card';
  const size = properties.size ?? 'default';
  const fontSize = getTitleFontSize({ size, tokens });
  const itemPadding = convertStyle({ padding: getItemPadding({ card, size, tokens }) }).style;
  const gutter =
    properties.tabBarGutter ?? (card ? tokens.cardGutter ?? 2 : tokens.horizontalItemGutter ?? 32);
  const selectedColor = tokens.itemSelectedColor ?? tokens.colorPrimary;
  const bottom = properties.tabPlacement === 'bottom';
  const extra = properties.extraAreaKey ? content[properties.extraAreaKey] : undefined;

  const tabBar = (
    <View
      style={[
        {
          alignItems: 'center',
          borderBottomWidth: bottom ? 0 : tokens.lineWidth,
          borderColor: tokens.colorBorderSecondary,
          borderTopWidth: bottom ? tokens.lineWidth : 0,
          flexDirection: 'row',
        },
        styles.tabBar,
      ]}
    >
      <ScrollView
        accessibilityRole="tablist"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: properties.centered === true ? 'center' : 'flex-start',
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {tabs.map((tab, index) => {
          const active = tab.key === activeKey;
          const disabled = tab.disabled === true;
          let color = tokens.itemColor ?? tokens.colorText;
          if (disabled) color = tokens.colorTextDisabled;
          else if (active) color = selectedColor;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ disabled, selected: active }}
              disabled={disabled}
              key={tab.key}
              onPress={() => {
                if (!active) fireTabChange(tab.key);
              }}
              style={[
                {
                  alignItems: 'center',
                  flexDirection: 'row',
                  gap: tokens.marginXS,
                  marginLeft: index === 0 ? 0 : gutter,
                },
                itemPadding,
                card && {
                  backgroundColor: active
                    ? tokens.colorBgContainer
                    : tokens.cardBg ?? tokens.colorFillAlter,
                  borderColor: tokens.colorBorderSecondary,
                  borderTopLeftRadius: tokens.borderRadiusLG,
                  borderTopRightRadius: tokens.borderRadiusLG,
                  borderWidth: tokens.lineWidth,
                },
                styles.item,
              ]}
              testID={`${blockId}_${tab.key}`}
            >
              {tab.icon ? (
                <components.Icon
                  properties={tab.icon}
                  styles={{ element: [{ color, fontSize }, styles.icon] }}
                  testID={`${blockId}_${tab.key}_icon`}
                />
              ) : null}
              <Text style={{ color, fontSize }}>{tab.title ? htmlToText(tab.title) : tab.key}</Text>
              {active && !card ? (
                <View
                  style={[
                    {
                      alignItems: getIndicatorAlign(properties.indicator?.align),
                      bottom: bottom ? undefined : 0,
                      left: 0,
                      position: 'absolute',
                      right: 0,
                      top: bottom ? 0 : undefined,
                    },
                  ]}
                >
                  <View
                    style={[
                      {
                        backgroundColor: tokens.inkBarColor ?? tokens.colorPrimary,
                        height: tokens.lineWidthBold,
                        width: properties.indicator?.size ?? '100%',
                      },
                      styles.inkBar,
                    ]}
                    testID={`${blockId}_indicator`}
                  />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      {extra ? <View style={{ marginLeft: tokens.marginXS }}>{extra()}</View> : null}
    </View>
  );

  const panes = tabs.map((tab) => {
    const active = tab.key === activeKey;
    if (!content[tab.key]) return null;
    if (!active && properties.destroyOnHidden === true) return null;
    return (
      <View
        accessibilityElementsHidden={!active}
        importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
        key={tab.key}
        style={[active ? undefined : { display: 'none' }, styles.tabPane]}
      >
        {content[tab.key]()}
      </View>
    );
  });

  return (
    <View style={styles.element}>
      {bottom ? null : tabBar}
      <View style={{ [bottom ? 'marginBottom' : 'marginTop']: tokens.margin }}>{panes}</View>
      {bottom ? tabBar : null}
    </View>
  );
}

Tabs.meta = meta;

export default Tabs;
