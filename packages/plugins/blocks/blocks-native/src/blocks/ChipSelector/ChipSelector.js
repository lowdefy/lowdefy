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

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { type } from '@lowdefy/helpers';
import { EdgeInsetContext } from '@lowdefy/client-native';

import Chip from './Chip.js';
import EdgeFade from './EdgeFade.js';
import getChipColors from './getChipColors.js';
import getFadeRanges from './getFadeRanges.js';
import getOverscrollSwipe from './getOverscrollSwipe.js';
import getScrollTarget from './getScrollTarget.js';
import getSemanticColors from '../../shared/getSemanticColors.js';
import meta from './meta.js';
import SwipeContext from '../../shared/SwipeContext.js';
import useBlockTokens from '../../shared/useBlockTokens.js';
import playFeedback from '../../device/playFeedback.js';

const INSET = 16;
const GAP = 8;
// How far a chip scrolled into view keeps from the strip's edge: clear of the edge fade.
const SCROLL_MARGIN = EdgeFade.WIDTH;

function getAccessibilityLabel({ badge, label }) {
  if (type.isNone(badge)) return label;
  return `${label}, ${badge}`;
}

// Keeps the selected chip in view: scrolls to the first chip selected without animation once the
// strip and the chip are laid out (on mount, or once options load), and with animation each time
// the selection changes after that.
function useScrollToSelected({ scrollRef, selectedIndex }) {
  const geometry = useRef({ chips: {}, contentWidth: 0, offset: 0, viewportWidth: 0 });
  const pending = useRef(null);
  const shown = useRef(false);

  const scrollIfReady = useCallback(() => {
    if (pending.current === null) return;
    const { chips, contentWidth, offset, viewportWidth } = geometry.current;
    const chip = chips[pending.current.index];
    if (type.isNone(chip) || viewportWidth === 0 || contentWidth === 0) return;
    const { animated } = pending.current;
    pending.current = null;
    shown.current = true;
    const target = getScrollTarget({
      chip,
      contentWidth,
      margin: SCROLL_MARGIN,
      offset,
      viewportWidth,
    });
    if (target !== null) {
      scrollRef.current?.scrollTo({ animated, x: target, y: 0 });
    }
  }, [scrollRef]);

  useEffect(() => {
    pending.current = selectedIndex < 0 ? null : { animated: shown.current, index: selectedIndex };
    scrollIfReady();
  }, [scrollIfReady, selectedIndex]);

  return useMemo(
    () => ({
      onChipLayout: (index, layout) => {
        geometry.current.chips[index] = { width: layout.width, x: layout.x };
        scrollIfReady();
      },
      onContentWidth: (width) => {
        geometry.current.contentWidth = width;
        scrollIfReady();
      },
      onOffset: (offset) => {
        geometry.current.offset = offset;
      },
      onViewportWidth: (width) => {
        geometry.current.viewportWidth = width;
        scrollIfReady();
      },
    }),
    [scrollIfReady]
  );
}

/**
 * A horizontally scrolling strip of chips that picks one option, as a space switcher at the top
 * of a list screen: each chip carries its option's colour and icon (in a rounded-square tile) and
 * label, the selected one tinted with its own colour. The strip runs edge to edge with 16pt of
 * leading and trailing padding, fades where chips scroll under its edges, and keeps the selected
 * chip in view. A trailing more chip (`moreChip`) fires onMore, for a sheet of every option.
 *
 * In a padded area that says how far it reaches (client-native's EdgeInsetContext, such as a
 * Screen's headerBottom), it cancels that padding to reach the screen edges.
 *
 * It scrolls only when its chips overflow it, and never bounces when they fit: a native scroll
 * view takes a horizontal drag before any JS responder can, so a strip that scrolled for nothing
 * would keep a Box it sits in from taking swipes across it. In a Box with swipe events
 * (SwipeContext), a strip that overflows passes a drag on that pulls it past an end it cannot
 * scroll further toward (getOverscrollSwipe), as the Box's swipe that way.
 */
