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

import getActor from './getActor.js';

// A reaction as a pill draws it. Reactions come as { emoji, user_ids } or, already counted, as
// { emoji, count, mine }.
function toPill({ reaction, userId }) {
  if (type.isArray(reaction.user_ids)) {
    return {
      emoji: reaction.emoji,
      count: reaction.user_ids.length,
      mine: !type.isNone(userId) && reaction.user_ids.includes(userId),
    };
  }
  return { emoji: reaction.emoji, count: reaction.count ?? 0, mine: reaction.mine === true };
}

/**
 * A comment as its card draws it, with what the viewer may do to it: edit their own, delete
 * their own (an admin any), reply to and react to any that is not deleted, and resolve or reopen
 * a thread's first comment.
 *
 * @param {Object} params
 * @param {Object} params.comment
 * @param {boolean} params.first Whether it is its thread's first comment.
 * @param {{ id?: string, admin?: boolean }} [params.user] The viewer.
 * @param {Array} [params.members]
 * @returns {Object}
 */
function getCommentView({ comment, first, user, members }) {
  const actor = getActor({ by: comment.by, members });
  const userId = user?.id ?? null;
  const mine = !type.isNone(userId) && comment.by?.id === userId;
  const deleted = comment.deleted === true;
  return {
    id: comment.id,
    actor,
    at: comment.at,
    edited: !type.isNone(comment.edited_at),
    deleted,
    body: deleted ? '' : comment.body ?? '',
    mentions: comment.mentions ?? [],
    reactions: (comment.reactions ?? [])
      .filter((reaction) => type.isObject(reaction) && type.isString(reaction.emoji))
      .map((reaction) => toPill({ reaction, userId }))
      .filter((pill) => pill.count > 0),
    resolved: first && !type.isNone(comment.resolved) && comment.resolved !== false,
    canEdit: mine && !deleted,
    canDelete: !deleted && (mine || user?.admin === true),
    canReply: !deleted,
    canResolve: first && !deleted,
    canReact: !deleted && !type.isNone(userId),
  };
}

export default getCommentView;
