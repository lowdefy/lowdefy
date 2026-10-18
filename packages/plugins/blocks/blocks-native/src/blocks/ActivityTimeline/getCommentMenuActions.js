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

/**
 * The actions of a comment's menu, as @expo/ui's MenuView takes them (SF Symbol images on
 * iOS): React (a submenu of the reactions, the viewer's own checked), Reply, Copy, Edit on the
 * viewer's own, Resolve or Reopen on a thread's first comment, and Delete on the viewer's own
 * (an admin's on any). An action's id is what the menu reports when it is picked; a reaction's
 * id is `react:<emoji>`.
 *
 * @param {Object} params
 * @param {Object} params.view The comment's view (getCommentView).
 * @param {string[]} params.reactions The emoji the React submenu offers.
 * @returns {Object[]}
 */
function getCommentMenuActions({ view, reactions }) {
  const actions = [];
  if (view.canReact) {
    const mine = new Set(view.reactions.filter((pill) => pill.mine).map((pill) => pill.emoji));
    actions.push({
      id: 'react',
      title: 'React',
      image: 'face.smiling',
      subactions: reactions.map((emoji) => ({
        id: `react:${emoji}`,
        title: emoji,
        state: mine.has(emoji) ? 'on' : 'off',
      })),
    });
  }
  if (view.canReply) {
    actions.push({ id: 'reply', title: 'Reply', image: 'arrowshape.turn.up.left' });
  }
  if (!view.deleted) {
    actions.push({ id: 'copy', title: 'Copy', image: 'doc.on.doc' });
  }
  if (view.canEdit) {
    actions.push({ id: 'edit', title: 'Edit', image: 'pencil' });
  }
  if (view.canResolve) {
    actions.push(
      view.resolved
        ? { id: 'reopen', title: 'Reopen', image: 'arrow.uturn.backward.circle' }
        : { id: 'resolve', title: 'Resolve', image: 'checkmark.circle' }
    );
  }
  if (view.canDelete) {
    actions.push({
      id: 'delete',
      title: 'Delete',
      image: 'trash',
      attributes: { destructive: true },
    });
  }
  return actions;
}

export default getCommentMenuActions;
