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

// The framework-owned skill set. One entry per topic, keyed by skill name.
//
// - kind: 'recipe' when the Recipe is a workaround an agent has to carry for something the
//   framework should do natively, 'reference' when it explains a shipped feature. The number of
//   recipe skills is the KPI pnpm skills:metrics reports; it must fall as the framework grows.
// - description: the frontmatter description, must start with "Use when".
// - title: the "# <Title>" heading written when a skill file is first created.
// - docSlugs: entries of @lowdefy/docs-content index.json indexed in the Reference section.
// - types: plugin types indexed in the Reference section. Every name must
//   be provided by exactly one plugin package under packages/plugins; a request type provided by
//   several packages is written as "Type@@lowdefy/connection-name".
// - recipe: the one-line statement of what the hand-written Recipe must cover. It seeds the
//   Recipe section when the file is first created and is never written again.
//
// scripts/generateSkills.mjs reads this file. Content outside the generated markers in each
// SKILL.md is hand-written and preserved on regeneration.

export default {
  'lowdefy-aggregations': {
    kind: 'reference',
    description:
      'Use when a page or endpoint needs grouped, counted, joined or reshaped data from MongoDB — an aggregation pipeline behind a request, its payload filters, and the shape the page reads back.',
    title: 'Aggregation requests',
    docSlugs: ['concepts/connections-and-requests', 'connections/mongodb', 'operators/_request'],
    types: {
      connections: ['MongoDBCollection'],
      requests: ['MongoDBAggregation'],
      operators: ['_request', '_payload'],
    },
    recipe:
      'Must cover: when to aggregate instead of find, driving `$match` from `payload`, `$lookup` for joins, `$facet` for rows-plus-count, projecting only what the page reads, and where an aggregation belongs (request vs. Api endpoint).',
  },
  'lowdefy-aggrid-tables': {
    kind: 'reference',
    description:
      'Use when building a data table with AgGrid — column definitions, cell renderers, row click to a detail page, selection, and editable grids that write back to state.',
    title: 'AgGrid tables',
    docSlugs: ['display-blocks/aggrid'],
    types: {
      blocks: ['AgGridLowdefy', 'AgGridLowdefyInput'],
    },
    recipe:
      'Must cover: `rowData` from a request, `columnDefs` with `valueFormatter` and `cellRenderer`, `onRowClick` to a detail page, the Lowdefy theme, `AgGridLowdefyInput` for editable rows, and pagination/quick filter.',
  },
  'lowdefy-api-routines': {
    kind: 'reference',
    description:
      'Use when writing server-side logic as an Api endpoint routine — control flow steps, requests inside a routine, payload schemas, calling it from the page with CallAPI, and exposing it as an MCP tool.',
    title: 'Api endpoint routines',
    docSlugs: [
      'concepts/lowdefy-api',
      'controls/if',
      'controls/for',
      'controls/try',
      'controls/return',
      'controls/reject',
      'controls/set_state',
      'actions/callapi',
      'operators/_api',
      'operators/_step',
    ],
    types: {
      actions: ['CallAPI'],
      operators: ['_api', '_step', '_payload'],
    },
    recipe:
      'Must cover: endpoint shape (`id`, `type: Api`, `routine`), a request step reading `_payload`, `_step` to chain results, `:return` vs `:reject`, `payloadSchema` (enforced on every caller), calling with `CallAPI` and reading `_api`, and the `mcp.endpoints` exposure rules.',
  },
  'lowdefy-block-plugins': {
    kind: 'reference',
    description:
      'Use when the built-in blocks are not enough and a custom React block plugin is needed — the package layout, meta.js schema, how the dev server picks up local plugins, and when a plugin is the wrong answer.',
    title: 'Custom block plugins',
    docSlugs: ['plugins/plugins-introduction', 'plugins/plugins-dev'],
    types: {},
    recipe:
      'Must cover: the block function signature (`blockId`, `properties`, `methods`, `events`), `meta.js` with `properties` schema and `events`, `types.js` exports, registering a local plugin in `lowdefy.yaml`, and when `Html`/`_js` already suffice.',
  },
  'lowdefy-change-stamps': {
    kind: 'recipe',
    description:
      'Use when records need created/updated audit fields — who changed what and when — written consistently from a page action or an Api routine.',
    title: 'Change stamps',
    docSlugs: ['operators/_date', 'operators/_user', 'operators/_dayjs'],
    types: {
      requests: ['MongoDBInsertOne', 'MongoDBUpdateOne'],
      operators: ['_date', '_user'],
    },
    recipe:
      'Must cover: the `created`/`updated` `{ at, by }` shape, setting `created` only with `$setOnInsert`, stamping server-side in the request (never trusting client dates), which `_user` fields to store, and MongoDB `_date: now` versus the driver `Date`.',
  },
  'lowdefy-charts': {
    kind: 'reference',
    description:
      'Use when rendering a chart from request data with EChart — mapping rows to series, axes, tooltips, responsive sizing and empty/loading states.',
    title: 'Charts',
    docSlugs: ['display-blocks/echart'],
    types: {
      blocks: ['EChart'],
      operators: ['_array', '_get'],
    },
    recipe:
      'Must cover: `option` built from `_request` data, mapping rows to `xAxis.data` and `series[].data` with `_array.map`, `height`, `onClick` events with the clicked datum, and an empty state when the request returns no rows.',
  },
  'lowdefy-contact-fields': {
    kind: 'recipe',
    description:
      'Use when a form captures a person or organisation contact — names, email, phone, address — with consistent block choices, validation and stored shape.',
    title: 'Contact fields',
    docSlugs: ['input-blocks/phonenumberinput', 'input-blocks/textinput', 'operators/_regex'],
    types: {
      blocks: ['PhoneNumberInput', 'TextInput'],
      operators: ['_regex'],
    },
    recipe:
      'Must cover: the stored contact shape (`name`, `email`, `phone`, `address`), `PhoneNumberInput` for phone, email `validate` with `_regex`, lowercase/trim on save, and a shared `_ref` template for the field group.',
  },
  'lowdefy-data-schema': {
    kind: 'recipe',
    description:
      'Use when designing the document shape for a collection — ids, embedded vs. referenced data, enums, stamps, versioning — before writing pages against it.',
    title: 'Data schema',
    docSlugs: ['connections/mongodb', 'operators/_type'],
    types: {
      requests: ['MongoDBInsertOne', 'MongoDBVersionedUpdateOne'],
      operators: ['_type'],
    },
    recipe:
      'Must cover: `_id` conventions, embedding vs. referencing, naming, required fields enforced in requests, `MongoDBVersionedUpdateOne` for history, and writing a `schema.yaml` beside the collection that pages and endpoints reference.',
  },
  'lowdefy-detail-pages': {
    kind: 'recipe',
    description:
      'Use when building a page that shows one record — reading the id from urlQuery, fetching it, a not-found state, a loading skeleton and links to edit.',
    title: 'Detail pages',
    docSlugs: [
      'operators/_url_query',
      'operators/_request',
      'actions/link',
      'container-blocks/descriptions',
    ],
    types: {
      blocks: ['Descriptions', 'Card', 'Result'],
      requests: ['MongoDBFindOne'],
      operators: ['_url_query', '_request'],
      actions: ['Link'],
    },
    recipe:
      'Must cover: `_url_query: id` into `payload`, `onInitAsync` request, `Descriptions` items from `_request`, a `Result` not-found state when the request returns `null`, skeleton while loading, and an edit `Link` carrying `urlQuery`.',
  },
  'lowdefy-edit-pages': {
    kind: 'recipe',
    description:
      'Use when building a create/edit form page — loading the record into state, validating, saving with a request, and navigating back with feedback.',
    title: 'Edit pages',
    docSlugs: ['actions/request', 'actions/validate', 'actions/setstate', 'actions/reset'],
    types: {
      blocks: ['Button', 'Card'],
      requests: ['MongoDBFindOne', 'MongoDBUpdateOne'],
      actions: ['Request', 'Validate', 'SetState', 'Reset', 'Link'],
    },
    recipe:
      'Must cover: load with `onInitAsync` then `SetState` from `_request`, block ids equal to field paths, `Validate` before the save `Request`, `$set` from `_state`, a `DisplayMessage` on success, `Link` back with `urlQuery`, and the create vs. edit switch on `_url_query`.',
  },
  'lowdefy-enums': {
    kind: 'recipe',
    description:
      'Use when a field takes one of a fixed set of values — defining the enum once, rendering selectors from it, and mapping values to labels and colours.',
    title: 'Enums',
    docSlugs: [
      'input-blocks/selector',
      'input-blocks/radioselector',
      'operators/_switch',
      'operators/_get',
    ],
    types: {
      blocks: ['Selector', 'RadioSelector', 'Tag'],
      operators: ['_switch', '_get'],
    },
    recipe:
      'Must cover: one `enums/<name>.yaml` file loaded with `_ref`, `options` with `{ value, label }`, `_get` on a lookup object for labels, `_switch` for colours, and validating a saved value is in the enum.',
  },
  'lowdefy-events': {
    kind: 'reference',
    description:
      'Use when wiring user interaction to behaviour — which event names a block fires, ordering actions, reading the event payload, async actions and error handling in an action chain.',
    title: 'Events and actions',
    docSlugs: [
      'concepts/events-and-actions',
      'operators/_event',
      'operators/_actions',
      'actions/setstate',
    ],
    types: {
      operators: ['_event', '_actions'],
      actions: ['SetState', 'Request', 'Link', 'DisplayMessage'],
    },
    recipe:
      'Must cover: event names are validated at build (an unknown event is an error), `onInit`/`onInitAsync`/`onMount` order, `_event` payload per event, `_actions` to read a previous action result, `try`/`catch` chains, `skip`, and `messages` on actions.',
  },
  'lowdefy-file-structure': {
    kind: 'reference',
    description:
      'Use when laying out a Lowdefy project — where pages, requests, connections, templates, enums and modules live, and how `_ref` and `_var` stitch them together.',
    title: 'Project file structure',
    docSlugs: [
      'concepts/lowdefy-schema',
      'concepts/references-and-templates',
      'operators/_ref',
      'operators/_var',
    ],
    types: {},
    recipe:
      'Must cover: `lowdefy.yaml` as the root, one file per page under `pages/`, `requests/`, `connections/`, `templates/` with `_var` (an unsupplied var is a build error), `enums/`, `menus.yaml`, and naming conventions for ids.',
  },
  'lowdefy-filters': {
    kind: 'recipe',
    description:
      'Use when adding filter controls to a list or table — filter state, building a query from it, clearing filters, and keeping filters in the url.',
    title: 'Filters',
    docSlugs: [
      'operators/_state',
      'operators/_mql',
      'input-blocks/selector',
      'input-blocks/daterangeselector',
    ],
    types: {
      blocks: ['Selector', 'TextInput', 'DateRangeSelector'],
      operators: ['_state', '_if_none', '_mql'],
      requests: ['MongoDBFind'],
    },
    recipe:
      'Must cover: a `filters` object in state, `payload` built from `_state: filters`, dropping empty filters from the query, `_regex` search fields, date ranges to `$gte`/`$lte`, a clear button with `SetState`, and syncing filters to `urlQuery`.',
  },
  'lowdefy-form-validation': {
    kind: 'reference',
    description:
      'Use when a form must refuse bad input — required fields, validate rules, the Validate action, per-step validation, and what counts as empty.',
    title: 'Form validation',
    docSlugs: [
      'actions/validate',
      'actions/resetvalidation',
      'actions/reset',
      'operators/_type',
      'operators/_regex',
      'operators/_not',
    ],
    types: {
      blocks: ['TextInput', 'Selector'],
      actions: ['Validate', 'ResetValidation', 'Reset'],
      operators: ['_type', '_regex', '_not', '_and'],
    },
    recipe:
      'Must cover: `required`, `validate` rules, the `Validate` action, per-step validation, and the empty-value semantics.',
  },
  'lowdefy-js-operator': {
    kind: 'reference',
    description:
      'Use when an operator expression gets too deep and a `_js` body is the clearer choice — the client and server prototypes, string vs. `{ fn, args }` form, build-time linting, and when to use an operator instead.',
    title: 'The _js operator',
    docSlugs: ['operators/_js', 'plugins/plugins-operators'],
    types: {
      operators: ['_js'],
    },
    recipe:
      'Must cover: the `_js` forms and prototypes, where each runs, hashing into generated modules, linting, and when to reach for an operator instead.',
  },
  'lowdefy-layout': {
    kind: 'reference',
    description:
      'Use when arranging blocks on a page — the grid layout system, `layout.size` and `span`, `Box` and `Flex` containers, alignment, gutters and responsive breakpoints.',
    title: 'Layout',
    docSlugs: ['concepts/layout-overview', 'container-blocks/box', 'container-blocks/flex'],
    types: {
      blocks: ['Box', 'Flex', 'Card'],
    },
    recipe:
      'Must cover: `layout.span` (24-column grid) and `layout.size`, `blocks` vs. `areas`, `Flex` for one-dimensional rows, `Box` as the neutral container, `contentGutter`, responsive `span` objects, and avoiding nested grids for simple rows.',
  },
  'lowdefy-list-pages': {
    kind: 'recipe',
    description:
      'Use when building a page that lists records from a request — filters bound to state, a row link with urlQuery, an empty state and a loading skeleton.',
    title: 'List pages',
    docSlugs: [
      'concepts/lists',
      'concepts/connections-and-requests',
      'list-blocks/list',
      'actions/link',
      'operators/_request',
      'operators/_url_query',
      'display-blocks/skeleton',
    ],
    types: {
      blocks: ['List', 'Card', 'Result', 'Skeleton'],
      requests: ['MongoDBFind'],
      actions: ['Request', 'Link'],
      operators: ['_request', '_state', '_url_query', '_if'],
    },
    recipe:
      'Must cover: a request, a list block, filters bound to `_state`, a row link with `urlQuery`, an empty state and a loading skeleton.',
  },
  'lowdefy-lists': {
    kind: 'reference',
    description:
      'Use when repeating blocks over an array in state — `List` and `ControlledList`, `$` index placeholders in block ids, `_index`, and adding/removing items.',
    title: 'List blocks',
    docSlugs: [
      'concepts/lists',
      'list-blocks/list',
      'list-blocks/controlledlist',
      'operators/_index',
    ],
    types: {
      blocks: ['List', 'ControlledList'],
      operators: ['_index'],
    },
    recipe:
      'Must cover: the list value in state, `$` placeholders in child ids, `_index` in child operators, `ControlledList` add/remove, `pushItem`/`removeItem` methods with `CallMethod`, and why hidden list items keep their values.',
  },
  'lowdefy-loading-skeletons': {
    kind: 'reference',
    description:
      'Use when a page fetches data on load — showing skeletons while requests run, `loading` and `skeleton` on blocks, and avoiding layout jumps.',
    title: 'Loading skeletons',
    docSlugs: [
      'display-blocks/skeleton',
      'display-blocks/skeletoninput',
      'display-blocks/skeletonparagraph',
      'display-blocks/skeletonbutton',
    ],
    types: {
      blocks: ['Skeleton', 'SkeletonInput', 'SkeletonParagraph', 'SkeletonButton', 'Spinner'],
    },
    recipe:
      'Must cover: `onInitAsync` renders skeletons until it settles, the per-block `skeleton` property (a skeleton block spec), `loading` on containers, matching skeleton size to the block it stands in for, and one skeleton per visual block rather than a page spinner.',
  },
  'lowdefy-modules': {
    kind: 'reference',
    description:
      'Use when installing or authoring a Lowdefy module — reusable pages, requests and connections packaged as a module, its `_module` operator and var contract.',
    title: 'Modules',
    docSlugs: ['concepts/modules', 'concepts/module-authoring', 'operators/_module'],
    types: {},
    recipe:
      'Must cover: `modules:` in `lowdefy.yaml`, module vars, `_module` to read them, module pages vs. app pages, overriding a module page, and authoring a module package.',
  },
  'lowdefy-notifications': {
    kind: 'reference',
    description:
      'Use when giving the user feedback after an action — `DisplayMessage`, `Notification`, `Message` blocks, action `messages`, and when a `Result` block is the better choice.',
    title: 'User notifications',
    docSlugs: ['display-blocks/message', 'display-blocks/notification', 'actions/displaymessage'],
    types: {
      blocks: ['Message', 'Notification', 'Result'],
      actions: ['DisplayMessage'],
    },
    recipe:
      'Must cover: `DisplayMessage` after a successful `Request`, action `messages: { loading, success, error }`, `Notification` via `CallMethod` for persistent alerts, `Result` for terminal states, and never notifying on `onInit`.',
  },
  'lowdefy-operators': {
    kind: 'reference',
    description:
      'Use when writing operator expressions — the core operators, argument shapes, nesting, where operators are evaluated, and the mistakes the build now catches.',
    title: 'Operators',
    docSlugs: [
      'concepts/operators',
      'operators/_if',
      'operators/_get',
      'operators/_state',
      'operators/_eq',
      'operators/_and',
      'operators/_or',
      'operators/_not',
      'operators/_switch',
      'operators/_array',
      'operators/_object',
      'operators/_string',
    ],
    types: {
      operators: [
        '_if',
        '_get',
        '_state',
        '_eq',
        '_and',
        '_or',
        '_not',
        '_switch',
        '_array',
        '_object',
        '_string',
      ],
    },
    recipe:
      'Must cover: operators are evaluated where they sit (page vs. request vs. routine), an unknown operator is a build error, `_get` vs. `_state` dot paths, `_if` shapes, method-style operators (`_array.map`), and `lowdefy_eval_operator` to test an expression.',
  },
  'lowdefy-page-layouts': {
    kind: 'reference',
    description:
      'Use when choosing the page frame — `PageSidebarLayout`, `PageHeaderMenu`, `PageSiderMenu`, menus, headers, breadcrumbs, and sharing one layout across pages.',
    title: 'Page layouts',
    docSlugs: [
      'container-blocks/pagesidebarlayout',
      'container-blocks/pageheadermenu',
      'container-blocks/pagesidermenu',
      'concepts/menus',
    ],
    types: {
      blocks: ['PageSidebarLayout', 'PageHeaderMenu', 'PageSiderMenu'],
    },
    recipe:
      'Must cover: one layout block as the page root, `menus.yaml` and `menuId`, `header`/`sider` areas, the `content` area for the page body, breadcrumbs, and a `_ref` template so every page shares the frame.',
  },
  'lowdefy-pagination': {
    kind: 'recipe',
    description:
      'Use when a list is too long for one request — page and size in state, `skip`/`limit` in the query, a total count, and the `Pagination` block.',
    title: 'Pagination',
    docSlugs: ['input-blocks/pagination', 'operators/_request'],
    types: {
      blocks: ['Pagination'],
      requests: ['MongoDBFind', 'MongoDBAggregation'],
      operators: ['_request', '_state', '_product'],
    },
    recipe:
      'Must cover: `page`/`pageSize` in state, `skip: (page - 1) * pageSize` via `_product`, `$facet` for rows and total in one request, `Pagination` `onChange` re-running the request, and resetting to page 1 when filters change.',
  },
  'lowdefy-status-enums': {
    kind: 'recipe',
    description:
      'Use when a record moves through statuses — the status enum, allowed transitions, tag colours, filtering by status and guarding writes.',
    title: 'Status enums',
    docSlugs: ['display-blocks/tag', 'input-blocks/selector', 'operators/_switch'],
    types: {
      blocks: ['Tag', 'Selector', 'Steps'],
      operators: ['_switch'],
    },
    recipe:
      'Must cover: `enums/status.yaml` with `value`, `label`, `color`, `next`, `Tag` colour by `_switch`, a transition button per allowed `next`, guarding the transition in the request `$match`, and `Steps` for progress.',
  },
  'lowdefy-status-fields': {
    kind: 'recipe',
    description:
      'Use when showing a boolean or status value at a glance — tags, badges, switches, statistics, and consistent colour mapping.',
    title: 'Status fields',
    docSlugs: ['display-blocks/tag', 'display-blocks/statistic', 'input-blocks/switch'],
    types: {
      blocks: ['Tag', 'Badge', 'Statistic', 'Switch'],
      operators: ['_if', '_switch'],
    },
    recipe:
      'Must cover: `Tag` for enum values, `Badge` for counts, `Switch` for booleans (read-only with `disabled`), `Statistic` for numbers, and a shared colour mapping loaded with `_ref`.',
  },
  'lowdefy-styling': {
    kind: 'reference',
    description:
      'Use when changing how blocks look — `style`, `class`, theme tokens, custom CSS, `Html` vs. `DangerousHtml`, and responsive `_media` queries.',
    title: 'Styling',
    docSlugs: [
      'concepts/custom-styling',
      'concepts/custom-html',
      'display-blocks/html',
      'operators/_theme',
    ],
    types: {
      blocks: ['Html', 'DangerousHtml'],
      operators: ['_media'],
    },
    recipe:
      'Must cover: `style` for one-offs, `class` with app CSS in `lowdefy.yaml`, `theme` tokens and `_theme`, `Html` strips `<style>` (use `DangerousHtml`), `_media` for breakpoints, and `cssKeys` for block sub-elements.',
  },
};
