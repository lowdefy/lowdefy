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

import { serializer } from '@lowdefy/helpers';

import applyMutant from './applyMutant.js';
import enumerateArtifact from './enumerateArtifact.js';
import findNodeByKey from './findNodeByKey.js';
import operators from './operators/index.js';
import { endpointFixture, eventsFixture, pageFixture, requestFixture } from './test/fixtures.mjs';

const PAGE = 'pages/tickets.json';
const EVENTS = 'events.json';
const REQUEST = 'pages/tickets/requests/assign_ticket.json';
const ENDPOINT = 'api/notify.json';

function describes({ artifact, root, operator }) {
  return enumerateArtifact({ artifact, root, operators: [operators[operator]] }).map(
    (mutant) => mutant.describe
  );
}

function mutate({ artifact, root, operator, describe }) {
  const mutant = enumerateArtifact({ artifact, root, operators: [operators[operator]] }).find(
    (candidate) => candidate.describe === describe
  );
  const copy = serializer.copy(root);
  const result = applyMutant({ root: copy, mutant });
  return { copy, result, mutant };
}

test('drop-action enumerates every action of every page and app event', () => {
  const { root } = pageFixture();
  expect(describes({ artifact: PAGE, root, operator: 'drop-action' })).toEqual([
    'drop-action SetState "init_state" (1 of 1) from tickets.onInit',
    'drop-action Validate "validate" (1 of 7) from assign_submit.onClick',
    'drop-action Request "assign" (2 of 7) from assign_submit.onClick',
    'drop-action SetState "notify" (3 of 7) from assign_submit.onClick',
    'drop-action Link "go" (4 of 7) from assign_submit.onClick',
    'drop-action Link "home_link" (5 of 7) from assign_submit.onClick',
    'drop-action Link "out" (6 of 7) from assign_submit.onClick',
    'drop-action Link "back" (7 of 7) from assign_submit.onClick',
  ]);
  expect(
    describes({ artifact: EVENTS, root: eventsFixture().root, operator: 'drop-action' })
  ).toEqual([
    'drop-action Link "to_login" (1 of 3) from app.onInit',
    'drop-action Validate "check" (2 of 3) from app.onInit',
    'drop-action Throw "fail" (3 of 3) from app.onInit',
  ]);
});

test('drop-action anchors on the page, block, event and action', () => {
  const { root } = pageFixture();
  const [, , assign] = enumerateArtifact({
    artifact: PAGE,
    root,
    operators: [operators['drop-action']],
  });
  expect(assign.anchor).toEqual({
    type: 'action',
    pageId: 'tickets',
    blockId: 'assign_submit',
    eventName: 'onClick',
    actionId: 'assign',
  });
  const [appAction] = enumerateArtifact({
    artifact: EVENTS,
    root: eventsFixture().root,
    operators: [operators['drop-action']],
  });
  expect(appAction.anchor).toEqual({
    type: 'action',
    pageId: 'app',
    blockId: null,
    eventName: 'onInit',
    actionId: 'to_login',
  });
});

test('drop-action removes the action from its event', () => {
  const { copy, result } = mutate({
    artifact: PAGE,
    root: pageFixture().root,
    operator: 'drop-action',
    describe: 'drop-action Request "assign" (2 of 7) from assign_submit.onClick',
  });
  expect(result).toEqual({ applied: true });
  expect(copy.slots.content.blocks[2].events.onClick.try.map((action) => action.id)).toEqual([
    'validate',
    'notify',
    'go',
    'home_link',
    'out',
    'back',
  ]);
});

test('skip-validate enumerates Validate actions, required and validate rules on pages, not in app events', () => {
  expect(
    describes({ artifact: PAGE, root: pageFixture().root, operator: 'skip-validate' })
  ).toEqual([
    'skip-validate required on name',
    'skip-validate validate rule 1 of 1 on name',
    'skip-validate Validate "validate" from assign_submit.onClick',
  ]);
  expect(
    describes({ artifact: EVENTS, root: eventsFixture().root, operator: 'skip-validate' })
  ).toEqual([]);
});

test('skip-validate removes required, a validate rule, or a Validate action', () => {
  const root = pageFixture().root;
  const required = mutate({
    artifact: PAGE,
    root,
    operator: 'skip-validate',
    describe: 'skip-validate required on name',
  });
  expect(required.result).toEqual({ applied: true });
  expect(required.copy.slots.content.blocks[1].required).toBeUndefined();
  const rule = mutate({
    artifact: PAGE,
    root,
    operator: 'skip-validate',
    describe: 'skip-validate validate rule 1 of 1 on name',
  });
  expect(rule.copy.slots.content.blocks[1].validate).toEqual([]);
  expect(rule.mutant.anchor).toEqual({
    type: 'block',
    pageId: 'tickets',
    blockId: 'name',
    parentBlockId: 'tickets',
  });
  const action = mutate({
    artifact: PAGE,
    root,
    operator: 'skip-validate',
    describe: 'skip-validate Validate "validate" from assign_submit.onClick',
  });
  expect(action.copy.slots.content.blocks[2].events.onClick.try[0].id).toEqual('assign');
});

