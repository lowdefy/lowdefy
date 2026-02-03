/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { pathMatches, shouldSkipResolution } from './pathMatcher.js';

test('pathMatches matches exact path', () => {
  expect(pathMatches('pages.0.blocks', 'pages.*.blocks')).toBe(true);
});

test('pathMatches matches wildcard with any segment', () => {
  expect(pathMatches('pages.5.blocks', 'pages.*.blocks')).toBe(true);
  expect(pathMatches('pages.123.blocks', 'pages.*.blocks')).toBe(true);
});

test('pathMatches matches paths below the pattern', () => {
  expect(pathMatches('pages.0.blocks.0.content', 'pages.*.blocks')).toBe(true);
});

test('pathMatches does not match unrelated paths', () => {
  expect(pathMatches('connections.0.properties', 'pages.*.blocks')).toBe(false);
});

test('pathMatches does not match partial path above pattern', () => {
  expect(pathMatches('pages.0', 'pages.*.blocks')).toBe(false);
});

test('pathMatches matches pages.*.areas pattern', () => {
  expect(pathMatches('pages.0.areas', 'pages.*.areas')).toBe(true);
  expect(pathMatches('pages.2.areas.content.blocks', 'pages.*.areas')).toBe(true);
});

test('pathMatches matches pages.*.events pattern', () => {
  expect(pathMatches('pages.0.events', 'pages.*.events')).toBe(true);
  expect(pathMatches('pages.0.events.onClick', 'pages.*.events')).toBe(true);
});

test('pathMatches matches pages.*.requests pattern', () => {
  expect(pathMatches('pages.0.requests', 'pages.*.requests')).toBe(true);
  expect(pathMatches('pages.3.requests.0.properties', 'pages.*.requests')).toBe(true);
});

test('pathMatches matches pages.*.layout pattern', () => {
  expect(pathMatches('pages.0.layout', 'pages.*.layout')).toBe(true);
});

test('pathMatches does not match page-level metadata paths', () => {
  expect(pathMatches('pages.0.id', 'pages.*.blocks')).toBe(false);
  expect(pathMatches('pages.0.auth', 'pages.*.blocks')).toBe(false);
  expect(pathMatches('pages.0.type', 'pages.*.blocks')).toBe(false);
});

test('shouldSkipResolution returns true when path matches any stop pattern', () => {
  const stopPatterns = [
    'pages.*.blocks',
    'pages.*.areas',
    'pages.*.events',
    'pages.*.requests',
    'pages.*.layout',
  ];
  expect(shouldSkipResolution('pages.0.blocks', stopPatterns)).toBe(true);
  expect(shouldSkipResolution('pages.1.events.onClick', stopPatterns)).toBe(true);
});

test('shouldSkipResolution returns false when path does not match any pattern', () => {
  const stopPatterns = ['pages.*.blocks', 'pages.*.areas'];
  expect(shouldSkipResolution('connections.0.properties', stopPatterns)).toBe(false);
  expect(shouldSkipResolution('pages.0.id', stopPatterns)).toBe(false);
});

test('shouldSkipResolution returns false when stopPatterns is empty', () => {
  expect(shouldSkipResolution('pages.0.blocks', [])).toBe(false);
});

test('shouldSkipResolution returns false when stopPatterns is null', () => {
  expect(shouldSkipResolution('pages.0.blocks', null)).toBe(false);
});

test('shouldSkipResolution returns false when stopPatterns is undefined', () => {
  expect(shouldSkipResolution('pages.0.blocks', undefined)).toBe(false);
});
