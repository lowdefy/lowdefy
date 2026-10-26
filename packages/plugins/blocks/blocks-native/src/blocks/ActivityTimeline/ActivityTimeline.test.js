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

import { act, fireEvent, screen } from '@testing-library/react-native';

import { Link } from '@lowdefy/actions-core/actions';

import { page, record, renderPage } from '../../test/renderPage.js';

const sam = { id: 'u1', name: 'Sam Taylor' };
const ada = { id: 'u2', name: 'Ada Lovelace' };
const minutesAgo = (n) => new Date(Date.now() - n * 60 * 1000).toISOString();

const entries = [
  {
    id: 'e1',
    at: minutesAgo(300),
    tier: 'key',
    type: 'status-change',
    by: sam,
    what: { from: 'todo', to: 'in_progress' },
  },
  { id: 'e2', at: minutesAgo(200), tier: 'detail', type: 'edit', by: ada, what: { field: 'body' } },
  {
    id: 'e3',
    at: minutesAgo(190),
    tier: 'detail',
    type: 'edit',
    by: ada,
    what: { field: 'title' },
  },
  { type: 'gap', id: 'g1', count: 14, actors: [sam, ada] },
  {
    id: 'c1',
    type: 'comment',
    at: minutesAgo(5),
    by: ada,
    body: 'Over to you [[user:u1]]',
    mentions: [{ user_id: 'u1', name: 'Sam Taylor', sees: true }],
    reactions: [{ emoji: '👍', user_ids: ['u2'] }],
    reply_count: 5,
    replies: [
      { id: 'r3', at: minutesAgo(4), by: sam, body: 'Third' },
      { id: 'r4', at: minutesAgo(3), by: ada, body: 'Fourth' },
      { id: 'r5', at: minutesAgo(2), by: sam, body: 'Fifth', edited_at: minutesAgo(1) },
    ],
  },
];

const formatEvent = {
  'status-change': {
    icon: 'CircleDot',
    tone: 'primary',
    text: '{actor} moved it to **{what.to|humanize}**',
  },
  edit: {
    icon: 'Pencil',
    text: '{actor} edited the {what.field}',
    summary: 'edited the {what.field}',
  },
};

async function renderTimeline(events = {}) {
  return renderPage({
    pageConfig: page([
      {
        id: 'activity',
        type: 'ActivityTimeline',
        properties: { entries, formatEvent, user: { id: 'u1' } },
        events,
      },
    ]),
  });
}

test('an ActivityTimeline words events, folds detail by actor and counts gaps', async () => {
  await renderTimeline();
  expect(await screen.findByText('In progress')).toBeTruthy();
  expect(screen.getByText(' edited the body and edited the title')).toBeTruthy();
  expect(screen.getByText('14 earlier changes')).toBeTruthy();
  expect(screen.getByText('  5h')).toBeTruthy();
});

test('an ActivityTimeline opens a folded group to show each event', async () => {
  await renderTimeline();
  const group = await screen.findByText(' edited the body and edited the title');
  await act(async () => {
    fireEvent.press(group);
  });
  expect(screen.getByText('edited the body')).toBeTruthy();
  expect(screen.getByText('edited the title')).toBeTruthy();
});

test('an ActivityTimeline draws a comment with its mention chip, newest replies and reactions', async () => {
  await renderTimeline();
  expect(await screen.findByText('@Sam Taylor')).toBeTruthy();
  expect(screen.getByText('Show 2 earlier replies')).toBeTruthy();
  expect(screen.getByText('Fifth')).toBeTruthy();
  expect(screen.getByText(/Sam Taylor 2m · edited/)).toBeTruthy();
  expect(screen.getByLabelText('👍 1')).toBeTruthy();
});

test('an ActivityTimeline toggles a reaction at once and raises onReact', async () => {
  const { calls } = await renderTimeline({ onReact: record('react') });
  await act(async () => {
    fireEvent.press(await screen.findByLabelText('👍 1'));
  });
  expect(screen.getByLabelText('👍 2, you reacted')).toBeTruthy();
  expect(calls).toEqual([
    { name: 'react', event: { comment_id: 'c1', emoji: '👍', reacted: true } },
  ]);
});

test('an ActivityTimeline raises onReply from a comment menu with the thread to reply to', async () => {
  const { calls } = await renderTimeline({ onReply: record('reply') });
  const menu = await screen.findByTestId('comment_r4_menu');
  expect(menu.props.actions.map((action) => action.id)).toEqual(['react', 'reply', 'copy']);
  await act(async () => {
    fireEvent(menu, 'pressAction', { nativeEvent: { event: 'reply' } });
  });
  expect(calls).toEqual([
    { name: 'reply', event: { comment_id: 'r4', thread_id: 'c1', name: 'Ada Lovelace' } },
  ]);
});

