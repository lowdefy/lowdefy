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

import buildChainCountQuery from './buildChainCountQuery.js';
import buildDayQuery from './buildDayQuery.js';

describe('buildDayQuery', () => {
  test('buildDayQuery carries every value in placeholders, never in the query text', () => {
    const { query, values } = buildDayQuery({
      day: '2026-10-01',
      after: { timestamp: '2026-10-01T10:00:00.123000Z', uuid: 'uuid-after-1' },
      pageSize: 1234,
      includeChain: true,
      environment: 'prod-env-value',
    });
    expect(values).toEqual({
      day_start: '2026-10-01T00:00:00.000Z',
      day_end: '2026-10-02T00:00:00.000Z',
      after_ts: '2026-10-01T10:00:00.123000Z',
      after_uuid: 'uuid-after-1',
      page_size: 1234,
      environment: 'prod-env-value',
    });
    ['2026-10-01', 'uuid-after-1', '1234', 'prod-env-value'].forEach((value) => {
      expect(query).not.toContain(value);
    });
    expect(query).toContain('{after_uuid}');
    expect(query).toContain('ORDER BY timestamp, toString(uuid)');
    expect(query).toContain('LIMIT {page_size}');
    expect(query).toContain('{filters}');
  });

  test('buildDayQuery starts the first page at the day start with every uuid', () => {
    const { values } = buildDayQuery({ day: '2026-10-01', pageSize: 10 });
    expect(values.after_ts).toBe('2026-10-01T00:00:00.000Z');
    expect(values.after_uuid).toBe('');
  });

  test('buildDayQuery adds the environment clause only with an environment', () => {
    expect(buildDayQuery({ day: '2026-10-01', pageSize: 10 }).query).not.toContain(
      'properties.environment ='
    );
    expect(buildDayQuery({ day: '2026-10-01', pageSize: 10, environment: 'prod' }).query).toContain(
      'properties.environment = {environment}'
    );
  });

  test('buildDayQuery leaves elements_chain out of a fully enriched day', () => {
    expect(
      buildDayQuery({ day: '2026-10-01', pageSize: 10, includeChain: false }).query
    ).not.toContain('elements_chain');
    expect(buildDayQuery({ day: '2026-10-01', pageSize: 10, includeChain: true }).query).toContain(
      'elements_chain'
    );
  });

  test('buildDayQuery reads the org and roles person properties the flags name', () => {
    const { query } = buildDayQuery({
      day: '2026-10-01',
      pageSize: 10,
      orgProperty: 'tenant_id',
      rolesProperty: 'app_roles',
    });
    expect(query).toContain('person.properties.tenant_id AS org_id');
    expect(query).toContain('person.properties.app_roles AS roles');
  });

  test.each(['org_id; DROP TABLE events', 'org id', '1org', "org'", ''])(
    'buildDayQuery refuses the property name %p',
    (name) => {
      expect(() => buildDayQuery({ day: '2026-10-01', pageSize: 10, orgProperty: name })).toThrow(
        '--org-property'
      );
      expect(() => buildDayQuery({ day: '2026-10-01', pageSize: 10, rolesProperty: name })).toThrow(
        '--roles-property'
      );
    }
  );

  test('buildChainCountQuery counts interactions without lowdefy_block_id', () => {
    const { query, values } = buildChainCountQuery({ day: '2026-10-01', environment: 'prod' });
    expect(query).toContain('isNull(properties.lowdefy_block_id)');
    expect(query).toContain('properties.environment = {environment}');
    expect(values.environment).toBe('prod');
  });
});
