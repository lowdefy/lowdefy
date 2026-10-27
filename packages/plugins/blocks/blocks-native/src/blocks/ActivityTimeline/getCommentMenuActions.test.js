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

import getCommentMenuActions from './getCommentMenuActions.js';
import getCommentView from './getCommentView.js';
import getVisibleReplies from './getVisibleReplies.js';

const reactions = ['👍', '🎉'];
const ids = (actions) => actions.map((action) => action.id);

test('getCommentMenuActions gives the author of a first comment every action', () => {
  const view = getCommentView({
    comment: { id: 'c1', by: { id: 'u1' }, reactions: [{ emoji: '🎉', user_ids: ['u1'] }] },
    first: true,
    user: { id: 'u1' },
  });
  const actions = getCommentMenuActions({ view, reactions });
  expect(ids(actions)).toEqual(['react', 'reply', 'copy', 'edit', 'resolve', 'delete']);
  expect(actions[0].subactions).toEqual([
    { id: 'react:👍', title: '👍', state: 'off' },
    { id: 'react:🎉', title: '🎉', state: 'on' },
  ]);
  expect(actions[5].attributes).toEqual({ destructive: true });
});

test('getCommentMenuActions leaves Edit and Delete out on someone else comment', () => {
  const view = getCommentView({
    comment: { id: 'c1', by: { id: 'u2' } },
    first: true,
    user: { id: 'u1' },
  });
  expect(ids(getCommentMenuActions({ view, reactions }))).toEqual([
    'react',
    'reply',
    'copy',
    'resolve',
  ]);
});

test('getCommentMenuActions lets an admin delete any comment but edit only their own', () => {
  const view = getCommentView({
    comment: { id: 'c1', by: { id: 'u2' } },
    first: false,
    user: { id: 'u1', admin: true },
  });
  expect(ids(getCommentMenuActions({ view, reactions }))).toEqual([
    'react',
    'reply',
    'copy',
    'delete',
  ]);
});

test('getCommentMenuActions offers Reopen on a resolved thread', () => {
  const view = getCommentView({
    comment: { id: 'c1', by: { id: 'u2' }, resolved: { by: { name: 'Ada' } } },
    first: true,
    user: { id: 'u1' },
  });
  expect(ids(getCommentMenuActions({ view, reactions }))).toContain('reopen');
});

test('getCommentMenuActions gives a viewer who is not signed in no React', () => {
  const view = getCommentView({ comment: { id: 'c1', by: { id: 'u2' } }, first: false });
  expect(ids(getCommentMenuActions({ view, reactions }))).toEqual(['reply', 'copy']);
});

test('getVisibleReplies shows the newest replies and counts the earlier ones', () => {
  const replies = ['r1', 'r2', 'r3', 'r4', 'r5'].map((id) => ({ id }));
  const shown = getVisibleReplies({
    thread: { replies, reply_count: 5 },
    expanded: false,
    limit: 3,
  });
  expect(shown.replies.map((reply) => reply.id)).toEqual(['r3', 'r4', 'r5']);
  expect(shown.hidden).toBe(2);
  expect(shown.unloaded).toBe(0);
  const all = getVisibleReplies({ thread: { replies, reply_count: 5 }, expanded: true, limit: 3 });
  expect(all.replies).toHaveLength(5);
  expect(all.hidden).toBe(0);
});

test('getVisibleReplies counts replies the server has that are not loaded', () => {
  const replies = [{ id: 'r9' }, { id: 'r10' }, { id: 'r11', deleted: true }];
  const shown = getVisibleReplies({
    thread: { replies, reply_count: 9 },
    expanded: true,
    limit: 3,
  });
  expect(shown.replies.map((reply) => reply.id)).toEqual(['r9', 'r10']);
  expect(shown.hidden).toBe(7);
  expect(shown.unloaded).toBe(7);
});
