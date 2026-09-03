# Plugins

Lowdefy plugins provides an interface to extend the platform functionality with custom javascript code. Plugins are installed into the Lowdefy app during the Lowdefy build process, and as a result are included as part of the Vite client build output. This enables plugin developers to use any npm packages when building Lowdefy plugins.

Lowdefy plugins can be used to create custom blocks, connections, requests, action, operators and auth providers, adapters, callbacks and events. These plugins are written as standard [npm modules](https://docs.npmjs.com/about-packages-and-modules#about-modules), so community plugins can be published to npm, and the workspace and git protocols can be used for project specific or private plugins. Since plugins are npm packages most Javascript features and third-party npm packages can be used in plugins.

## Using a plugin

To use a plugin in an app, the plugin name and version should be specified in the `plugins` section of the Lowdefy config. Once the plugin is included, the types (blocks, connections, etc) defined in the plugin can be used anywhere in the app.

If two plugins export types with the same type name, user defined plugins will override the default Lowdefy types, and user defined plugins will overwrite other plugins defined before them in the plugins array.

The `typePrefix` property can be used to prevent plugins with the same name overwriting each other. If specified, the type names of all plugins in that package will have the prefix appended. For example, if a package contains a block with type `Button` and the typePrefix is set to `Other`, that block can be used with type name `OtherButton`, and the default Lowdefy `Button` block will still be available.

###### Example

```yaml
plugins:
  # plugins installed remotely from npm
  - name: npm-plugin
    version: 1.0.0
    # local plugins in pnpm monorepo
  - name: local-plugin
    version: workspace:*
  # Add a prefix to type names
  - name: other-plugin
    version: 1.0.0
    typePrefix: Other
```

## Plugin meta

Every plugin type can describe itself to the build and to AI coding agents through a `meta` object. For blocks it is the `meta.js` next to the block (`category`, `valueType`, `initValue`, `cssKeys`, `events`, `properties`, ...), for requests it is the `meta` property on the request function (`checkRead`, `checkWrite`), and for operators a package may export a `./metas` module with one object per operator, mirroring `./schemas`.

All three accept `meta.hazards`: a list of behaviours of the type that its schema cannot express, which the dev server's docs and MCP endpoint return to agents alongside the schema (see [AI agent docs](/ai-agent-docs)). Each hazard is:

```yaml
hazards:
  - id: html-style-stripped # kebab-case, unique within the type
    message: Content is sanitised with DOMPurify, so <style>, <script> and inline event handlers are removed. Use DangerousHtml for a trusted <style> block.
    see: display-blocks/html # a docs slug, or null
```

The `message` is one or two plain sentences saying what happens and what to do instead. Only add a hazard for a behaviour that is verified in the plugin's code — an agent will rely on it.

### Block events and payloads

A block's `meta.events` maps each event name the block fires to a description, or to an object with a `description` and a `payload` - a JSON Schema for the object the block passes as `methods.triggerEvent({ name, event })`:

```js
events: {
  onBlur: 'Trigger action when the input loses focus.',
  onChange: {
    description: 'Trigger action when the input value changes.',
    payload: {
      type: 'object',
      additionalProperties: false,
      properties: { value: { type: 'string', description: 'The current input value.' } },
    },
  },
}
```

Declaring a `payload` is what lets the build check `_event` paths in an app's config against the block (see [Events and actions](/events-and-actions)), lets the docs gallery print the event's data shape, and lets an AI agent read it from `lowdefy_get_schema`. Use the string form for an event that carries no data - an event without a payload is never checked, so a wrong or missing declaration in a third-party block cannot break an app. The older `{ description, event: { key: 'description' } }` form is still accepted and is read as a payload whose properties have descriptions but no types. Event names are checked against `meta.events` too; a block that fires names authored in its own properties (a tab's `eventName`) sets `dynamicEvents: true`.

The build validates the shape of every block meta (`category`, `valueType`, `cssKeys`, `events`, ...) and reports each bad field as a build error. The meta shape, the props and methods a block receives, and how a member of the plugin API is deprecated and removed are described in [Plugin API Versioning](/plugin-api-versioning).
