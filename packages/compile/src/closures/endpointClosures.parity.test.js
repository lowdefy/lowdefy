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

// S3a (endpoints) gate: a compiled endpoint module must hand the routine
// runner the exact tree it reads today — structure as data with hidden ~k
// markers, and closures at exactly the keys the runner evaluates (control
// inputs and step properties). Each closure through evaluateClosures must
// match ServerParser.parse on the same input bit-for-bit.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ServerParser } from '@lowdefy/operators';

import emitEndpointModule from './emitEndpointModule.js';
import { evaluateClosures } from '../runtime/evaluateClosures.js';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tmpRoot = path.join(pkgRoot, '.tmp-endpoint-closures');

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

const operators = {
  _payload: ({ params, payload }) => payload[params] ?? null,
  _state: ({ params, state }) => state[params] ?? null,
  _secret: ({ params, secrets }) => secrets[params] ?? null,
  _sum: ({ params }) => params.reduce((a, b) => a + b, 0),
};

const envBag = {
  location: 'endpoint:test',
  payload: { email: 'ada@example.com', limit: 3 },
  state: { flag: true, items: ['a', 'b'] },
  secrets: { TOKEN: 's3cr3t' },
  user: { id: 'u1' },
};

function k(node, key) {
  Object.defineProperty(node, '~k', {
    value: key,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  return node;
}

// An endpoint in the build's internal form (real arrays, hidden ~k) covering
// every routine key the runner evaluates, plus data-only twins.
function makeEndpoint() {
  return k(
    {
      id: 'endpoint:test',
      type: 'Api',
      endpointId: 'test',
      routine: k(
        [
          k(
            {
              ':if': k({ _state: 'flag' }, 'k-if-op'),
              ':then': k(
                [
                  k(
                    {
                      id: 'request:test:send',
                      type: 'TestRequest',
                      stepId: 'send',
                      endpointId: 'test',
                      connectionId: 'conn',
                      properties: k(
                        {
                          to: k({ _payload: 'email' }, 'k-payload-op'),
                          subject: 'Invitation',
                          count: k({ _sum: [1, 2] }, 'k-sum-op'),
                        },
                        'k-props'
                      ),
                    },
                    'k-step-send'
                  ),
                ],
                'k-then'
              ),
              ':else': k(
                [
                  k(
                    {
                      ':log': k({ _state: 'items' }, 'k-log-op'),
                      ':level': 'warn',
                    },
                    'k-log-control'
                  ),
                ],
                'k-else'
              ),
            },
            'k-if-control'
          ),
          k(
            {
              ':switch': k(
                [
                  k(
                    {
                      ':case': k({ _payload: 'limit' }, 'k-case-op'),
                      ':then': k([], 'k-case-then'),
                    },
                    'k-case'
                  ),
                ],
                'k-switch'
              ),
              ':default': k([], 'k-default'),
            },
            'k-switch-control'
          ),
          k(
            {
              ':for': 'item',
              ':in': k({ _state: 'items' }, 'k-in-op'),
              ':do': k([], 'k-do'),
            },
            'k-for-control'
          ),
          k(
            { ':set_state': k({ copied: k({ _payload: 'limit' }, 'k-ss-op') }, 'k-ss') },
            'k-ss-control'
          ),
          k(
            {
              ':reject': k({ _state: 'flag' }, 'k-reject-op'),
              ':cause': k({ _payload: 'email' }, 'k-cause-op'),
            },
            'k-reject-control'
          ),
          k({ ':throw': k({ _secret: 'TOKEN' }, 'k-throw-op') }, 'k-throw-control'),
          // Data-only twins — no operators, so these stay plain data.
          k({ ':return': k({ ok: true }, 'k-return-data') }, 'k-return-control'),
          k(
            {
              id: 'request:test:static',
              type: 'TestRequest',
              stepId: 'static',
              endpointId: 'test',
              connectionId: 'conn',
              properties: k({ subject: 'Plain' }, 'k-static-props'),
            },
            'k-step-static'
          ),
        ],
        'k-routine'
      ),
      auth: { public: true },
    },
    'k-endpoint'
  );
}

async function importEndpointModule(endpoint) {
  const { code } = emitEndpointModule({ endpoint, operators });
  fs.mkdirSync(tmpRoot, { recursive: true });
  const file = path.join(tmpRoot, 'endpoint-test.mjs');
  fs.writeFileSync(file, code);
  const mod = await import(`${file}?v=${Date.now()}`);
  return mod.default;
}

function runBoth(closure, input) {
  const parser = new ServerParser({ operators, secrets: envBag.secrets, user: envBag.user });
  const parserResult = parser.parse({
    input,
    location: envBag.location,
    payload: envBag.payload,
    state: envBag.state,
  });
  const closureResult = evaluateClosures({
    closure,
    operators,
    location: envBag.location,
    payload: envBag.payload,
    state: envBag.state,
    secrets: envBag.secrets,
    user: envBag.user,
    parser,
  });
  return { parserResult, closureResult };
}

test('endpoint module keeps routine structure as data with hidden ~k markers', async () => {
  const factory = await importEndpointModule(makeEndpoint());
  const endpoint = factory();

  expect(endpoint.endpointId).toBe('test');
  expect(Array.isArray(endpoint.routine)).toBe(true);
  expect(endpoint.routine).toHaveLength(8);

  // Fresh tree per call — nothing shared between invocations.
  const again = factory();
  expect(again).not.toBe(endpoint);
  expect(again.routine).not.toBe(endpoint.routine);
  expect(again.routine[0]).not.toBe(endpoint.routine[0]);

  // The runner reads control['~k'] for error locations — markers ride
  // hidden, exactly like the serializer reviver's output.
  expect(endpoint['~k']).toBe('k-endpoint');
  expect(Object.keys(endpoint)).not.toContain('~k');
  const ifControl = endpoint.routine[0];
  expect(ifControl['~k']).toBe('k-if-control');
  expect(Object.keys(ifControl)).not.toContain('~k');
  const step = ifControl[':then'][0];
  expect(step['~k']).toBe('k-step-send');
  expect(step.id).toBe('request:test:send');
  expect(step.type).toBe('TestRequest');
  expect(step.connectionId).toBe('conn');
  const caseObj = endpoint.routine[1][':switch'][0];
  expect(caseObj['~k']).toBe('k-case');
});

test('routine keys with operators are closures, data-only keys stay data', async () => {
  const factory = await importEndpointModule(makeEndpoint());
  const endpoint = factory();
  const [ifControl, switchControl, forControl, setStateControl, rejectControl, throwControl] =
    endpoint.routine;

  expect(typeof ifControl[':if']).toBe('function');
  expect(typeof ifControl[':then'][0].properties).toBe('function');
  expect(typeof ifControl[':else'][0][':log']).toBe('function');
  // :level is a plain string — no operators, stays data.
  expect(ifControl[':else'][0][':level']).toBe('warn');
  expect(typeof switchControl[':switch'][0][':case']).toBe('function');
  expect(typeof forControl[':in']).toBe('function');
  expect(forControl[':for']).toBe('item');
  expect(typeof setStateControl[':set_state']).toBe('function');
  expect(typeof rejectControl[':reject']).toBe('function');
  expect(typeof rejectControl[':cause']).toBe('function');
  expect(typeof throwControl[':throw']).toBe('function');

  // Data-only twins keep the legacy parser path.
  const returnControl = endpoint.routine[6];
  expect(typeof returnControl[':return']).toBe('object');
  expect(returnControl[':return']).toEqual({ ok: true });
  expect(returnControl[':return']['~k']).toBe('k-return-data');
  const staticStep = endpoint.routine[7];
  expect(typeof staticStep.properties).toBe('object');
  expect(staticStep.properties).toEqual({ subject: 'Plain' });
});

test('every routine closure matches ServerParser.parse on the same input', async () => {
  const source = makeEndpoint();
  const factory = await importEndpointModule(source);
  const endpoint = factory();
  const [ifControl, switchControl, forControl, setStateControl, rejectControl, throwControl] =
    endpoint.routine;
  const [srcIf, srcSwitch, srcFor, srcSetState, srcReject, srcThrow] = source.routine;

  const pairs = [
    [ifControl[':if'], srcIf[':if']],
    [ifControl[':then'][0].properties, srcIf[':then'][0].properties],
    [ifControl[':else'][0][':log'], srcIf[':else'][0][':log']],
    [switchControl[':switch'][0][':case'], srcSwitch[':switch'][0][':case']],
    [forControl[':in'], srcFor[':in']],
    [setStateControl[':set_state'], srcSetState[':set_state']],
    [rejectControl[':reject'], srcReject[':reject']],
    [rejectControl[':cause'], srcReject[':cause']],
    [throwControl[':throw'], srcThrow[':throw']],
  ];
  for (const [closure, input] of pairs) {
    const { parserResult, closureResult } = runBoth(closure, input);
    expect(closureResult.output).toEqual(parserResult.output);
    expect(closureResult.errors).toEqual(parserResult.errors);
  }

  // Evaluated outputs are fresh per call — no shared structure escapes.
  const propsClosure = ifControl[':then'][0].properties;
  const { closureResult: first } = runBoth(propsClosure, srcIf[':then'][0].properties);
  const { closureResult: second } = runBoth(propsClosure, srcIf[':then'][0].properties);
  expect(first.output).toEqual(second.output);
  expect(first.output).not.toBe(second.output);
});