function ChipSelector({ blockId, components, loading, methods, properties, styles = {}, value }) {
  const { isDark, tokens } = useBlockTokens({ properties });
  const edgeInset = useContext(EdgeInsetContext);
  const semantic = getSemanticColors({ tokens });
  const options = properties.options ?? [];
  const selectedIndex = options.findIndex((option) => option.value === value);
  const disabled = loading === true || properties.disabled === true;

  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [widths, setWidths] = useState({ content: 0, viewport: 0 });
  const scroll = useScrollToSelected({ scrollRef, selectedIndex });
  const { onOffset } = scroll;
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        listener: (event) => onOffset(event.nativeEvent.contentOffset.x),
        useNativeDriver: true,
      }),
    [onOffset, scrollX]
  );
  const fades = getFadeRanges({
    contentWidth: widths.content,
    fadeWidth: EdgeFade.WIDTH,
    viewportWidth: widths.viewport,
  });
  const fadeColor = properties.fadeColor ?? semantic.groupedBackground;
  const overflows = widths.content > widths.viewport;
  const parentSwipe = useContext(SwipeContext);
  const onScrollEndDrag = (event) => {
    if (parentSwipe === null) return;
    const direction = getOverscrollSwipe({
      contentWidth: widths.content,
      offset: event.nativeEvent.contentOffset.x,
      velocity: event.nativeEvent.velocity?.x ?? 0,
      viewportWidth: widths.viewport,
    });
    if (parentSwipe.directions.includes(direction)) {
      parentSwipe.swipe(direction);
    }
  };

  const unselectedColors = {
    background: tokens.colorSystemFill,
    badge: semantic.secondaryLabel,
    border: 'transparent',
    label: semantic.label,
  };

  const select = (option) => {
    if (option.value === value) return;
    playFeedback();
    methods.setValue(option.value);
    methods.triggerEvent({ name: 'onChange', event: { value: option.value } });
  };

  const moreChip = properties.moreChip;
  return (
    <View
      accessibilityLabel={properties.title ?? undefined}
      style={[
        { alignSelf: 'stretch' },
        edgeInset > 0 && { marginHorizontal: -edgeInset },
        styles.element,
      ]}
      testID={`${blockId}_input`}
    >
      <Animated.ScrollView
        alwaysBounceHorizontal={false}
        contentContainerStyle={{ alignItems: 'center', gap: GAP, paddingHorizontal: INSET }}
        horizontal
        onContentSizeChange={(width) => {
          setWidths((current) => ({ ...current, content: width }));
          scroll.onContentWidth(width);
        }}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setWidths((current) => ({ ...current, viewport: width }));
          scroll.onViewportWidth(width);
        }}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEndDrag}
        ref={scrollRef}
        scrollEnabled={overflows}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        testID={`${blockId}_scroll`}
      >
        {options.map((option, index) => {
          const selected = index === selectedIndex;
          const colors = getChipColors({ color: option.color, isDark, tokens });
          const label = option.label ?? `${option.value}`;
          return (
            <Chip
              accessibilityLabel={getAccessibilityLabel({ badge: option.badge, label })}
              badge={option.badge}
              colors={
                selected
                  ? {
                      background: colors.tint,
                      badge: colors.accent,
                      border: colors.accent,
                      label: colors.accent,
                    }
                  : unselectedColors
              }
              components={components}
              disabled={disabled || option.disabled === true}
              icon={type.isNone(option.icon) ? undefined : { name: option.icon }}
              key={`${option.value}`}
              label={label}
              onLayout={(event) => scroll.onChipLayout(index, event.nativeEvent.layout)}
              onPress={() => select(option)}
              selected={selected}
              styles={styles}
              testID={`${blockId}_${option.value}`}
              tile={selected ? colors.selectedTile : colors.tile}
            />
          );
        })}
        {type.isObject(moreChip) ? (
          <Chip
            accessibilityLabel={moreChip.label ?? 'More'}
            colors={{ ...unselectedColors, label: semantic.label }}
            components={components}
            disabled={disabled}
            icon={
              type.isNone(moreChip.icon)
                ? undefined
                : { color: semantic.secondaryLabel, name: moreChip.icon }
            }
            label={moreChip.label}
            onLayout={() => undefined}
            onPress={() => methods.triggerEvent({ name: 'onMore' })}
            selected={false}
            styles={styles}
            testID={`${blockId}_more`}
          />
        ) : null}
      </Animated.ScrollView>
      {fades === null ? null : (
        <>
          <EdgeFade
            color={fadeColor}
            id={`${blockId}_fade_start`}
            opacity={scrollX.interpolate({ ...fades.start, extrapolate: 'clamp' })}
            side="start"
          />
          <EdgeFade
            color={fadeColor}
            id={`${blockId}_fade_end`}
            opacity={scrollX.interpolate({ ...fades.end, extrapolate: 'clamp' })}
            side="end"
          />
        </>
      )}
    </View>
  );
}

ChipSelector.meta = meta;

export default ChipSelector;