test('flip-visible enumerates visible and properties.disabled and skips blocks declaring neither', () => {
  expect(describes({ artifact: PAGE, root: pageFixture().root, operator: 'flip-visible' })).toEqual(
    [
      'flip-visible properties.disabled on name',
      'flip-visible visible on assign_submit',
      'flip-visible visible on box',
    ]
  );
});

test('flip-visible negates a literal boolean and wraps anything else in _not', () => {
  const root = pageFixture().root;
  const literal = mutate({
    artifact: PAGE,
    root,
    operator: 'flip-visible',
    describe: 'flip-visible visible on assign_submit',
  });
  expect(literal.copy.slots.content.blocks[2].visible).toBe(false);
  const computed = mutate({
    artifact: PAGE,
    root,
    operator: 'flip-visible',
    describe: 'flip-visible properties.disabled on name',
  });
  expect(computed.copy.slots.content.blocks[1].properties.disabled).toEqual({
    _not: { _state: 'locked' },
  });
});

test('swap-if enumerates _if with an else in block properties, action params and request payload only', () => {
  expect(describes({ artifact: PAGE, root: pageFixture().root, operator: 'swap-if' })).toEqual([
    'swap-if _if in title.properties',
    'swap-if _if in request "assign_ticket" payload',
  ]);
  expect(describes({ artifact: EVENTS, root: eventsFixture().root, operator: 'swap-if' })).toEqual([
    'swap-if _if in action "fail" params',
  ]);
  expect(
    describes({ artifact: REQUEST, root: requestFixture().root, operator: 'swap-if' })
  ).toEqual(['swap-if _if in request "assign_ticket" properties']);
  expect(
    describes({ artifact: ENDPOINT, root: endpointFixture().root, operator: 'swap-if' })
  ).toEqual(['swap-if _if in endpoint "notify"', 'swap-if :if in endpoint "notify"']);
});

test('swap-if swaps then and else of an _if, and :then and :else of a routine :if', () => {
  const page = mutate({
    artifact: PAGE,
    root: pageFixture().root,
    operator: 'swap-if',
    describe: 'swap-if _if in title.properties',
  });
  expect(page.copy.slots.content.blocks[0].properties.content._if).toEqual({
    test: { _state: 'open' },
    then: 'Closed',
    else: 'Open',
  });
  const routine = mutate({
    artifact: ENDPOINT,
    root: endpointFixture().root,
    operator: 'swap-if',
    describe: 'swap-if :if in endpoint "notify"',
  });
  expect(routine.copy.routine[1][':then'][0].stepId).toEqual('log');
  expect(routine.copy.routine[1][':else'][0].stepId).toEqual('page');
  expect(routine.mutant.anchor).toEqual({ type: 'endpoint', endpointId: 'notify' });
});

test('drop-payload enumerates each payload key of a page request and removes one', () => {
  const root = pageFixture().root;
  expect(describes({ artifact: PAGE, root, operator: 'drop-payload' })).toEqual([
    'drop-payload "ticket_id" from request "assign_ticket"',
    'drop-payload "assignee" from request "assign_ticket"',
    'drop-payload "priority" from request "assign_ticket"',
  ]);
  expect(
    describes({ artifact: REQUEST, root: requestFixture().root, operator: 'drop-payload' })
  ).toEqual([]);
  const { copy, mutant } = mutate({
    artifact: PAGE,
    root,
    operator: 'drop-payload',
    describe: 'drop-payload "assignee" from request "assign_ticket"',
  });
  expect(Object.keys(copy.requests[0].payload)).toEqual(['ticket_id', 'priority']);
  expect(mutant.anchor).toEqual({ type: 'request', pageId: 'tickets', requestId: 'assign_ticket' });
});

test('retarget-link enumerates Links to a page and skips Links by url, back or home', () => {
  expect(
    describes({ artifact: PAGE, root: pageFixture().root, operator: 'retarget-link' })
  ).toEqual([
    'retarget-link Link "go" from assign_submit.onClick to 404',
    'retarget-link Link "home_link" from assign_submit.onClick to 404',
  ]);
  expect(
    describes({ artifact: EVENTS, root: eventsFixture().root, operator: 'retarget-link' })
  ).toEqual(['retarget-link Link "to_login" from app.onInit to 404']);
});