test('an ActivityTimeline raises onLoadReplies for replies it does not have', async () => {
  const { calls } = await renderTimeline({ onLoadReplies: record('replies') });
  await act(async () => {
    fireEvent.press(await screen.findByText('Show 2 earlier replies'));
  });
  expect(calls).toEqual([{ name: 'replies', event: { thread_id: 'c1' } }]);
});

test('an ActivityTimeline raises onExpandGap from a gap line', async () => {
  const { calls } = await renderTimeline({ onExpandGap: record('gap') });
  await act(async () => {
    fireEvent.press(await screen.findByText('14 earlier changes'));
  });
  expect(calls).toEqual([
    { name: 'gap', event: { after: null, before: null, count: 14, id: 'g1' } },
  ]);
});

// The line's outer Text, which holds a part of its sentence.
function lineOf(part) {
  let element = part;
  while (element.props.ellipsizeMode !== 'tail') element = element.parent;
  return element;
}

test('an ActivityTimeline cuts a long event line and note short with an ellipsis until tapped', async () => {
  const title =
    'Use the platform passkey sheet on iOS and Android, keep the recovery code for every site and ' +
    'retire passwords once the pilot sites have moved over';
  await renderPage({
    pageConfig: page([
      {
        id: 'activity',
        type: 'ActivityTimeline',
        properties: {
          entries: [
            {
              id: 'd1',
              at: minutesAgo(30),
              tier: 'key',
              type: 'ratified',
              by: sam,
              what: { title, note: `Agreed in the review. ${title}.` },
            },
            {
              id: 'c9',
              type: 'comment',
              at: minutesAgo(5),
              by: ada,
              body: `Comment bodies stay whole: ${title}`,
            },
          ],
          formatEvent: {
            ratified: {
              icon: 'CircleCheck',
              tone: 'success',
              text: '{actor} ratified **{what.title}**',
              note: '{what.note}',
            },
          },
          user: { id: 'u1' },
        },
      },
    ]),
  });
  const strong = await screen.findByText(title);
  const line = lineOf(strong);
  expect(line.props.numberOfLines).toEqual(2);
  expect(line.props.ellipsizeMode).toEqual('tail');
  const note = screen.getByText(`Agreed in the review. ${title}.`);
  expect(note.props.numberOfLines).toEqual(3);
  expect(note.props.ellipsizeMode).toEqual('tail');
  const comment = screen.getByText(`Comment bodies stay whole: ${title}`);
  expect(comment.props.numberOfLines).toBeUndefined();

  await act(async () => {
    fireEvent.press(strong);
  });
  expect(lineOf(screen.getByText(title)).props.numberOfLines).toBeUndefined();
  expect(screen.getByText(`Agreed in the review. ${title}.`).props.numberOfLines).toBeUndefined();
  await act(async () => {
    fireEvent.press(screen.getByText(title));
  });
  expect(lineOf(screen.getByText(title)).props.numberOfLines).toEqual(2);
});

test('an ActivityTimeline without onLinkPress opens an app path in a comment as a page', async () => {
  const { host } = await renderPage({
    actions: { Link },
    pageConfig: page([
      {
        id: 'activity',
        type: 'ActivityTimeline',
        properties: {
          entries: [
            {
              id: 'c10',
              type: 'comment',
              at: minutesAgo(5),
              by: ada,
              body: 'Raised on [the order](/orders/42).',
            },
          ],
          user: { id: 'u1' },
        },
      },
    ]),
  });
  await act(async () => {
    fireEvent.press(await screen.findByText('the order'));
  });
  expect(host.router.push).toHaveBeenCalledWith(
    expect.objectContaining({ pathname: '/orders/42' })
  );
});

test('an ActivityTimeline draws linkChips links in comment bodies as chips that fire onLinkPress', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'activity',
        type: 'ActivityTimeline',
        properties: {
          entries: [
            {
              id: 'c9',
              type: 'comment',
              at: minutesAgo(5),
              by: ada,
              body: 'See [ACME-12 Sign in with a passkey](acme:ACME-12)',
            },
          ],
          linkChips: [{ scheme: 'acme', icon: 'FileText', tone: 'primary' }],
          user: { id: 'u1' },
        },
        events: { onLinkPress: record('link') },
      },
    ]),
  });
  const chip = await screen.findByLabelText('ACME-12 Sign in with a passkey');
  expect(screen.getByText('ACME-12')).toBeTruthy();
  await act(async () => {
    fireEvent.press(chip);
  });
  expect(calls).toEqual([{ name: 'link', event: { href: 'acme:ACME-12' } }]);
});
