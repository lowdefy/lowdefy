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
import { Pressable, StyleSheet, Text, View } from 'react-native';

import CommentItem from './CommentItem.js';
import getActor from './getActor.js';
import getVisibleReplies from './getVisibleReplies.js';
import RailRow from './RailRow.js';
import AvatarCircle from '../Avatar/AvatarCircle.js';

const AVATAR_SIZE = 28;
const ROW_GAP = 10;

/**
 * A thread on the rail: the first comment's author's avatar on the rail, and a card holding the
 * first comment with its replies flat under it. It shows the newest replies; "Show N earlier
 * replies" shows the rest that are loaded and raises onLoadReplies for any that are not.
 */
function ThreadCard({ ctx, first, last, thread }) {
  const { colors, isDark, tokens } = ctx;
  const [expanded, setExpanded] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const { replies, hidden, unloaded } = getVisibleReplies({
    thread,
    expanded,
    limit: ctx.repliesShown,
  });
  const author = getActor({ by: thread.by, members: ctx.members });

  const showEarlier = async () => {
    setExpanded(true);
    if (unloaded === 0) return;
    setLoadingReplies(true);
    try {
      await ctx.trigger('onLoadReplies', { thread_id: thread.id });
    } finally {
      setLoadingReplies(false);
    }
  };

  const marker = thread.deleted ? (
    <View
      style={[
        styles.deletedAvatar,
        { borderColor: colors.separator, backgroundColor: colors.fill },
      ]}
    />
  ) : (
    <AvatarCircle
      avatar={{ name: author.name, src: author.picture ?? undefined }}
      isDark={isDark}
      resolveUrl={ctx.resolveUrl}
      size={AVATAR_SIZE}
      tokens={tokens}
    />
  );

  return (
    <RailRow colors={colors} first={first} last={last} marker={marker} markerTop={ROW_GAP}>
      <View
        style={[styles.card, { backgroundColor: colors.cell, borderColor: colors.separator }]}
        testID={`thread_${thread.id}`}
      >
        <CommentItem comment={thread} ctx={ctx} first thread={thread} />
        {hidden > 0 ? (
          <Pressable
            accessibilityRole="button"
            disabled={loadingReplies}
            onPress={showEarlier}
            style={({ pressed }) => [
              styles.showEarlier,
              { borderTopColor: colors.separator },
              pressed ? { opacity: 0.6 } : null,
            ]}
          >
            <Text style={[styles.showEarlierText, { color: colors.tint }]}>
              {loadingReplies
                ? 'Loading replies…'
                : `Show ${hidden} earlier ${hidden === 1 ? 'reply' : 'replies'}`}
            </Text>
          </Pressable>
        ) : null}
        {replies.map((reply, index) => (
          <View
            key={reply.id}
            style={[
              styles.reply,
              { borderTopColor: colors.separator },
              index === 0 && hidden > 0 ? styles.replyAfterButton : null,
            ]}
          >
            <CommentItem comment={reply} ctx={ctx} first={false} thread={thread} />
          </View>
        ))}
      </View>
    </RailRow>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: ROW_GAP,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deletedAvatar: {
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  showEarlier: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    paddingTop: 10,
  },
  showEarlierText: { fontSize: 15, fontWeight: '500' },
  reply: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    paddingTop: 10,
  },
  replyAfterButton: { borderTopWidth: 0, marginTop: 6 },
});

export default ThreadCard;
