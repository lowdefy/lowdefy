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

import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { type } from '@lowdefy/helpers';

import BreakpointContext from '../layout/BreakpointContext.js';
import FocusMemoryContext from './FocusMemoryContext.js';
import formatIconTitle from '../icon/formatIconTitle.js';
import getSfSymbol from '../icon/getSfSymbol.js';
import HeaderActionButton from './HeaderActionButton.js';
import HeaderBottom from './HeaderBottom.js';
import NaturalSizeContext from '../layout/NaturalSizeContext.js';
import PageContexts from '../style/PageContexts.js';
import PageStyleContext from '../style/PageStyleContext.js';
import ScreenContext from './ScreenContext.js';
import ScreenOptionsContext from './ScreenOptionsContext.js';
import ThemeContext from '../theme/ThemeContext.js';
import meta from './meta.js';

const SEARCH_DEBOUNCE = 300;

// A header slot (headerLeft, headerRight) as a function the router calls to draw it outside the
// page: it brings the page's theme, breakpoint and class map, and draws its blocks at their
// natural size. It keeps one identity while the slot exists, so a router that re-renders on new
// options is not sent new options on every page render.
function useHeaderSlot({ pageContextsRef, slot }) {
  const slotRef = useRef(slot);
  slotRef.current = slot;
  const render = useCallback(
    () => (
      <PageContexts value={pageContextsRef.current}>
        <NaturalSizeContext.Provider value={true}>
          {slotRef.current({ alignItems: 'center', flexWrap: 'nowrap' })}
        </NaturalSizeContext.Provider>
      </PageContexts>
    ),
    [pageContextsRef]
  );
  return typeof slot === 'function' ? render : undefined;
}

// An action's menu items (`items`, the Menu block's item shape): picking one triggers the
// action's event with the item's id.
function getMenu({ config, methodsRef }) {
  if (!type.isArray(config.items)) {
    return null;
  }
  return config.items.map((item) => ({
    destructive: item.destructive === true,
    disabled: item.disabled === true,
    id: item.id,
    onPress: () =>
      methodsRef.current.triggerEvent({
        name: config.event ?? 'onHeaderAction',
        event: { id: item.id },
      }),
    symbol: item.symbol ?? null,
    title: item.title,
  }));
}

// properties.headerActions as the header buttons the router draws: an SF Symbol for iOS's native
// bar buttons, when the icon has one, and `render`, the same action as a natural-size icon button
// for a platform or icon with none. An action with `items` opens a menu of them.
function useHeaderActions({ blockId, components, methodsRef, pageContextsRef, headerActions }) {
  const actionsKey = JSON.stringify(headerActions ?? []);
  return useMemo(
    () =>
      (headerActions ?? []).map((config) => {
        const action = {
          disabled: config.disabled === true,
          icon: config.icon,
          id: config.id,
          menu: getMenu({ config, methodsRef }),
          onPress: () =>
            methodsRef.current.triggerEvent({
              name: config.event ?? 'onHeaderAction',
              event: { id: config.id },
            }),
          placement: config.placement ?? 'right',
          sfSymbol: getSfSymbol({ icon: config.icon, sfSymbol: config.sfSymbol }),
          title: config.title ?? formatIconTitle(config.icon),
        };
        action.render = () => (
          <PageContexts key={action.id} value={pageContextsRef.current}>
            <HeaderActionButton
              action={action}
              Icon={components.Icon}
              testID={`${blockId}_${action.id}`}
            />
          </PageContexts>
        );
        return action;
      }),
    [actionsKey, blockId, components.Icon, methodsRef, pageContextsRef]
  );
}

// properties.headerSearch as the native search bar's options: text changes reach onSearchChange
// once typing pauses (debounce, 300ms), a submit reaches onSearch at once, and cancel clears the
// search. Each event's value is the search text (`_event: value`).
function useHeaderSearch({ headerSearch, methodsRef }) {
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  const searchKey = JSON.stringify(headerSearch ?? null);
  return useMemo(() => {
    if (!type.isObject(headerSearch)) {
      return undefined;
    }
    const trigger = (name, value) => {
      clearTimeout(timerRef.current);
      methodsRef.current.triggerEvent({ name, event: { value } });
    };
    return {
      autoFocus: headerSearch.autoFocus === true,
      hideWhenScrolling: headerSearch.hideWhenScrolling === true,
      onCancel: () => trigger('onSearchChange', ''),
      onChangeText: (value) => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(
          () => trigger('onSearchChange', value),
          headerSearch.debounce ?? SEARCH_DEBOUNCE
        );
      },
      onSearch: (value) => trigger('onSearch', value),
      placeholder: headerSearch.placeholder,
    };
  }, [searchKey, methodsRef]);
}

