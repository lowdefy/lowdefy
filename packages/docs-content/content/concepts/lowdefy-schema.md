# Lowdefy App Schema

A Lowdefy app is written as YAML or JSON files, which are combined together using the [`_ref`](/_ref) operator when the app is built into a configuration object that describes the app. This object has different sections that describe different parts of the Lowdefy app.

> A good understanding of YAML is needed before starting with Lowdefy. If you don't have any experience using YAML, you can find a good introduction video <a href = "https://www.youtube.com/watch?v=cdLNKUoMc6c">here</a>.

The root schema for a Lowdefy app is:
- `lowdefy: string`: __Required__ - The Lowdefy version number that the app uses. This is required and cannot be a reference to another file.
- `name: string`: A name for the application.
- `version: string`: The version number of the app that you are building. This is optional and allows you indicate the version of your app.
- `slug: string`: A kebab-case identifier for the app, available via the [`_app`](/_app) operator. Must match the pattern `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` (lowercase letters and digits, hyphen-separated, must start with a letter).
- `description: string`: A free-form description of the app.
- `license: string`: A [SPDX license ID](https://spdx.org/licenses/). You can use this to indicate the project's license if you are licensing your project under a specific software license. If you wish to indicate to others that you do not grant the right to use your project, you can use `UNLICENSED` for this field. How you share your Lowdefy config is up to you.
- `cli: object`: An object with configuration for the CLI.
- `config: object`: An object with app configuration like the home page pageId.
- `auth: object` An object with authentication and authorization configuration.
- `global: object`: A data object that can be accessed anywhere in the app using the [`_global`](/_global) operator.
- `connections: object[]`: An array of [`connection`](/connections-and-requests) objects.
- `plugins: object[]`: An array of `plugin` objects to customize and add block types.
- `modules: object[]`: An array of module entries. Each module references a reusable configuration package distributed via GitHub or local file paths. See [Modules](/modules) for details.
- `menus: object[]`: An array of menu objects.
- `pages: object[]`: An array of page objects.

All of the above fields (along with the framework version and the build git SHA) are also available at runtime via the [`_app`](/_app) operator.

Pages are made up of blocks. Blocks have the following basic schema:
- `id: string`: An identifier for a block.
- `type: string`: __Required__ - This is the block type identifier and defines which block will render.
- `properties: object`: The settings passed to a block component.
- `layout`: Control how the block will be rendered in the page flow, or in other words, how the block is placed in relation to other blocks. See [layout](/layout-overview) for more details.
- `blocks: array`: An array of blocks to render within this block.

Find the more detailed block schema [here](/blocks).

> <h3> YAML file extensions </h3>
<p> Both files with the <code>.yaml</code> and <code>.yml</code> file extensions are supported as YAML files. </p>
<h3> JSON instead of YAML </h3>
<p> Since you can reference JSON files, you can build your app using JSON instead of YAML files. The <code>lowdefy.yaml</code> file needs to be a YAML file, but all other configuration can be in referenced JSON files. It also makes sense to use JSON instead of YAML if you are generating configuration using code. </p>

## Config

The config object has the following properties:

- `basePath: string`: Set the base path to serve the Lowdefy application from. This will route all pages under `https://example.com/<base-path>/<page-id>` instead of the default `https://example.com/<page-id>`. The basePath value must start with "/".
- `homePageId: string`: The id of the page that will load when a visitor navigates to the home route, in other words, when the visitor navigates to `yourdomain.com` or `yourdomain.com/`.
- `requestTimeout: number`: Maximum time in milliseconds a request may run before the server returns a timeout. This protects against requests that hang on an upstream call (database, SMTP, an external API) running all the way to the host's function limit — important on serverless platforms that bill by execution duration. Defaults to `30000` (30 seconds). Set to `0` to disable. Agent streaming routes are exempt, since they are long-lived by design.

## Auth

The auth object is used to configure user authentication, and has the following properties:

- `adapter: object`: Configure a database adapter.
- `api: object`: Configure which APIs should be protected.
- `authPages: object`: Configure pages like the sign in page used by authentication flows.
- `callbacks: object[]`: Configure callback functions.
- `debug: boolean`: Can be set to false to disable auth debugging if the log level is set to debug.
- `events: object[]`: Configure event functions.
- `pages: object`: Configure which pages should be protected.
- `providers: object[]`: Configure authentication providers.
- `session: object`: Configure session.
- `theme: object`: Configure theme for default authentication pages.
- `userFields: object`: Map data from the provider to the user object.
- `advanced: object`: Set advanced authentication options.

See more about how user authentication and authorization [here](/users-introduction).

## Global

In a Lowdefy app, you can define global variables in the __global__ object, which can be accessed using the [`_global`](/_global) operator, and modified using the [`SetGlobal`](/SetGlobal) action. This is a good place to store data or configuration that is used over various pages throughout the app, for example, user preferences that can be modified using `SetGlobal` on one page and easily referenced on all others.

## Connections

In a Lowdefy app you can integrate with other services like API's or databases using `connections` and `requests`. Use connections to configure the settings to a service, for example, settings such as urls or [`secrets`](/secrets) like passwords or API keys. Requests use connections to interact with external services, for example, inserting a data record or executing a query on a database, or simply calling an API end-point.

See more about how `connections` and `requests` are used together [here](/connections-and-requests).

## Plugins

The plugins section is used to configure which plugin packages should be used in the app. It contains an array of plugin definitions, which have the following properties:

- `name: string`: The name of the package. If published to npm, this is the name under which the package is published on npm.
- `version: string`: An npm or pnpm version specifier of the package to use.
- `typePrefix: string`: A prefix to append to all types exported by the package to prevent type name clashes.

## Menus

Menu objects describe links to pages, within the app or external. Menu lists are filtered to only show pages that the user is authorized to see as a result of public, private or [role based access controlled (RBAC)](/roles) pages. Blocks such as [PageSiderMenu](/PageSiderMenu) render menu links. If no menu defined, a default menu is created, containing links to all pages defined in the app.

See more about how menu objects are used and defined [here](/menus).

## APIs

API objects define server-side endpoints that execute routines i.e. sequences of steps and control structures that run on the server with access to connections, secrets, and server-side operators.

Each API should have an `id` that is unique among all APIs in the app. Each API is called from the client using the [`CallAPI`](/CallAPI) action with the `endpointId` parameter matching the API's id.

APIs must have a `routine` that defines the execution logic. The routine executes sequentially by default and returns a response to the client through [`:return`](/:return) or [`:reject`](/:reject) control statements.

By default, APIs are public and can be accessed without authentication, just like pages. To require authentication or restrict access to specific roles, APIs must be configured in the `auth` section of your `lowdefy.yaml` file.

See the [APIs documentation](/lowdefy-api) for more information on how to use and define them.

## Pages

Pages in a Lowdefy app are actually just blocks, the building blocks of a Lowdefy app, with a few extra restrictions and features.

Each page should have an `id` that is unique among all pages in the app. Each page is served with the `pageId` as the url route. That is, if a page is created with id `page1`, it will be served at `domain.com/page1`. Module pages use the path `/{entryId}/{pageId}` — for example, a page `users-list` in a module entry `team-users` is served at `domain.com/team-users/users-list`.

If `properties.title` is set on a page block, the title will be set as the page title (This is the title displayed on the tabs in your browser).

Let's have a look at how to define a page and it's blocks. We can start with a simple page a card block on it. We can add a title to our card, by making use of the card block's title property. We can also add a paragraph block to our card so that it won't be so empty.

###### lowdefy.yaml
```yaml
lowdefy: LOWDEFY_VERSION

pages:
  - id: page1
    type: PageHeaderMenu
    properties:
      title: Page 1
    blocks:
      - id: content_card
        type: Card
        properties:
          title: Title
        blocks:
          - id: paragraph
            type: Paragraph
            properties:
              content: This is a paragraph on Page 1.
```

Let's add another card to our page and give it some blocks which will allow us to get input from the user.

###### lowdefy.yaml
```yaml
lowdefy: LOWDEFY_VERSION

pages:
  - id: page1
    type: PageHeaderMenu
    properties:
      title: Page 1
    blocks:
      - id: content_card
        type: Card
        properties:
          title: Title
        blocks:
          - id: paragraph
            type: Paragraph
            properties:
              content: This is a paragraph on Page 1.
      - id: input_card
        type: Card
        blocks:
          - id: text_input
            type: TextInput
            properties:
              label:
                title: Please Enter Your Name
          - id: radio_selector
            type: RadioSelector
            properties:
              label:
                title: How Are You Feeling?
                colon: false
              options:
                - label: Meh
                  value: 1
                  disabled: false
                - label: Okay
                  value: 2
                  disabled: false
                - label: Good
                  value: 3
                  disabled: false
                - label: Great
                  value: 4
                  disabled: false
                - label: Amazing Now That I'm Using Lowdefy
                  value: 5
                  disabled: false
```

In order to build our page further, we will need to add more blocks. Let's leave this page as is and add another page, with it's own card block containing a title block and a paragraph block.

###### lowdefy.yaml
```yaml
lowdefy: LOWDEFY_VERSION

pages:
  - id: page1
    type: PageHeaderMenu
    properties:
      title: Page 1
    blocks:
      - id: content_card
        type: Card
        properties:
          title: Title
        blocks:
          - id: paragraph
            type: Paragraph
            properties:
              content: This is a paragraph on Page 1.
      - id: input_card
        type: Card
        blocks:
          - id: text_input
            type: TextInput
            properties:
              label:
                title: Please Enter Your Name
          - id: radio_selector
            type: RadioSelector
            properties:
              label:
                title: How Are You Feeling?
                colon: false
              options:
                - label: Meh
                  value: 1
                  disabled: false
                - label: Okay
                  value: 2
                  disabled: false
                - label: Good
                  value: 3
                  disabled: false
                - label: Great
                  value: 4
                  disabled: false
                - label: Amazing Now That I'm Using Lowdefy
                  value: 5
                  disabled: false
  - id: page2
    type: PageHeaderMenu
    properties:
      title: Page 2
    blocks:
      - id: content_card
        type: Card
        properties:
          title: Title
        blocks:
          - id: paragraph
            type: Paragraph
            properties:
              content: This is a paragraph on Page 2.
```

In order to keep files neat and generally easier to read and understand, we suggest making use of references and templating.

## References and templates

References and templates have the following use cases:

- Splitting out the config for readability and code navigation.
- Splitting out a piece of config in order to use the exact same config in multiple places.
- Using a reference with variables to make use of a shared piece of config with dynamic variables.
- Using a `.njk` file to create config files using the Nunjucks templating language.
- Using resolver and transformer functions to create Lowdefy config using Javascript functions.

References can be used anywhere in the configuration, as long as the configuration resolves to comply with the Lowdefy app schema. Templating can be taken further by referencing [Nunjucks](https://mozilla.github.io/nunjucks/) template files by simply adding .njk to the file extensions, for example, .yaml.njk. Nunjucks templates hydrate variables at build time, before the yaml is parsed, enabling Nunjucks features like for-loops and if-statements.

See more about references and templates [here](/references-and-templates).

## Suppressing Build Validation with ~ignoreBuildChecks

The `~ignoreBuildChecks` property suppresses build-time validation errors and warnings. Suppression cascades down to all descendant config objects.

### Syntax

```yaml
# Suppress the named checks for this object and its descendants
~ignoreBuildChecks:
  - state-refs
  - block-types
```

The value is always an array of slugs. There is no "suppress everything"
form: a check you have not named stays on.

### Available Check Slugs

<!-- check-slugs:start -->
| Slug | What it suppresses |
|------|-------------------|
| `state-refs` | Undefined _state reference warnings |
| `payload-refs` | Undefined _payload reference warnings |
| `step-refs` | Undefined _step reference warnings |
| `link-refs` | Invalid Link action page reference warnings |
| `request-refs` | Invalid Request action reference warnings |
| `connection-refs` | Nonexistent connection ID references |
| `callapi-refs` | Invalid CallAPI action endpoint reference warnings |
| `callapi-internal-refs` | CallAPI actions targeting InternalApi endpoints |
| `dynamic-endpoint-refs` | Invalid Dynamic block endpoint reference warnings |
| `websocket-refs` | Invalid websocket action reference warnings |
| `event-payload` | _event paths checked against the block event payload schema |
| `request-state-empty` | _state reads in request properties, which are always empty |
| `ref-njk-runtime-operator` | Runtime operators written in a .njk template that renders to text at build |
| `block-types` | Block type names that are used but not defined |
| `action-types` | Action type names that are used but not defined |
| `operator-types` | Operator names that are used but not defined |
| `request-types` | Request type names that are used but not defined |
| `connection-types` | Connection type names that are used but not defined |
| `step-types` | Routine step type names that are used but not defined |
| `websocket-types` | Websocket type names that are used but not defined |
| `agent-types` | Agent type names that are used but not defined |
| `notification-types` | Notification type names that are used but not defined |
| `auth-types` | Auth adapter, provider and strategy names that are used but not defined |
| `schema` | Root lowdefy.yaml JSON schema validation warnings |
| `block-properties` | Block properties schema validation |
| `state-schema` | Page state contract violations (undeclared or mistyped state paths) |
| `payload-schema` | Api endpoint payloadSchema is not a valid JSON schema |
| `response-schema` | Endpoint responseSchema checks on _actions and _step response paths |
| `actions-response-envelope` | The deprecated _actions.<id>.response.response.<path> spelling of a CallAPI result |
| `component` | Component definition and prop validation |
| `events` | Block event name validation |
| `icons` | Unresolvable icon name warnings |
| `duplicate-block-id` | Two blocks on one page sharing a block id |
| `archetype` | Page archetype expansion: collection, field and prop resolution |
| `js-lint` | Unresolved and unused names in _js bodies and file plugins, and plugin file syntax errors |
| `js-modules` | _js module reference resolution and export checks |
| `tenant-grammar` | The deprecated { field } object form of connection "tenant" |
| `tenant-none-deprecated` | Endpoint and request "tenant: none" declarations, deprecated in favour of runAs |
| `tenant-run-as` | Endpoint runAs organizationId source validation |
| `tenant-authored` | Requests declaring tenant: authored without an authored tenant field |
| `tenant-unscoped` | Requests declaring tenant: none without naming a tenant field |
| `tenant-caller-source` | Unscoped requests taking their tenant value from the caller |
| `tenant-unstamped-write` | Unscoped writes that do not stamp a tenant field |
| `tenant-inventory` | The `lowdefy check` inventory of unscoped requests and steps |
| `tenant-lookup` | Tenant pipeline lookups into shared collections |
| `collections` | The collections: declaration itself (names, fields, relations, indexes) |
| `collections-undeclared` | Connections bound to a collection that collections: does not declare |
| `collections-dynamic` | Connections whose collection name is an operator, not a literal |
| `collections-untenanted` | Connections on a tenanted collection that carry no tenant wall |
| `collections-field-migration` | Declared collection fields that no migration creates |
| `collections-index` | Query key sets in the app that no declared collections.indexes entry covers |
| `migration-files` | Migration file discovery, ids, YAML parsing and ledger checks |
| `migration-routine` | Migration routine shape and step validation |
| `branch-merge` | Ids added on both branches, and migration order, reported by "lowdefy check --against". |
| `layout-deprecated` | Per-block layout: and area-level layout keys, deprecated in favour of the Row, Grid and Stack container blocks |
| `secrets` | _secret names that are not set in the environment |
| `auth-dev-mock-user` | The deprecated auth.dev.mockUser key, superseded by auth.dev.users + auth.dev.browserUser |
| `plugin-api-version` | A plugin package declaring a plugin API version the framework does not provide. |
<!-- check-slugs:end -->

### Example: Dynamic State

Custom blocks can register state at runtime using `methods.registerEvent`. Since this state doesn't exist during build, you can suppress the validation warning:

###### pages/custom-feature.yaml
```yaml
blocks:
  - id: custom_block
    type: CustomBlock
    properties:
      onClick:
        _state: dynamicState  # Created by block at runtime
        ~ignoreBuildChecks:
          - state-refs
```

Without `~ignoreBuildChecks`, the build would warn:
```
[Config Warning] _state references "dynamicState" but no block with id "dynamicState" exists
```

### Example: Page-Level Suppression

Suppression cascades to all children, so you can set it on a page to affect all blocks:

```yaml
pages:
  - id: dynamic-page
    type: Box
    ~ignoreBuildChecks:
      - state-refs  # Only suppress state reference warnings
    blocks:
      - id: block1
        type: TextInput
        properties:
          value:
            _state: dynamicField  # No warning (inherited from page)
```

### Example: Custom Plugin Types

When using custom plugin types that aren't registered, you can suppress type validation:

```yaml
blocks:
  - id: custom_block
    type: MyCustomBlock  # Custom type not in registry
    ~ignoreBuildChecks:
      - block-types
    properties:
      title: Hello
```

> **Note:** `~ignoreBuildChecks` only affects build-time validation. Runtime errors still occur if references don't exist. Only use this for references you know will be valid at runtime.

## Lowdefy versions and version updates

Lowdefy is versioned using semantic versioning, with a three part version number, with the form `major.minor.patch`. Lowdefy is under active development and is widely used in enterprise projects. New features and fixes are published on a regular basis, see our [changelog](https://github.com/lowdefy/lowdefy/blob/main/CHANGELOG.md) for the latest release notes.

[TODO]: <> (# TODO: Add roadmap, for whats to expect next.)

To update the version of your app, change the `lowdefy` version field in the `lowdefy.yaml` file, and redeploy the app. You might also need to make some changes to your app configuration to be compatible with the new version.

Patch updates only contain fixes, and you should be safe to update to a patched version without any changes to your app. Since we are actively developing new features, most releases will be minor version updates, and patches won't be made to older versions.

Minor version changes include new features. At this stage, since the project is still in early development, they might also have minor breaking changes to individual blocks, actions, operators or connections. Please check the [changelog](https://github.com/lowdefy/lowdefy/blob/main/CHANGELOG.md) to see if any configuration changes are needed before updating.

Major version updates may include major breaking changes or architecture changes. You might need to make more changes to your configuration to be compatible with the new version. We don't intend to release major versions regularly, and try to minimize breaking changes.
