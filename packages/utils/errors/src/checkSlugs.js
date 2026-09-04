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
 * The catalogue of build check slugs an app author may name in
 * `~ignoreBuildChecks`. Keys are the slugs, values are descriptions shown in
 * error messages and served to agents through the dev server docs endpoint.
 *
 * One slug per emitting rule: suppressing an unknown block type must not also
 * suppress an unknown connection type, and a `runAs` false positive must not
 * silently disable the tenant wall audits.
 *
 * These suppress BUILD-TIME validation only - runtime errors still occur.
 */
const VALID_CHECK_SLUGS = {
  // References that do not resolve
  'state-refs': 'Undefined _state reference warnings',
  'payload-refs': 'Undefined _payload reference warnings',
  'step-refs': 'Undefined _step reference warnings',
  'link-refs': 'Invalid Link action page reference warnings',
  'request-refs': 'Invalid Request action reference warnings',
  'connection-refs': 'Nonexistent connection ID references',
  'callapi-refs': 'Invalid CallAPI action endpoint reference warnings',
  'callapi-internal-refs': 'CallAPI actions targeting InternalApi endpoints',
  'dynamic-endpoint-refs': 'Invalid Dynamic block endpoint reference warnings',
  'websocket-refs': 'Invalid websocket action reference warnings',
  'event-payload': '_event paths checked against the block event payload schema',
  'request-state-empty': '_state reads in request properties, which are always empty',
  'ref-njk-runtime-operator':
    'Runtime operators written in a .njk template that renders to text at build',

  // Plugin type names that are used but not installed
  'block-types': 'Block type names that are used but not defined',
  'action-types': 'Action type names that are used but not defined',
  'operator-types': 'Operator names that are used but not defined',
  'request-types': 'Request type names that are used but not defined',
  'connection-types': 'Connection type names that are used but not defined',
  'step-types': 'Routine step type names that are used but not defined',
  'websocket-types': 'Websocket type names that are used but not defined',
  'agent-types': 'Agent type names that are used but not defined',
  'notification-types': 'Notification type names that are used but not defined',
  'auth-types': 'Auth adapter, provider and strategy names that are used but not defined',

  // Shape and schema declarations
  schema: 'Root lowdefy.yaml JSON schema validation warnings',
  'block-properties': 'Block properties schema validation',
  'state-schema': 'Page state contract violations (undeclared or mistyped state paths)',
  'payload-schema': 'Api endpoint payloadSchema is not a valid JSON schema',
  'response-schema': 'Endpoint responseSchema checks on _actions and _step response paths',
  component: 'Component definition and prop validation',

  // Blocks, events and assets
  events: 'Block event name validation',
  icons: 'Unresolvable icon name warnings',
  'duplicate-block-id': 'Two blocks on one page sharing a block id',
  archetype: 'Page archetype expansion: collection, field and prop resolution',

  // JavaScript
  'js-lint': 'Unresolved and unused names in _js bodies',
  'js-modules': '_js module reference resolution and export checks',

  // Tenant wall
  'tenant-run-as': 'Endpoint runAs organizationId source validation',
  'tenant-authored': 'Requests declaring tenant: authored without an authored tenant field',
  'tenant-unscoped': 'Requests declaring tenant: none without naming a tenant field',
  'tenant-caller-source': 'Unscoped requests taking their tenant value from the caller',
  'tenant-unstamped-write': 'Unscoped writes that do not stamp a tenant field',
  'tenant-inventory': 'The `lowdefy check` inventory of unscoped requests and steps',
  'tenant-lookup': 'Tenant pipeline lookups into shared collections',

  // Collections
  collections: 'The collections: declaration itself (names, fields, relations, indexes)',
  'collections-undeclared': 'Connections bound to a collection that collections: does not declare',
  'collections-dynamic': 'Connections whose collection name is an operator, not a literal',
  'collections-untenanted': 'Connections on a tenanted collection that carry no tenant wall',
  'collections-field-migration': 'Declared collection fields that no migration creates',

  // Migrations
  'migration-files': 'Migration file discovery, ids, YAML parsing and ledger checks',
  'migration-routine': 'Migration routine shape and step validation',

  // Branch merges
  'branch-merge':
    'Ids added on both branches, and migration order, reported by "lowdefy check --against".',

  // Layout
  'layout-deprecated':
    'Per-block layout: and area-level layout keys, deprecated in favour of the Row, Grid and Stack container blocks',

  // Secrets
  secrets: '_secret names that are not set in the environment',
  'plugin-api-version':
    'A plugin package declaring a plugin API version the framework does not provide.',
};

export default VALID_CHECK_SLUGS;
