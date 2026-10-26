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

import React, { useContext, useLayoutEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { resolveColor } from '@lowdefy/client-native';
import { type } from '@lowdefy/helpers';

import AvatarCircle from '../Avatar/AvatarCircle.js';
import AvatarStack from '../Avatar/AvatarStack.js';
import getListItemParts, { GAP, ICON_BOX, ROW_PADDING } from './getListItemParts.js';
import getSemanticColors from '../../shared/getSemanticColors.js';
import iosTextStyles from '../../shared/iosTextStyles.js';
import ListItemContextMenu from './ListItemContextMenu.js';
import NativeMenu from '../../shared/NativeMenu.js';
import ListRowContext from '../List/ListRowContext.js';
import meta from './meta.js';
import StatusMark from '../StatusIcon/StatusMark.js';
import SwipeableRow from '../../shared/SwipeableRow.js';
import SystemIcon from '../../shared/SystemIcon.js';
import useComponentTokens from '../../useComponentTokens.js';

const FULL_SWIPE = {
  leading: { leading: true },
  trailing: { trailing: true },
  both: { leading: true, trailing: true },
  none: {},
};

function Leading({ blockId, colors, components, content, isDark, leading, styles, tokens }) {
  if (!type.isNone(content.leading)) {
    return content.leading();
  }
  if (leading === null) {
    return null;
  }
  switch (leading.kind) {
    case 'status':
      return <StatusMark status={leading.status} testID={`${blockId}_status`} tokens={tokens} />;
    case 'avatar':
      return (
        <AvatarCircle
          avatar={leading.avatar}
          isDark={isDark}
          size={leading.size}
          style={styles.avatar}
          testID={`${blockId}_avatar`}
          tokens={tokens}
        />
      );
    default:
      return (
        <View style={{ alignItems: 'center', width: ICON_BOX }}>
          <components.Icon
            properties={leading.icon}
            styles={{ element: [{ color: colors.secondaryLabel, fontSize: 22 }, styles.icon] }}
            testID={`${blockId}_icon`}
          />
        </View>
      );
  }
}

// The trailing parts keep their natural width and the title column takes what is left, shrinking
// and ending its title with an ellipsis, so a long title never pushes a badge off the row.
const TITLE_COLUMN = { flexBasis: 0, flexGrow: 1, flexShrink: 1, gap: 1, minWidth: 0 };
const TRAILING = { alignItems: 'center', flexDirection: 'row', flexShrink: 0, gap: 8 };

function Trailing({ blockId, colors, components, content, isDark, styles, tokens, trailing }) {
  const parts = [];
  if (!type.isNone(content.trailing)) {
    parts.push(<React.Fragment key="slot">{content.trailing()}</React.Fragment>);
  }
  trailing.badges.forEach((badge, index) => {
    const color = type.isString(badge.color)
      ? resolveColor({ color: badge.color, tokens })
      : colors.secondaryLabel;
    parts.push(
      <View
        key={`badge-${index}`}
        style={{ alignItems: 'center', flexDirection: 'row', flexShrink: 0, gap: 3 }}
        testID={`${blockId}_badge_${index}`}
      >
        {type.isNone(badge.icon) ? null : (
          <components.Icon properties={badge.icon} styles={{ element: { color, fontSize: 14 } }} />
        )}
        {type.isNone(badge.text) ? null : (
          <Text style={[iosTextStyles.footnote, { color, fontVariant: ['tabular-nums'] }]}>
            {`${badge.text}`}
          </Text>
        )}
      </View>
    );
  });
  if (type.isString(trailing.text)) {
    parts.push(
      <Text
        key="text"
        numberOfLines={1}
        style={[
          iosTextStyles.subheadline,
          {
            color: type.isString(trailing.textColor)
              ? resolveColor({ color: trailing.textColor, tokens })
              : colors.secondaryLabel,
            fontVariant: ['tabular-nums'],
          },
          styles.extra,
        ]}
      >
        {trailing.text}
      </Text>
    );
  }
  if (!type.isNone(trailing.status)) {
    parts.push(
      <StatusMark
        key="status"
        status={trailing.status}
        testID={`${blockId}_trailing_status`}
        tokens={tokens}
      />
    );
  }
  if (!type.isNone(trailing.icon)) {
    parts.push(
      <components.Icon
        key="icon"
        properties={trailing.icon}
        styles={{ element: { color: colors.secondaryLabel, fontSize: 17 } }}
        testID={`${blockId}_trailing_icon`}
      />
    );
  }
  if (type.isArray(trailing.avatars)) {
    parts.push(
      <AvatarStack
        avatars={trailing.avatars}
        isDark={isDark}
        key="avatars"
        max={3}
        size={20}
        testID={`${blockId}_trailing_avatars`}
        tokens={tokens}
      />
    );
  } else if (type.isObject(trailing.avatar)) {
    parts.push(
      <AvatarCircle
        avatar={trailing.avatar}
        isDark={isDark}
        key="avatar"
        size={trailing.avatar.size ?? 20}
        testID={`${blockId}_trailing_avatar`}
        tokens={tokens}
      />
    );
  }
  if (parts.length === 0) {
    return null;
  }
  return (
    <View style={TRAILING} testID={`${blockId}_trailing`}>
      {parts}
    </View>
  );
}

/**
 * An iOS list row: a leading status glyph, avatar or icon (or `leading` slot), a title of one or
 * two lines and a subtitle of meta, trailing meta text, badges, a glyph or avatars (or `trailing`
 * slot), and a chevron when it has onClick, or the iOS checkmark in the tint colour where the
 * chevron goes with `trailing.check` (a picked row of a multi-select list, which has no chevron).
 * It highlights while pressed, has swipe actions (`onSwipeAction`) and a long-press context menu
 * (`onContextMenu`), and in a List moves the row's separator in to its title.
 *
 * The title is a Headline when the row has a subtitle and Body when it stands alone, as iOS sets
 * a two-line cell and a settings row.
 */
function ListItem({ blockId, components, content, events, methods, properties, styles }) {
  const { isDark, tokens } = useComponentTokens(properties.theme);
  const colors = getSemanticColors({ tokens });
  const row = useContext(ListRowContext);
  const parts = getListItemParts({ properties });
  const hasLeadingSlot = !type.isNone(content.leading);
  useLayoutEffect(() => {
    if (row !== null && !hasLeadingSlot) {
      row.setSeparatorInset(parts.separatorInset);
    }
  }, [row, hasLeadingSlot, parts.separatorInset]);

  const pressable = !type.isNone(events.onClick);
  const disabled = properties.disabled === true;
  const checked = parts.trailing.check;
  const showChevron = properties.chevron ?? (pressable && !checked);
  const title = properties.title ?? '';
  const hasSubtitle = type.isString(parts.subtitle);
  const swipeActions = properties.swipeActions ?? {};
  const leadingActions = swipeActions.leading ?? [];
  const trailingActions = swipeActions.trailing ?? [];
  const menuItems = properties.contextMenu ?? [];

  function fireSwipeAction(action) {
    methods.triggerEvent({ name: 'onSwipeAction', event: { id: action.id } });
  }
  function fireContextMenu(item) {
    methods.triggerEvent({ name: 'onContextMenu', event: { id: item.id } });
  }
  const accessibilityActions = [
    ...[...leadingActions, ...trailingActions].map((action) => ({
      name: `swipe:${action.id}`,
      label: action.title ?? action.id,
    })),
    ...menuItems.map((item) => ({ name: `menu:${item.id}`, label: item.title })),
  ];
  function onAccessibilityAction(event) {
    const [kind, id] = event.nativeEvent.actionName.split(/:(.*)/s);
    if (kind === 'swipe') {
      fireSwipeAction({ id });
    } else if (kind === 'menu') {
      fireContextMenu({ id });
    }
  }
  const nativeMenu = menuItems.length > 0 && Platform.OS === 'ios';
  let item = (
    <Pressable
      accessibilityActions={accessibilityActions.length > 0 ? accessibilityActions : undefined}
      accessibilityLabel={[title, parts.subtitle].filter((text) => type.isString(text)).join(', ')}
      accessibilityRole={pressable ? 'button' : undefined}
      accessibilityState={checked ? { selected: true } : undefined}
      disabled={disabled}
      onAccessibilityAction={onAccessibilityAction}
      onPress={pressable ? () => methods.triggerEvent({ name: 'onClick' }) : undefined}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          backgroundColor: pressed && pressable ? colors.cellPressed : 'transparent',
          flexDirection: 'row',
          gap: GAP,
          minHeight: 44,
          opacity: disabled ? 0.4 : 1,
          paddingHorizontal: ROW_PADDING,
          paddingVertical: hasSubtitle ? 10 : 11,
        },
        styles.element,
      ]}
      testID={`${blockId}_item`}
    >
      <Leading
        blockId={blockId}
        colors={colors}
        components={components}
        content={content}
        isDark={isDark}
        leading={parts.leading}
        styles={styles}
        tokens={tokens}
      />
      <View
        onLayout={
          hasLeadingSlot && row !== null
            ? (event) => row.setSeparatorInset(event.nativeEvent.layout.x)
            : undefined
        }
        style={TITLE_COLUMN}
        testID={`${blockId}_text`}
      >
        <Text
          ellipsizeMode="tail"
          numberOfLines={properties.titleLines ?? 2}
          style={[
            hasSubtitle ? iosTextStyles.headline : iosTextStyles.body,
            { color: colors.label },
            styles.title,
          ]}
        >
          {title}
        </Text>
        {hasSubtitle ? (
          <Text
            ellipsizeMode="tail"
            numberOfLines={properties.subtitleLines ?? 1}
            style={[
              iosTextStyles.footnote,
              { color: colors.secondaryLabel },
              styles.description,
              styles.subtitle,
            ]}
          >
            {parts.subtitle}
          </Text>
        ) : null}
      </View>
      <Trailing
        blockId={blockId}
        colors={colors}
        components={components}
        content={content}
        isDark={isDark}
        styles={styles}
        tokens={tokens}
        trailing={parts.trailing}
      />
      {checked ? (
        <SystemIcon
          color={tokens.colorTint}
          components={components}
          fallback="Check"
          size={17}
          symbol="checkmark"
          testID={`${blockId}_check`}
          weight="semibold"
        />
      ) : null}
      {showChevron ? (
        <components.Icon
          properties={{ name: 'chevron-right', strokeWidth: 2.5, title: '' }}
          styles={{ element: { color: colors.tertiaryLabel, fontSize: 16, marginLeft: -4 } }}
          testID={`${blockId}_chevron`}
        />
      ) : null}
    </Pressable>
  );
  if (nativeMenu) {
    item = (
      <ListItemContextMenu
        isDark={isDark}
        items={menuItems}
        onSelect={fireContextMenu}
        testID={`${blockId}_menu`}
      >
        {item}
      </ListItemContextMenu>
    );
  }
  if (menuItems.length > 0 && !nativeMenu) {
    // Android's Material dropdown on long press: every item shows and a back or outside tap
    // dismisses it, which Alert.alert cannot do (it keeps three buttons and is not cancelable).
    item = (
      <NativeMenu
        actions={menuItems.map((menuItem) => ({
          id: menuItem.id,
          title: menuItem.title,
          attributes: { destructive: menuItem.destructive === true },
        }))}
        fullWidth
        onSelect={(id) => fireContextMenu({ id })}
        openOnLongPress
        testID={`${blockId}_menu`}
      >
        {item}
      </NativeMenu>
    );
  }
  if (leadingActions.length > 0 || trailingActions.length > 0) {
    item = (
      <SwipeableRow
        background={row?.background ?? colors.cell}
        fullSwipe={FULL_SWIPE[swipeActions.fullSwipe ?? 'leading']}
        Icon={components.Icon}
        leading={leadingActions}
        onAction={fireSwipeAction}
        testID={blockId}
        tokens={tokens}
        trailing={trailingActions}
      >
        {item}
      </SwipeableRow>
    );
  }
  return item;
}

ListItem.meta = meta;

export default ListItem;
