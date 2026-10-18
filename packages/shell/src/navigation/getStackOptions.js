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
import { View } from 'react-native';

import getPresentation from './getPresentation.js';

const SIDES = { left: 'Left', right: 'Right' };

// An action as a native iOS bar button: its SF Symbol, in the bar's shared glass background. An
// icon with no SF Symbol draws as its Lucide icon in a custom item.
function toNativeItem(action) {
  if (action.sfSymbol === null) {
    return { type: 'custom', element: action.render() };
  }
  return {
    type: 'button',
    accessibilityLabel: action.title,
    disabled: action.disabled,
    icon: { type: 'sfSymbol', name: action.sfSymbol },
    identifier: action.id,
    label: action.title,
    onPress: action.onPress,
  };
}

// One side of the header (left or right): the Screen's slot blocks, then its actions on that
// side. On iOS, a side with actions is a list of native bar items (the slot as a custom item); a
// side with only the slot is its custom view. Elsewhere, a side is a row of the slot and the
// actions as icon buttons. A side with neither is left out, so a drawer's menu button stays.
function getSideOptions({ actions, platform, side, slot }) {
  const sideActions = actions.filter((action) => action.placement === side);
  if (sideActions.length === 0 && slot === undefined) {
    return {};
  }
  const name = SIDES[side];
  if (platform === 'ios') {
    if (sideActions.length === 0) {
      return { [`header${name}`]: slot, [`unstable_header${name}Items`]: undefined };
    }
    return {
      [`header${name}`]: undefined,
      [`unstable_header${name}Items`]: () => [
        ...(slot === undefined ? [] : [{ type: 'custom', element: slot() }]),
        ...sideActions.map(toNativeItem),
      ],
    };
  }
  return {
    [`header${name}`]: () => (
      <View style={{ alignItems: 'center', columnGap: 4, flexDirection: 'row' }}>
        {slot === undefined ? null : slot()}
        {sideActions.map((action) => action.render())}
      </View>
    ),
  };
}

// The native search bar's options from a Screen's headerSearch: its text events carry the text
// in nativeEvent.text. searchBarRef lets the screen focus it (autoFocus).
function getSearchOptions({ headerSearch, searchBarRef }) {
  if (headerSearch === undefined) {
    return undefined;
  }
  return {
    autoFocus: headerSearch.autoFocus,
    hideWhenScrolling: headerSearch.hideWhenScrolling,
    onCancelButtonPress: () => headerSearch.onCancel(),
    onChangeText: (event) => headerSearch.onChangeText(event.nativeEvent.text),
    onSearchButtonPress: (event) => headerSearch.onSearch(event.nativeEvent.text),
    placeholder: headerSearch.placeholder,
    ref: searchBarRef,
  };
}

/**
 * The native stack options for a Screen page's header options (client-native screen/Screen.js):
 * the title (a large title on iOS that collapses into the bar as the page scrolls), the
 * presentation, a native search bar, and the header's slots and icon buttons at their natural
 * size, as native bar buttons on iOS. A page with a headerBottom hides the bar's own hairline:
 * the pinned strip under the bar draws one under itself.
 *
 * @param {Object} params
 * @param {Object} params.options What the Screen reported.
 * @param {string} params.platform Platform.OS.
 * @param {Object} params.searchBarRef The ref the search bar's commands (focus) are set on.
 */
function getStackOptions({ options, platform, searchBarRef }) {
  const {
    headerActions,
    headerBottom,
    headerLeft,
    headerRight,
    headerSearch,
    largeTitle,
    presentation,
    title,
  } = options;
  return {
    headerBackVisible: true,
    // Undefined keeps the stack's own default.
    headerShadowVisible: headerBottom === true ? false : undefined,
    headerLargeTitleEnabled: largeTitle,
    headerLargeTitleShadowVisible: false,
    headerSearchBarOptions: getSearchOptions({ headerSearch, searchBarRef }),
    presentation: getPresentation(presentation),
    title: title ?? '',
    ...getSideOptions({ actions: headerActions, platform, side: 'left', slot: headerLeft }),
    ...getSideOptions({ actions: headerActions, platform, side: 'right', slot: headerRight }),
  };
}

export default getStackOptions;
