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

import resolveModuleDependencies from './resolveModuleDependencies.js';

function makeModule({ dependencies = [], moduleDependencies = {} } = {}) {
  return { dependencies, moduleDependencies };
}

test('auto-wires dependency when matching module entry exists', () => {
  const context = {
    modules: {
      companies: makeModule({ dependencies: [{ id: 'contacts' }] }),
      contacts: makeModule(),
    },
  };
  resolveModuleDependencies({ context });
  expect(context.modules.companies.moduleDependencies).toEqual({ contacts: 'contacts' });
});

test('explicit wiring takes precedence over auto-wire', () => {
  const context = {
    modules: {
      companies: makeModule({
        dependencies: [{ id: 'contacts' }],
        moduleDependencies: { contacts: 'my-contacts' },
      }),
      contacts: makeModule(),
      'my-contacts': makeModule(),
    },
  };
  resolveModuleDependencies({ context });
  expect(context.modules.companies.moduleDependencies).toEqual({ contacts: 'my-contacts' });
});

test('throws ConfigError when no matching entry and no explicit mapping', () => {
  const context = {
    modules: {
      companies: makeModule({ dependencies: [{ id: 'contacts' }] }),
    },
  };
  expect(() => resolveModuleDependencies({ context })).toThrow(
    'Module "companies" declares dependency "contacts" but no mapping provided ' +
      'and no module entry "contacts" exists.'
  );
});

test('error includes remediation suggestion for unmapped dependency', () => {
  const context = {
    modules: {
      companies: makeModule({ dependencies: [{ id: 'contacts' }] }),
    },
  };
  expect(() => resolveModuleDependencies({ context })).toThrow(
    'Add dependencies.contacts to the "companies" entry in lowdefy.yaml'
  );
});

test('error includes dependency description when available', () => {
  const context = {
    modules: {
      companies: makeModule({
        dependencies: [{ id: 'contacts', description: 'Contact management module' }],
      }),
    },
  };
  expect(() => resolveModuleDependencies({ context })).toThrow(
    'contacts: Contact management module'
  );
});

test('throws ConfigError for unknown key in wiring map', () => {
  const context = {
    modules: {
      companies: makeModule({
        dependencies: [{ id: 'contacts' }],
        moduleDependencies: { contacts: 'contacts', foo: 'bar' },
      }),
      contacts: makeModule(),
    },
  };
  expect(() => resolveModuleDependencies({ context })).toThrow(
    'Module "companies" does not declare dependency "foo"'
  );
});

test('unknown key error lists declared dependencies', () => {
  const context = {
    modules: {
      companies: makeModule({
        dependencies: [{ id: 'contacts' }],
        moduleDependencies: { contacts: 'contacts', foo: 'bar' },
      }),
      contacts: makeModule(),
    },
  };
  expect(() => resolveModuleDependencies({ context })).toThrow('Declared dependencies: contacts');
});

test('throws ConfigError when target entry does not exist', () => {
  const context = {
    modules: {
      companies: makeModule({
        dependencies: [{ id: 'contacts' }],
        moduleDependencies: { contacts: 'nonexistent' },
      }),
    },
  };
  expect(() => resolveModuleDependencies({ context })).toThrow(
    'dependencies.contacts references "nonexistent" but no module entry "nonexistent" exists.'
  );
});

test('throws ConfigError for self-referencing dependency', () => {
  const context = {
    modules: {
      companies: makeModule({
        dependencies: [{ id: 'self' }],
        moduleDependencies: { self: 'companies' },
      }),
    },
  };
  expect(() => resolveModuleDependencies({ context })).toThrow(
    'Module "companies" dependency "self" maps to itself. A module cannot depend on its own entry.'
  );
});

test('module with no dependencies passes validation', () => {
  const context = {
    modules: {
      companies: makeModule(),
    },
  };
  expect(() => resolveModuleDependencies({ context })).not.toThrow();
});

test('module with all dependencies correctly wired passes validation', () => {
  const context = {
    modules: {
      companies: makeModule({
        dependencies: [{ id: 'contacts' }, { id: 'invoices' }],
        moduleDependencies: { contacts: 'my-contacts', invoices: 'my-invoices' },
      }),
      'my-contacts': makeModule(),
      'my-invoices': makeModule(),
    },
  };
  expect(() => resolveModuleDependencies({ context })).not.toThrow();
});

test('mutual dependencies auto-wired by name match pass validation', () => {
  const context = {
    modules: {
      alpha: makeModule({ dependencies: [{ id: 'beta' }] }),
      beta: makeModule({ dependencies: [{ id: 'alpha' }] }),
    },
  };
  resolveModuleDependencies({ context });
  expect(context.modules.alpha.moduleDependencies).toEqual({ beta: 'beta' });
  expect(context.modules.beta.moduleDependencies).toEqual({ alpha: 'alpha' });
});

test('unknown key error shows (none) when no dependencies declared', () => {
  const context = {
    modules: {
      companies: makeModule({
        dependencies: [],
        moduleDependencies: { foo: 'bar' },
      }),
    },
  };
  expect(() => resolveModuleDependencies({ context })).toThrow('Declared dependencies: (none)');
});
