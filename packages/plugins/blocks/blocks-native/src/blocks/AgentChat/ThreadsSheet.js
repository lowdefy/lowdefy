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
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { BottomSheet } from '@expo/ui/community/bottom-sheet';
import { type } from '@lowdefy/helpers';

import getSheetDetents from '../Sheet/getSheetDetents.js';
import SwipeableRow from '../../shared/SwipeableRow.js';
import SystemIcon from '../../shared/SystemIcon.js';

const CLOSED = -1;

function ThreadRow({
  active,
  canDelete,
  colors,
  components,
  item,
  last,
  onDelete,
  onOpen,
  opening,
  testID,
  tokens,
  translate,
}) {
  const tags = (item.tags ?? []).filter((tag) => type.isString(tag) && tag !== '');
  const row = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, busy: opening }}
      onPress={() => onOpen(item)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.pressed : colors.cell },
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.rowContent,
          last
            ? null
            : { borderBottomColor: colors.separator, borderBottomWidth: StyleSheet.hairlineWidth },
        ]}
      >
        <View style={styles.rowText}>
          <Text numberOfLines={2} style={[styles.rowTitle, { color: colors.label }]}>
            {type.isString(item.label) && item.label !== ''
              ? item.label
              : translate('agent.chat.newChat')}
          </Text>
          {tags.length > 0 ? (
            <Text numberOfLines={1} style={[styles.rowSubtitle, { color: colors.secondary }]}>
              {tags.join(' · ')}
            </Text>
          ) : null}
        </View>
        {opening ? <ActivityIndicator color={colors.secondary} size="small" /> : null}
        {active && !opening ? (
          <SystemIcon
            color={colors.tint}
            components={components}
            fallback="Check"
            size={15}
            symbol="checkmark"
          />
        ) : null}
      </View>
    </Pressable>
  );
  if (!canDelete) return row;
  return (
    <SwipeableRow
      background={colors.cell}
      fullSwipe={{ trailing: true }}
      Icon={components.Icon}
      onAction={() => onDelete(item)}
      testID={testID}
      tokens={tokens}
      trailing={[
        { id: 'delete', title: translate('agent.chat.deleteChat'), icon: 'Trash2', tone: 'danger' },
      ]}
    >
      {row}
    </SwipeableRow>
  );
}

function Message({ colors, components, description, symbol, fallback, title, testID }) {
  return (
    <View style={styles.message} testID={testID}>
      <SystemIcon
        color={colors.tertiary}
        components={components}
        fallback={fallback}
        size={36}
        symbol={symbol}
      />
      <Text style={[styles.messageTitle, { color: colors.label }]}>{title}</Text>
      {description ? (
        <Text style={[styles.messageDescription, { color: colors.secondary }]}>{description}</Text>
      ) : null}
    </View>
  );
}

/**
 * The person's recent conversations in a page sheet with medium and large detents, as the chat
 * apps list them: an inset grouped list, newest first, the open one checked. A row opens its
 * thread, a swipe to the left deletes it, and New chat in the sheet's header starts one. The list
 * shows a spinner while it loads, and a message when it is empty or could not be read.
 *
 * @param {Object} props
 * @param {string|null} props.activeId The open thread.
 * @param {string} props.blockId
 * @param {boolean} props.canDelete
 * @param {Object} props.colors
 * @param {Object} props.components
 * @param {boolean} props.isDark
 * @param {{ status: string, items: Object[] }} props.list
 * @param {() => void} props.onClose
 * @param {(item: Object) => void} props.onDelete
 * @param {() => void} props.onNewChat
 * @param {(item: Object) => void} props.onOpen
 * @param {boolean} props.open
 * @param {string|null} props.openingId The thread being loaded.
 * @param {string} props.title
 * @param {Object} props.tokens
 * @param {Function} props.translate
 */
