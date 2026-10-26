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

import getCommentView from './getCommentView.js';
import toggleReaction from './toggleReaction.js';

test('toggleReaction adds the viewer to a reaction and removes them again', () => {
  const reactions = [{ emoji: '👍', user_ids: ['u2'] }];
  const added = toggleReaction({ reactions, emoji: '👍', userId: 'u1' });
  expect(added).toEqual({ reactions: [{ emoji: '👍', user_ids: ['u2', 'u1'] }], reacted: true });
  expect(reactions).toEqual([{ emoji: '👍', user_ids: ['u2'] }]);
  const removed = toggleReaction({ reactions: added.reactions, emoji: '👍', userId: 'u1' });
  expect(removed).toEqual({ reactions: [{ emoji: '👍', user_ids: ['u2'] }], reacted: false });
});

test('toggleReaction adds a new emoji and drops one nobody has left', () => {
  const added = toggleReaction({ reactions: [], emoji: '🎉', userId: 'u1' });
  expect(added.reactions).toEqual([{ emoji: '🎉', user_ids: ['u1'] }]);
  const removed = toggleReaction({ reactions: added.reactions, emoji: '🎉', userId: 'u1' });
  expect(removed.reactions).toEqual([]);
});

test('toggleReaction works on counted reactions', () => {
  const reactions = [{ emoji: '❤️', count: 2, mine: false }];
  const added = toggleReaction({ reactions, emoji: '❤️', userId: 'u1' });
  expect(added).toEqual({ reactions: [{ emoji: '❤️', count: 3, mine: true }], reacted: true });
  const removed = toggleReaction({
    reactions: [{ emoji: '❤️', count: 1, mine: true }],
    emoji: '❤️',
    userId: 'u1',
  });
  expect(removed).toEqual({ reactions: [], reacted: false });
});

test('getCommentView counts reactions and marks the viewer own', () => {
  const view = getCommentView({
    comment: {
      id: 'c1',
      by: { id: 'u2', name: 'Ada' },
      reactions: [
        { emoji: '👍', user_ids: ['u1', 'u2'] },
        { emoji: '👀', user_ids: [] },
        { emoji: '🎉', count: 1, mine: false },
      ],
    },
    first: true,
    user: { id: 'u1' },
  });
  expect(view.reactions).toEqual([
    { emoji: '👍', count: 2, mine: true },
    { emoji: '🎉', count: 1, mine: false },
  ]);
});
