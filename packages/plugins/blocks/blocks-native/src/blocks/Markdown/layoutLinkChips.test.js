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
import { Text } from 'react-native';

import layoutLinkChips from './layoutLinkChips.js';
import LinkChip from './LinkChip.js';

const body = { color: 'label', fontSize: 17, lineHeight: 22 };
const strong = { ...body, fontWeight: '600' };

function chip(key) {
  return <LinkChip key={key} linkKey={key} title="Run a transcript through meeting filing" />;
}

function text(key, content, style = body) {
  return (
    <Text key={key} style={style}>
      {content}
    </Text>
  );
}

test('layoutLinkChips moves a full stop after a chip into the chip, and keeps the rest', () => {
  const [laidChip, rest] = layoutLinkChips([
    chip('ACME-644'),
    text('t', '. It has 4 checklist steps, none done yet.'),
  ]);
  expect(laidChip.props.trailing).toEqual({ style: [body], text: '.' });
  expect(laidChip.props.followed).toBe(true);
  expect(rest.props.children).toBe(' It has 4 checklist steps, none done yet.');
});

test('layoutLinkChips attaches each closing punctuation mark, and runs of them', () => {
  ['.', ',', ';', ':', ')', '?', '!', ').', '?!'].forEach((mark) => {
    const [laidChip] = layoutLinkChips([chip('ACME-1'), text('t', `${mark} next`)]);
    expect(laidChip.props.trailing.text).toBe(mark);
  });
});

test('layoutLinkChips leaves text that does not start with closing punctuation after a chip', () => {
  const nodes = layoutLinkChips([chip('ACME-1'), text('t', ' owns it.'), text('u', '(aside)')]);
  expect(nodes[0].props.trailing).toBeUndefined();
  expect(nodes[1].props.children).toBe(' owns it.');
  expect(nodes[2].props.children).toBe('(aside)');
});

test('layoutLinkChips marks a chip at the end of its line, with only punctuation after it, not followed', () => {
  const [, laidChip, rest] = layoutLinkChips([
    text('t', 'Fixed in '),
    chip('ACME-647'),
    text('u', '.'),
  ]);
  expect(laidChip.props.trailing).toEqual({ style: [body], text: '.' });
  expect(laidChip.props.followed).toBe(false);
  expect(rest.props.children).toBe('');
});

test('layoutLinkChips marks a chip followed by another chip as followed', () => {
  const [first, between, second] = layoutLinkChips([
    chip('ACME-1'),
    text('t', ', '),
    chip('ACME-2'),
  ]);
  expect(first.props.trailing.text).toBe(',');
  expect(first.props.followed).toBe(true);
  expect(between.props.children).toBe(' ');
  expect(second.props.followed).toBe(false);
});

test('layoutLinkChips attaches punctuation outside emphasis to a chip inside it', () => {
  const [bold] = layoutLinkChips([
    <Text key="b" style={strong}>
      {[chip('ACME-3')]}
    </Text>,
    text('t', '; then the rest.'),
  ]);
  const [laidChip] = bold.props.children;
  expect(laidChip.props.trailing).toEqual({ style: [body], text: ';' });
  expect(laidChip.props.followed).toBe(true);
});

test('layoutLinkChips takes punctuation inside emphasis in the emphasis style', () => {
  const [laidChip] = layoutLinkChips([
    chip('ACME-4'),
    <Text key="b" style={strong}>
      {[text('t', '! Done.', strong)]}
    </Text>,
  ]);
  expect(laidChip.props.trailing).toEqual({ style: [strong, strong], text: '!' });
});

test('layoutLinkChips returns a line without chips as it is', () => {
  const nodes = [text('t', 'Plain. Text.')];
  expect(layoutLinkChips(nodes)).toBe(nodes);
  expect(layoutLinkChips('Heading')).toBe('Heading');
});