// onFocus fires each time the screen becomes the one shown: on its first show once its onMount
// is done (the block is loading until then), and again after a tab switch or a back navigation
// to it. What the screen has fired for is kept in its page context's focus memory, so the page
// tree mounting again onto the same context, while the screen stays shown, fires nothing.
function useFocusEvent({ events, focused, focusMemory, loading, methodsRef }) {
  const hasOnFocus = !type.isNone(events.onFocus);
  useEffect(() => {
    if (!focused) {
      focusMemory.focused = false;
      return;
    }
    if (focusMemory.focused) return;
    if (!focusMemory.shown && loading) return;
    focusMemory.focused = true;
    focusMemory.shown = true;
    if (hasOnFocus) {
      methodsRef.current.triggerEvent({ name: 'onFocus' });
    }
  }, [focused, focusMemory, hasOnFocus, loading, methodsRef]);
}

// The footer slot, for the page to draw below its scroll view (ScreenFooter). It is set on every
// render, so the footer shows the slot as the Screen last rendered it, and cleared when the
// Screen goes. A Screen with no footer slot leaves the footer alone, for a block that draws its
// own chrome there (useScreenFooter).
function useFooterSlot({ footer, slot }) {
  const hasSlot = typeof slot === 'function';
  useEffect(() => {
    if (hasSlot) footer.set(() => slot());
  });
  useEffect(() => {
    if (!hasSlot) return undefined;
    return () => footer.set(null);
  }, [footer, hasSlot]);
}

// events.onRefresh as pull-to-refresh on the page's scroll view: the spinner shows until the
// event's actions finish.
function useRefreshEvent({ events, methodsRef, setRefresh }) {
  const hasOnRefresh = !type.isNone(events.onRefresh);
  useEffect(() => {
    if (!hasOnRefresh) return undefined;
    setRefresh(() => methodsRef.current.triggerEvent({ name: 'onRefresh' }));
    return () => setRefresh(null);
  }, [hasOnRefresh, methodsRef, setRefresh]);
}

/**
 * The mobile page type. It draws its content slot; the shell's router draws the header from the
 * options it reports to ScreenOptionsContext:
 * - `title`, `presentation` (card, modal or sheet) and `largeTitle`;
 * - `headerLeft` and `headerRight`: functions that draw those slots' blocks at their natural
 *   size, or undefined;
 * - `headerActions`: `[{ id, title, icon, sfSymbol, placement, disabled, onPress, menu, render }]`,
 *   the header's icon buttons (`sfSymbol` is null for an icon with no SF Symbol; `menu` is null,
 *   or the items `[{ id, title, symbol, destructive, disabled, onPress }]` the button opens a menu
 *   of; `render` draws the action as an icon button, opening its menu when it has one);
 * - `headerSearch`: `{ placeholder, autoFocus, hideWhenScrolling, onChangeText, onSearch,
 *   onCancel }` for a native search bar, or undefined;
 * - `headerBottom`: whether the page pins blocks under the bar, so the router leaves out the
 *   bar's own hairline (the strip draws one under itself).
 *
 * The headerBottom slot is drawn here, as the page's first content, pinned under the bar as the
 * page scrolls (HeaderBottom, from the page's scroll offset and header inset). The footer slot is
 * drawn by the page below its scroll view, pinned above the tab bar and the keyboard.
 * Pull-to-refresh (onRefresh) and onFocus come from the page's screen too (ScreenContext).
 */
function Screen({ blockId, components, content, events, loading, methods, properties }) {
  const onScreenOptions = useContext(ScreenOptionsContext);
  const { focused, footer, headerInset, scrollY, setRefresh } = useContext(ScreenContext);
  const focusMemory = useContext(FocusMemoryContext);
  const methodsRef = useRef(methods);
  methodsRef.current = methods;
  const pageContextsRef = useRef(null);
  pageContextsRef.current = {
    breakpoint: useContext(BreakpointContext),
    pageStyle: useContext(PageStyleContext),
    theme: useContext(ThemeContext),
  };
  const headerLeft = useHeaderSlot({ pageContextsRef, slot: content.headerLeft });
  const headerRight = useHeaderSlot({ pageContextsRef, slot: content.headerRight });
  const headerActions = useHeaderActions({
    blockId,
    components,
    headerActions: properties.headerActions,
    methodsRef,
    pageContextsRef,
  });
  const headerSearch = useHeaderSearch({ headerSearch: properties.headerSearch, methodsRef });
  useFocusEvent({ events, focused, focusMemory, loading, methodsRef });
  useRefreshEvent({ events, methodsRef, setRefresh });
  useFooterSlot({ footer, slot: content.footer });

  const { presentation = 'card', title } = properties;
  const largeTitle = properties.largeTitle === true;
  const headerBottom = typeof content.headerBottom === 'function';
  useEffect(() => {
    if (onScreenOptions === null) return;
    onScreenOptions({
      headerActions,
      headerBottom,
      headerLeft,
      headerRight,
      headerSearch,
      largeTitle,
      presentation,
      title,
    });
  }, [
    headerActions,
    headerBottom,
    headerLeft,
    headerRight,
    headerSearch,
    largeTitle,
    onScreenOptions,
    presentation,
    title,
  ]);
  const page = content.content ? content.content() : null;
  if (!headerBottom) {
    return page;
  }
  return (
    <>
      <HeaderBottom blockId={blockId} headerInset={headerInset} scrollY={scrollY}>
        {content.headerBottom({ rowGap: 8 })}
      </HeaderBottom>
      {page}
    </>
  );
}

Screen.meta = meta;

export default Screen;
