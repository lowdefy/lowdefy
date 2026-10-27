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

import { type } from '@lowdefy/helpers';

/**
 * A comment's reactions with the viewer's own reaction of `emoji` turned on or off, as the
 * server will have them once the reaction is saved, so the pill changes at once. Works on
 * { emoji, user_ids } and on counted { emoji, count, mine } reactions.
 *
 * @param {Object} params
 * @param {Object[]} [params.reactions]
 * @param {string} params.emoji
 * @param {string} params.userId
 * @returns {{ reactions: Object[], reacted: boolean }} The reactions, and whether the viewer
 *   now has the reaction.
 */
function toggleReaction({ reactions, emoji, userId }) {
  const next = (reactions ?? []).map((reaction) => ({
    ...reaction,
    ...(type.isArray(reaction.user_ids) ? { user_ids: [...reaction.user_ids] } : {}),
  }));
  const index = next.findIndex((reaction) => reaction.emoji === emoji);
  if (index < 0) {
    next.push({ emoji, user_ids: [userId] });
    return { reactions: next, reacted: true };
  }
  const reaction = next[index];
  let reacted;
  if (type.isArray(reaction.user_ids)) {
    const at = reaction.user_ids.indexOf(userId);
    reacted = at < 0;
    if (reacted) {
      reaction.user_ids.push(userId);
    } else {
      reaction.user_ids.splice(at, 1);
    }
    if (reaction.user_ids.length === 0) next.splice(index, 1);
    return { reactions: next, reacted };
  }
  reacted = reaction.mine !== true;
  reaction.mine = reacted;
  reaction.count = Math.max(0, (reaction.count ?? 0) + (reacted ? 1 : -1));
  if (reaction.count === 0) next.splice(index, 1);
  return { reactions: next, reacted };
}

export default toggleReaction;
