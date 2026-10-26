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

import React, { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MenuView } from '@expo/ui/community/menu';

import CommentBody from './CommentBody.js';
import EditBox from './EditBox.js';
import formatRelativeTime from './formatRelativeTime.js';
import getCommentMenuActions from './getCommentMenuActions.js';
import getCommentView from './getCommentView.js';
import ReactionPicker from './ReactionPicker.js';
import ReactionPills from './ReactionPills.js';
import AvatarCircle from '../Avatar/AvatarCircle.js';
import toggleReaction from './toggleReaction.js';
import toPlainText from './toPlainText.js';

// The long-press menu on iOS: the native action sheet, with the same actions as the ⋯ menu.
// React opens the reaction picker, since a sheet cannot hold the emoji row.
function showActionSheet({ actions, onAction, title }) {
  const options = actions.map((action) => (action.id === 'react' ? 'React…' : action.title));
  ActionSheetIOS.showActionSheetWithOptions(
    {
      cancelButtonIndex: options.length,
      destructiveButtonIndex: actions.findIndex((action) => action.attributes?.destructive),
      options: [...options, 'Cancel'],
      title,
    },
    (index) => {
      if (index < actions.length) onAction(actions[index].id);
    }
  );
}

/**
 * One comment: its header (the avatar on a reply, the name, "via agent", the time, "· edited"
 * and the ⋯ menu), its markdown body or the edit box, and its reactions. A long press on iOS
 * opens the same actions as the ⋯ menu. A deleted first comment reads "Comment deleted".
 */
function CommentItem({ comment, ctx, first, thread }) {
  const { colors, Icon, isDark, tokens, user } = ctx;
  const [optimistic, setOptimistic] = useState(null);
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);

  // An optimistic reaction holds until the comment's reactions in the page change.
  const reactions =
    optimistic !== null && optimistic.base === JSON.stringify(comment.reactions ?? [])
      ? optimistic.reactions
      : comment.reactions;
  const view = getCommentView({
    comment: { ...comment, reactions },
    first,
    user,
    members: ctx.members,
  });
  const actions = getCommentMenuActions({ view, reactions: ctx.reactions });

  if (view.deleted) {
    return (
      <View style={styles.deleted}>
        <Text style={[styles.deletedText, { color: colors.tertiary }]}>Comment deleted</Text>
      </View>
    );
  }

  const react = async (emoji) => {
    setPicking(false);
    const next = toggleReaction({ reactions, emoji, userId: user?.id });
    setOptimistic({ base: JSON.stringify(comment.reactions ?? []), reactions: next.reactions });
    const result = await ctx.trigger('onReact', {
      comment_id: comment.id,
      emoji,
      reacted: next.reacted,
    });
    if (result?.success !== true) {
      setOptimistic(null);
    }
  };

  const runAction = (id) => {
    if (id.startsWith('react:')) {
      react(id.slice('react:'.length));
      return;
    }
    switch (id) {
      case 'react':
        setPicking(true);
        return;
      case 'reply':
        ctx.trigger('onReply', {
          comment_id: comment.id,
          thread_id: thread.id,
          name: view.actor.name,
        });
        return;
      case 'copy':
        ctx.trigger('onCopy', {
          comment_id: comment.id,
          body: view.body,
          text: toPlainText({
            body: view.body,
            mentions: view.mentions,
            people: ctx.people,
            pattern: ctx.pattern,
          }),
        });
        return;
      case 'edit':
        setEditing(true);
        return;
      case 'resolve':
      case 'reopen':
        ctx.trigger('onResolve', { comment_id: comment.id, resolved: id === 'resolve' });
        return;
      case 'delete':
        Alert.alert('Delete comment?', 'This comment will be removed for everyone.', [
          { style: 'cancel', text: 'Cancel' },
          {
            onPress: () =>
              ctx.trigger('onDelete', { comment_id: comment.id, thread_id: thread.id }),
            style: 'destructive',
            text: 'Delete',
          },
        ]);
        return;
      default:
    }
  };

  const save = async (body) => {
    const result = await ctx.trigger('onEdit', { comment_id: comment.id, body });
    if (result?.success === true) {
      setEditing(false);
    }
  };

  const avatarSize = first ? 0 : 22;
  const time = formatRelativeTime({ at: view.at, now: ctx.now });
  const mine = new Set(view.reactions.filter((pill) => pill.mine).map((pill) => pill.emoji));

  return (
    <View testID={`comment_${comment.id}`}>
      <View style={styles.header}>
        {avatarSize > 0 ? (
          <AvatarCircle
            avatar={{ name: view.actor.name, src: view.actor.picture ?? undefined }}
            isDark={isDark}
            imageSource={ctx.imageSource}
            size={avatarSize}
            tokens={tokens}
          />
        ) : null}
        <Text numberOfLines={1} style={[styles.meta, { color: colors.tertiary }]}>
          <Text style={[styles.name, { color: colors.label }]}>{view.actor.name}</Text>
          {view.actor.agent ? (
            <Text style={{ color: colors.secondary }}>{' via agent'}</Text>
          ) : null}
          {time ? `  ${time}` : null}
          {view.edited ? ' · edited' : null}
        </Text>
        {actions.length > 0 ? (
          <MenuView
            actions={actions}
            onPressAction={({ nativeEvent }) => runAction(nativeEvent.event)}
            testID={`comment_${comment.id}_menu`}
          >
            <View
              accessibilityLabel="Comment actions"
              accessibilityRole="button"
              style={styles.more}
            >
              <Icon
                properties={{ name: 'Ellipsis', size: 18, title: '' }}
                styles={{ element: { color: colors.secondary } }}
              />
            </View>
          </MenuView>
        ) : null}
      </View>
      {editing ? (
        <EditBox
          colors={colors}
          initial={view.body}
          maxLength={ctx.maxLength}
          mentionFormat={ctx.mentionFormat}
          onCancel={() => setEditing(false)}
          onSave={save}
          people={ctx.mentions}
        />
      ) : (
        <Pressable
          delayLongPress={350}
          disabled={Platform.OS !== 'ios' || actions.length === 0}
          onLongPress={() =>
            showActionSheet({ actions, onAction: runAction, title: view.actor.name })
          }
          style={styles.body}
        >
          <CommentBody
            body={view.body}
            colors={colors}
            hasLinkPress={ctx.hasLinkPress}
            Icon={Icon}
            isDark={isDark}
            linkChips={ctx.linkChips}
            mentions={view.mentions}
            onLinkPress={ctx.onLinkPress}
            onRecordPress={ctx.onRecordPress}
            pattern={ctx.pattern}
            people={ctx.people}
            imageSource={ctx.imageSource}
            tokens={tokens}
          />
        </Pressable>
      )}
      {picking ? (
        <ReactionPicker colors={colors} mine={mine} onPick={react} reactions={ctx.reactions} />
      ) : null}
      <ReactionPills
        canReact={view.canReact}
        colors={colors}
        Icon={Icon}
        onAdd={() => setPicking((open) => !open)}
        onToggle={react}
        reactions={view.reactions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 24 },
  meta: { flex: 1, fontSize: 13 },
  name: { fontSize: 15, fontWeight: '600' },
  more: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    marginRight: -6,
    width: 36,
  },
  body: { marginTop: 4 },
  deleted: { justifyContent: 'center', minHeight: 24 },
  deletedText: { fontSize: 15, fontStyle: 'italic' },
});

export default CommentItem;
