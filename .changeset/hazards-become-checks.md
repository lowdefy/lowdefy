---
'@lowdefy/build': minor
'@lowdefy/errors': minor
'@lowdefy/engine': minor
'@lowdefy/actions-core': minor
'@lowdefy/docs-content': patch
'@lowdefy/operators-js': patch
'@lowdefy/docs': patch
---

feat: three documented hazards become checks or features

The build rejects a runtime operator (`_state`, `_user`, `_payload`, …) written in a `.njk` template that renders to text, where it could never run, under the `ref-njk-runtime-operator` check slug; a `.yaml.njk`, `.yml.njk` or `.json.njk` file is parsed into config after rendering and keeps its operators as before. The `_js` lint names the environment a parameter belongs to, so a body written for the client prototype and used at a server position reports `"payload" is a server _js parameter, and this body runs on the client` instead of a bare "not defined". The `Link` action takes `reload: true`: a link to the page already open re-runs that page's `onMount` and `onMountAsync` events, which previously never fired again because the page is not remounted. It is opt-in, so menu links and same-page `urlQuery` links stay no-ops.