test('retarget-link points params.pageId or string params at 404', () => {
  const root = pageFixture().root;
  const object = mutate({
    artifact: PAGE,
    root,
    operator: 'retarget-link',
    describe: 'retarget-link Link "go" from assign_submit.onClick to 404',
  });
  expect(object.copy.slots.content.blocks[2].events.onClick.try[3].params).toEqual({
    pageId: '404',
    urlQuery: { id: 1 },
  });
  const string = mutate({
    artifact: PAGE,
    root,
    operator: 'retarget-link',
    describe: 'retarget-link Link "home_link" from assign_submit.onClick to 404',
  });
  expect(string.copy.slots.content.blocks[2].events.onClick.try[4].params).toEqual('404');
});

test('drop-block enumerates every block but the page and removes one from its slot', () => {
  const root = pageFixture().root;
  expect(describes({ artifact: PAGE, root, operator: 'drop-block' })).toEqual([
    'drop-block Title "title" from tickets',
    'drop-block TextInput "name" from tickets',
    'drop-block Button "assign_submit" from tickets',
    'drop-block Box "box" from tickets',
    'drop-block Alert "success" from box',
  ]);
  const { copy, mutant } = mutate({
    artifact: PAGE,
    root,
    operator: 'drop-block',
    describe: 'drop-block Alert "success" from box',
  });
  expect(copy.slots.content.blocks[3].slots.content.blocks).toEqual([]);
  expect(mutant.anchor).toEqual({
    type: 'block',
    pageId: 'tickets',
    blockId: 'success',
    parentBlockId: 'box',
  });
});

test('drop-step enumerates routine steps at any depth, never values shaped like steps', () => {
  const root = endpointFixture().root;
  expect(describes({ artifact: ENDPOINT, root, operator: 'drop-step' })).toEqual([
    'drop-step MongoDBFindOne "find" from endpoint "notify"',
    'drop-step AxiosHttp "page" from endpoint "notify"',
    'drop-step MongoDBInsertOne "log" from endpoint "notify"',
  ]);
  const { copy } = mutate({
    artifact: ENDPOINT,
    root,
    operator: 'drop-step',
    describe: 'drop-step AxiosHttp "page" from endpoint "notify"',
  });
  expect(copy.routine[1][':then']).toEqual([]);
});

test('operators enumerate nothing from request config in a page artifact other than payload', () => {
  const mutants = enumerateArtifact({
    artifact: PAGE,
    root: pageFixture().root,
    operators: Object.values(operators),
  });
  const requestMutants = mutants.filter((mutant) => mutant.anchor.type === 'request');
  expect(requestMutants.map((mutant) => mutant.operator)).toEqual([
    'drop-payload',
    'drop-payload',
    'drop-payload',
    'swap-if',
  ]);
  expect(
    mutants.some(
      (mutant) => mutant.describe.includes('properties') && mutant.anchor.type === 'request'
    )
  ).toBe(false);
});

test('operators leave out a target the build made without a ~k', () => {
  const { root } = pageFixture();
  const mutants = enumerateArtifact({ artifact: PAGE, root, operators: Object.values(operators) });
  expect(mutants.every((mutant) => typeof mutant.key === 'string')).toBe(true);
});

test('findNodeByKey finds the non-enumerable ~k on objects and on arrays', () => {
  const { root } = pageFixture();
  const blocks = root.slots.content.blocks;
  expect(Object.keys(blocks[0])).not.toContain('~k');
  expect(findNodeByKey({ root, key: blocks[1]['~k'] })).toEqual({
    node: blocks[1],
    parent: blocks,
    keyInParent: 1,
  });
  expect(findNodeByKey({ root, key: blocks['~k'] })).toEqual({
    node: blocks,
    parent: root.slots.content,
    keyInParent: 'blocks',
  });
  expect(findNodeByKey({ root, key: 'missing' })).toBeNull();
});

test('applyMutant reports a missing key and a missing arg as not applied and changes nothing', () => {
  const { root } = pageFixture();
  const copy = serializer.copy(root);
  expect(
    applyMutant({ root: copy, mutant: { operator: 'drop-block', key: 'missing', arg: null } })
  ).toEqual({
    applied: false,
    reason: 'key not found',
  });
  const name = copy.slots.content.blocks[1];
  expect(
    applyMutant({ root: copy, mutant: { operator: 'flip-visible', key: name['~k'] } })
  ).toEqual({
    applied: false,
    reason: 'flip-visible needs arg visible or properties.disabled',
  });
  const payload = copy.requests[0].payload;
  expect(
    applyMutant({ root: copy, mutant: { operator: 'drop-payload', key: payload['~k'] } })
  ).toEqual({
    applied: false,
    reason: 'drop-payload needs the payload key as arg',
  });
  expect(JSON.stringify(copy)).toEqual(JSON.stringify(root));
});

test('applyMutant refuses an unknown operator', () => {
  const { root } = pageFixture();
  expect(applyMutant({ root, mutant: { operator: 'delete-everything', key: root['~k'] } })).toEqual(
    {
      applied: false,
      reason: 'unknown operator "delete-everything"',
    }
  );
});