function ThreadsSheet({
  activeId,
  blockId,
  canDelete,
  colors,
  components,
  isDark,
  list,
  onClose,
  onDelete,
  onNewChat,
  onOpen,
  open,
  openingId,
  title,
  tokens,
  translate,
}) {
  const systemScheme = useColorScheme();
  const showsSystemMode = (systemScheme === 'dark') === isDark;
  const { snapPoints, resizable } = getSheetDetents({ detents: 'both', platform: Platform.OS });
  let body;
  if (list.status === 'loading' && list.items.length === 0) {
    body = (
      <ActivityIndicator
        color={colors.secondary}
        style={styles.loading}
        testID={`${blockId}_threads_loading`}
      />
    );
  } else if (list.status === 'error' && list.items.length === 0) {
    body = (
      <Message
        colors={colors}
        components={components}
        fallback="TriangleAlert"
        symbol="exclamationmark.triangle"
        testID={`${blockId}_threads_error`}
        title={translate('agent.chat.chatsLoadFailed')}
      />
    );
  } else if (list.items.length === 0) {
    body = (
      <Message
        colors={colors}
        components={components}
        description={translate('agent.chat.noChatsDescription')}
        fallback="MessagesSquare"
        symbol="bubble.left.and.bubble.right"
        testID={`${blockId}_threads_empty`}
        title={translate('agent.chat.noChats')}
      />
    );
  } else {
    body = (
      <View style={[styles.section, { backgroundColor: colors.cell }]}>
        {list.items.map((item, index) => (
          <ThreadRow
            active={item.key === activeId}
            canDelete={canDelete}
            colors={colors}
            components={components}
            item={item}
            key={item.key}
            last={index === list.items.length - 1}
            onDelete={onDelete}
            onOpen={onOpen}
            opening={item.key === openingId}
            testID={`${blockId}_thread_${index}`}
            tokens={tokens}
            translate={translate}
          />
        ))}
      </View>
    );
  }
  return (
    <BottomSheet
      backgroundStyle={showsSystemMode ? undefined : { backgroundColor: tokens.colorBgElevated }}
      enableDynamicSizing={false}
      enablePanDownToClose
      handleComponent={resizable ? undefined : null}
      index={open ? 0 : CLOSED}
      onClose={onClose}
      snapPoints={snapPoints}
    >
      <View style={styles.sheet} testID={`${blockId}_threads`}>
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            style={[styles.title, { color: colors.label }]}
          >
            {title}
          </Text>
          <View style={[styles.headerSide, styles.headerRight]}>
            <Pressable
              accessibilityLabel={translate('agent.chat.newChat')}
              accessibilityRole="button"
              hitSlop={8}
              onPress={onNewChat}
              style={({ pressed }) => [
                styles.headerButton,
                { backgroundColor: colors.fillStrong },
                pressed ? { opacity: 0.6 } : null,
              ]}
              testID={`${blockId}_threads_new_chat`}
            >
              <SystemIcon
                color={colors.label}
                components={components}
                fallback="SquarePen"
                size={14}
                symbol="square.and.pencil"
              />
            </Pressable>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.body} style={styles.scroll}>
          {body}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 52, paddingHorizontal: 16 },
  headerSide: { flex: 1 },
  headerRight: { alignItems: 'flex-end' },
  headerButton: {
    alignItems: 'center',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  title: { fontSize: 17, fontWeight: '600', letterSpacing: -0.41, textAlign: 'center' },
  scroll: { flex: 1 },
  body: { padding: 16, paddingBottom: 32 },
  loading: { marginTop: 32 },
  section: { borderCurve: 'continuous', borderRadius: 10, overflow: 'hidden' },
  row: { paddingLeft: 16 },
  rowContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingRight: 16,
    paddingVertical: 10,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 17, letterSpacing: -0.41, lineHeight: 22 },
  rowSubtitle: { fontSize: 13, letterSpacing: -0.08, lineHeight: 18 },
  message: { alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingTop: 40 },
  messageTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
    marginTop: 6,
    textAlign: 'center',
  },
  messageDescription: { fontSize: 15, letterSpacing: -0.24, lineHeight: 20, textAlign: 'center' },
});

export default ThreadsSheet;
