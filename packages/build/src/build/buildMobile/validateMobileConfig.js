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

import semver from 'semver';
import { type } from '@lowdefy/helpers';
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

import collectExceptions from '../../utils/collectExceptions.js';
import validateMobileBackground from './validateMobileBackground.js';
import validateMobileNotifications from './validateMobileNotifications.js';
import validateMobileShare from './validateMobileShare.js';
import validateMobileShortcuts from './validateMobileShortcuts.js';
import validateMobileWidgets from './validateMobileWidgets.js';
import validateShellIcon from './validateShellIcon.js';

const MOBILE_KEYS = [
  'homePageId',
  'minShellVersion',
  'menus',
  'pages',
  'events',
  'shells',
  'auth',
  'notifications',
  'share',
  'widgets',
  'shortcuts',
  'background',
];
const MENU_KEYS = ['tabs', 'drawer', 'stack'];
const MENU_ITEM_KEYS = ['pageId', 'icon', 'sfSymbol', 'title', 'role'];
// iOS 26's search tab: set apart at the right of the tab bar, with a magnifier.
const TAB_ROLES = ['search'];
const SHELL_KEYS = [
  'id',
  'name',
  'icon',
  'color',
  'profile',
  'version',
  'scheme',
  'distribution',
  'eas',
  'ios',
  'android',
  'plugins',
  'extensions',
];
// The opt-in shell extensions @lowdefy/shell defines (EXTENSIONS in profiles.js): native targets or
// permission sets no profile carries.
const SHELL_EXTENSIONS = ['share', 'widgets', 'contacts', 'calendar'];
const SHELL_PLUGIN_KEYS = ['name', 'version', 'typePrefix', 'options'];
const IOS_KEYS = ['bundleId', 'teamId', 'ascAppId'];
const ANDROID_KEYS = ['package', 'sha256'];
const EAS_KEYS = ['owner', 'projectId'];
// The capability profiles @lowdefy/shell defines. The shell's own table is
// authoritative at its version; lowdefy mobile config fails on a name it lacks.
const SHELL_PROFILES = ['basic', 'field', 'field-nfc', 'field-tracking'];
const SHELL_DISTRIBUTIONS = ['private', 'store', 'internal'];

const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const STORE_VERSION_PATTERN = /^\d+\.\d+$/;
// A shell plugin's version is exact, so one name@version is always the same
// native code and the runtime version's plugins hash can stand for it.
const PLUGIN_VERSION_PATTERN = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
// Apple: alphanumerics, hyphens and periods, in reverse-DNS form.
const IOS_BUNDLE_ID_PATTERN = /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
// App Store Connect's numeric app id (App Information, Apple ID).
const ASC_APP_ID_PATTERN = /^[0-9]+$/;
// Android: at least two segments, each starting with a letter; letters, digits
// and underscores only.
const ANDROID_PACKAGE_PATTERN = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/;
const AUTH_KEYS = ['emailCode', 'unlock', 'unlockAfter', 'sharedDevice', 'sessionExpiresIn'];
const UNLOCK_MODES = ['none', 'biometric'];

// RFC 3986 scheme syntax. Web schemes are refused: the mobile sign-in page sends
// a one-time sign-in token to <scheme>://auth, which must reach the shell app,
// never a website.
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*$/;
const REFUSED_SCHEMES = [
  'about',
  'blob',
  'content',
  'data',
  'file',
  'http',
  'https',
  'intent',
  'javascript',
  'vbscript',
  'ws',
  'wss',
];

// Every check collects its ConfigError (collectExceptions), so one build reports every mobile
// config error, and returns whether the value passed: a check stops at a value that is not the
// object or array it reads further.

// Keys starting with "~" are build markers (~k, ~r, ~l, ~ignoreBuildChecks).
function checkKeys({ object, allowed, path, configKey, context }) {
  let valid = true;
  Object.keys(object).forEach((key) => {
    if (key.startsWith('~')) return;
    if (!allowed.includes(key)) {
      valid = false;
      collectExceptions(
        context,
        new ConfigError(
          `App "${path}" has unknown key "${key}". Allowed keys: ${allowed.join(', ')}.`,
          { configKey }
        )
      );
    }
  });
  return valid;
}

function checkObject({ value, path, configKey, context }) {
  if (!type.isObject(value)) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be an object.`, { received: value, configKey })
    );
    return false;
  }
  return true;
}

function checkArray({ value, path, configKey, context }) {
  if (!type.isArray(value)) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be an array.`, { received: value, configKey })
    );
    return false;
  }
  return true;
}

function checkOptionalString({ value, path, configKey, context }) {
  if (!type.isUndefined(value) && !type.isString(value)) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be a string.`, { received: value, configKey })
    );
    return false;
  }
  return true;
}

// A tab may take a role; one tab at most is the search tab. A drawer item takes none.
function validateMenuItemRoles({ items, path, configKey, roles, context }) {
  items.forEach((item, index) => {
    if (type.isUndefined(item.role)) return;
    if (!roles.includes(item.role)) {
      const allowed = roles.length === 0 ? 'none' : roles.join(', ');
      collectExceptions(
        context,
        new ConfigError(
          `App "${path}[${index}].role" should be one of: ${allowed}. Received ${JSON.stringify(
            item.role
          )}.`,
          { configKey: item['~k'] ?? configKey }
        )
      );
    }
  });
  const searchTabs = items.filter((item) => item.role === 'search');
  if (searchTabs.length > 1) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should have at most one item with role "search".`, {
        configKey: searchTabs[1]['~k'] ?? configKey,
      })
    );
  }
}

// Returns whether every item is an object, so the roles and count can be read.
function validateMenuItems({ items, path, configKey, context }) {
  if (!checkArray({ value: items, path, configKey, context })) {
    return false;
  }
  let itemsAreObjects = true;
  items.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!checkObject({ value: item, path: itemPath, configKey, context })) {
      itemsAreObjects = false;
      return;
    }
    const itemConfigKey = item['~k'] ?? configKey;
    const keyArgs = { configKey: itemConfigKey, context };
    checkKeys({ object: item, allowed: MENU_ITEM_KEYS, path: itemPath, ...keyArgs });
    if (!type.isString(item.pageId)) {
      collectExceptions(
        context,
        new ConfigError(`App "${itemPath}.pageId" should be a string.`, {
          received: item.pageId,
          configKey: itemConfigKey,
        })
      );
    }
    checkOptionalString({ value: item.icon, path: `${itemPath}.icon`, ...keyArgs });
    checkOptionalString({ value: item.sfSymbol, path: `${itemPath}.sfSymbol`, ...keyArgs });
    checkOptionalString({ value: item.title, path: `${itemPath}.title`, ...keyArgs });
  });
  return itemsAreObjects;
}

function validateMenus({ menus, configKey, context }) {
  if (!checkObject({ value: menus, path: 'mobile.menus', configKey, context })) {
    return;
  }
  const menusConfigKey = menus['~k'] ?? configKey;
  checkKeys({
    object: menus,
    allowed: MENU_KEYS,
    path: 'mobile.menus',
    configKey: menusConfigKey,
    context,
  });
  const frames = MENU_KEYS.filter((key) => !type.isUndefined(menus[key]));
  if (frames.length !== 1) {
    collectExceptions(
      context,
      new ConfigError(
        `App "mobile.menus" should have exactly one of ${MENU_KEYS.join(', ')}. Received ${
          frames.length === 0 ? 'none' : frames.join(', ')
        }.`,
        { configKey: menusConfigKey }
      )
    );
  }
  if (
    !type.isUndefined(menus.tabs) &&
    validateMenuItems({
      items: menus.tabs,
      path: 'mobile.menus.tabs',
      configKey: menusConfigKey,
      context,
    })
  ) {
    validateMenuItemRoles({
      items: menus.tabs,
      path: 'mobile.menus.tabs',
      configKey: menusConfigKey,
      roles: TAB_ROLES,
      context,
    });
    if (menus.tabs.length < 2 || menus.tabs.length > 5) {
      collectExceptions(
        context,
        new ConfigError(
          `App "mobile.menus.tabs" should have 2 to 5 items. Received ${menus.tabs.length}.`,
          { configKey: menus.tabs['~k'] ?? menusConfigKey }
        )
      );
    }
  }
  if (
    !type.isUndefined(menus.drawer) &&
    validateMenuItems({
      items: menus.drawer,
      path: 'mobile.menus.drawer',
      configKey: menusConfigKey,
      context,
    })
  ) {
    validateMenuItemRoles({
      items: menus.drawer,
      path: 'mobile.menus.drawer',
      configKey: menusConfigKey,
      roles: [],
      context,
    });
    if (menus.drawer.length === 0) {
      collectExceptions(
        context,
        new ConfigError('App "mobile.menus.drawer" should have at least one item.', {
          configKey: menus.drawer['~k'] ?? menusConfigKey,
        })
      );
    }
  }
  if (!type.isUndefined(menus.stack) && menus.stack !== true) {
    collectExceptions(
      context,
      new ConfigError('App "mobile.menus.stack" should be true.', {
        received: menus.stack,
        configKey: menusConfigKey,
      })
    );
  }
}

function checkOptionalEnum({ value, allowed, path, configKey, context }) {
  if (!type.isUndefined(value) && !allowed.includes(value)) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be one of ${allowed.join(', ')}.`, {
        received: value,
        configKey,
      })
    );
  }
}

function checkOptionalPattern({ value, pattern, path, description, configKey, context }) {
  if (!checkOptionalString({ value, path, configKey, context })) {
    return;
  }
  if (type.isString(value) && !pattern.test(value)) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be ${description}.`, {
        received: value,
        configKey,
      })
    );
  }
}

function validateShellEas({ eas, path, configKey, context }) {
  if (!checkObject({ value: eas, path, configKey, context })) {
    return;
  }
  checkKeys({ object: eas, allowed: EAS_KEYS, path, configKey, context });
  EAS_KEYS.forEach((key) =>
    checkOptionalString({ value: eas[key], path: `${path}.${key}`, configKey, context })
  );
}

function validateShellIos({ ios, path, configKey, context }) {
  if (!checkObject({ value: ios, path, configKey, context })) {
    return;
  }
  checkKeys({ object: ios, allowed: IOS_KEYS, path, configKey, context });
  checkOptionalPattern({
    value: ios.bundleId,
    pattern: IOS_BUNDLE_ID_PATTERN,
    path: `${path}.bundleId`,
    description: 'a reverse-DNS bundle id of letters, digits and hyphens, like "com.example.app"',
    configKey,
    context,
  });
  checkOptionalString({ value: ios.teamId, path: `${path}.teamId`, configKey, context });
  checkOptionalPattern({
    value: ios.ascAppId,
    pattern: ASC_APP_ID_PATTERN,
    path: `${path}.ascAppId`,
    description: 'the App Store Connect app id, digits only, like "6825509768"',
    configKey,
    context,
  });
}

function validateShellAndroid({ android, path, configKey, context }) {
  if (!checkObject({ value: android, path, configKey, context })) {
    return;
  }
  checkKeys({ object: android, allowed: ANDROID_KEYS, path, configKey, context });
  checkOptionalPattern({
    value: android.package,
    pattern: ANDROID_PACKAGE_PATTERN,
    path: `${path}.package`,
    description:
      'a reverse-DNS package name whose segments start with a letter and hold only letters, digits and underscores, like "com.example.app"',
    configKey,
    context,
  });
  const { sha256 } = android;
  const validSha256 =
    type.isUndefined(sha256) ||
    type.isString(sha256) ||
    (type.isArray(sha256) && sha256.every((value) => type.isString(value)));
  if (!validSha256) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}.sha256" should be a string or an array of strings.`, {
        received: sha256,
        configKey,
      })
    );
  }
}

// The fingerprint exists only after the first Android upload, so a shell
// is built and shipped without it first.
function warnMissingSha256({ shell, path, configKey, context }) {
  if (type.isUndefined(shell.ios) && type.isUndefined(shell.android)) {
    return;
  }
  if (!type.isUndefined(shell.android?.sha256)) {
    return;
  }
  context.handleWarning(
    new ConfigWarning(
      `Mobile shell "${shell.id}" has no "android.sha256", so sign-in by sheet will not work on Android. After the first Android upload, copy the app signing key's SHA-256 from Play Console into "${path}.android.sha256" and deploy the server (see "lowdefy mobile checklist").`,
      { configKey }
    )
  );
}

// Returns whether the plugin is an object with a name, which the duplicate and version checks
// read.
function validateShellPlugin({ plugin, path, configKey, context }) {
  if (!checkObject({ value: plugin, path, configKey, context })) {
    return false;
  }
  const pluginConfigKey = plugin['~k'] ?? configKey;
  checkKeys({
    object: plugin,
    allowed: SHELL_PLUGIN_KEYS,
    path,
    configKey: pluginConfigKey,
    context,
  });
  if (!type.isString(plugin.name)) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}.name" should be a string.`, {
        received: plugin.name,
        configKey: pluginConfigKey,
      })
    );
    return false;
  }
  if (!type.isString(plugin.version) || !PLUGIN_VERSION_PATTERN.test(plugin.version)) {
    collectExceptions(
      context,
      new ConfigError(
        `App "${path}.version" of shell plugin "${plugin.name}" should be an exact version, like "2.1.0" or "2.1.0-beta.1". Ranges, dist-tags, git, "file:" and "workspace:" are refused.`,
        { received: plugin.version, configKey: pluginConfigKey }
      )
    );
  }
  checkOptionalString({
    value: plugin.typePrefix,
    path: `${path}.typePrefix`,
    configKey: pluginConfigKey,
    context,
  });
  if (!type.isUndefined(plugin.options)) {
    checkObject({
      value: plugin.options,
      path: `${path}.options`,
      configKey: pluginConfigKey,
      context,
    });
  }
  return true;
}

// Returns whether every plugin is an object with a name.
function validateShellPlugins({ plugins, path, configKey, context }) {
  if (!checkArray({ value: plugins, path, configKey, context })) {
    return false;
  }
  const names = new Set();
  let pluginsAreNamed = true;
  plugins.forEach((plugin, index) => {
    const pluginPath = `${path}[${index}]`;
    if (!validateShellPlugin({ plugin, path: pluginPath, configKey, context })) {
      pluginsAreNamed = false;
      return;
    }
    const name = plugin.name.toLowerCase();
    if (names.has(name)) {
      collectExceptions(
        context,
        new ConfigError(`Duplicate shell plugin "${plugin.name}" in "${path}".`, {
          configKey: plugin['~k'] ?? configKey,
        })
      );
    }
    names.add(name);
  });
  return pluginsAreNamed;
}

// Returns whether the shell's plugins can be read by the version check.
function validateShell({ shell, path, configKey, context }) {
  if (!checkObject({ value: shell, path, configKey, context })) {
    return false;
  }
  const shellConfigKey = shell['~k'] ?? configKey;
  const keyArgs = { configKey: shellConfigKey, context };
  checkKeys({ object: shell, allowed: SHELL_KEYS, path, ...keyArgs });
  if (!type.isString(shell.id)) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}.id" should be a string.`, {
        received: shell.id,
        configKey: shellConfigKey,
      })
    );
  }
  checkOptionalString({ value: shell.name, path: `${path}.name`, ...keyArgs });
  checkOptionalString({ value: shell.icon, path: `${path}.icon`, ...keyArgs });
  if (type.isString(shell.icon)) {
    validateShellIcon({
      icon: shell.icon,
      path: `${path}.icon`,
      configDirectory: context.directories.config,
      ...keyArgs,
    });
  }
  checkOptionalPattern({
    value: shell.color,
    pattern: COLOR_PATTERN,
    path: `${path}.color`,
    description: 'a colour like "#0B5FFF"',
    ...keyArgs,
  });
  checkOptionalEnum({
    value: shell.profile,
    allowed: SHELL_PROFILES,
    path: `${path}.profile`,
    ...keyArgs,
  });
  checkOptionalPattern({
    value: shell.version,
    pattern: STORE_VERSION_PATTERN,
    path: `${path}.version`,
    description: '"major.minor", like "1.4" (the patch is raised by each native build)',
    ...keyArgs,
  });
  checkOptionalEnum({
    value: shell.distribution,
    allowed: SHELL_DISTRIBUTIONS,
    path: `${path}.distribution`,
    ...keyArgs,
  });
  checkOptionalString({ value: shell.scheme, path: `${path}.scheme`, ...keyArgs });
  if (
    type.isString(shell.scheme) &&
    (!SCHEME_PATTERN.test(shell.scheme) || REFUSED_SCHEMES.includes(shell.scheme))
  ) {
    collectExceptions(
      context,
      new ConfigError(
        `App "${path}.scheme" should be the shell's own URL scheme in lowercase, like "myapp", and not a web scheme.`,
        { received: shell.scheme, configKey: shellConfigKey }
      )
    );
  }
  if (!type.isUndefined(shell.eas)) {
    validateShellEas({ eas: shell.eas, path: `${path}.eas`, ...keyArgs });
  }
  if (!type.isUndefined(shell.ios)) {
    validateShellIos({ ios: shell.ios, path: `${path}.ios`, ...keyArgs });
  }
  if (!type.isUndefined(shell.android)) {
    validateShellAndroid({ android: shell.android, path: `${path}.android`, ...keyArgs });
  }
  let pluginsAreNamed = true;
  if (!type.isUndefined(shell.plugins)) {
    pluginsAreNamed = validateShellPlugins({
      plugins: shell.plugins,
      path: `${path}.plugins`,
      ...keyArgs,
    });
  }
  if (!type.isUndefined(shell.extensions)) {
    validateShellExtensions({
      extensions: shell.extensions,
      path: `${path}.extensions`,
      ...keyArgs,
    });
  }
  warnMissingSha256({ shell, path, ...keyArgs });
  return pluginsAreNamed;
}

function validateShellExtensions({ extensions, path, configKey, context }) {
  if (!checkArray({ value: extensions, path, configKey, context })) {
    return;
  }
  extensions.forEach((extension, index) => {
    if (!SHELL_EXTENSIONS.includes(extension)) {
      collectExceptions(
        context,
        new ConfigError(
          `App "${path}[${index}]" should be one of ${SHELL_EXTENSIONS.join(', ')}.`,
          { received: extension, configKey }
        )
      );
    }
  });
  if (new Set(extensions).size !== extensions.length) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" lists an extension twice.`, {
        received: extensions,
        configKey,
      })
    );
  }
}

// The server installs one copy of each plugin package, so a package has one
// version across root plugins and every shell's plugins.
function checkPluginVersions({ shells, rootPlugins, configKey, context }) {
  const seen = new Map();
  (type.isArray(rootPlugins) ? rootPlugins : []).forEach((plugin, index) => {
    if (type.isObject(plugin) && type.isString(plugin.name) && !seen.has(plugin.name)) {
      seen.set(plugin.name, { version: plugin.version, path: `plugins[${index}]` });
    }
  });
  shells.forEach((shell, shellIndex) => {
    (shell.plugins ?? []).forEach((plugin, index) => {
      const path = `mobile.shells[${shellIndex}].plugins[${index}]`;
      const first = seen.get(plugin.name);
      if (!first) {
        seen.set(plugin.name, { version: plugin.version, path });
        return;
      }
      if (first.version !== plugin.version) {
        collectExceptions(
          context,
          new ConfigError(
            `Plugin "${plugin.name}" is at version "${first.version}" in "${first.path}" and "${plugin.version}" in "${path}". An app runs one version of a plugin, so use the same version in both.`,
            { configKey: plugin['~k'] ?? shell['~k'] ?? configKey }
          )
        );
      }
    });
  });
}

function validateShells({ shells, configKey, context }) {
  if (!checkArray({ value: shells, path: 'mobile.shells', configKey, context })) {
    return;
  }
  const shellIds = new Set();
  let shellsAreReadable = true;
  shells.forEach((shell, index) => {
    const path = `mobile.shells[${index}]`;
    if (!validateShell({ shell, path, configKey, context })) {
      shellsAreReadable = false;
      return;
    }
    if (shellIds.has(shell.id)) {
      collectExceptions(
        context,
        new ConfigError(`Duplicate mobile shell id "${shell.id}".`, {
          configKey: shell['~k'] ?? configKey,
        })
      );
    }
    shellIds.add(shell.id);
  });
  if (!shellsAreReadable) {
    return;
  }
  checkPluginVersions({ shells, rootPlugins: context.plugins, configKey, context });
  // validateNativePageTypes reads which shells carry which plugins. buildPage
  // has no components. An in-process JIT page build runs on a copy of this
  // context; the dev server's page builds restore it from mobileShells.json.
  context.mobileShells = shells.map((shell) => ({
    id: shell.id,
    plugins: (shell.plugins ?? []).map((plugin) => plugin.name),
  }));
}

function checkOptionalBoolean({ value, path, configKey, context }) {
  if (!type.isUndefined(value) && !type.isBoolean(value)) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be a boolean.`, { received: value, configKey })
    );
  }
}

function checkOptionalInteger({ value, path, minimum, configKey, context }) {
  if (type.isUndefined(value)) {
    return;
  }
  if (!type.isInt(value) || value < minimum) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be an integer of ${minimum} or more.`, {
        received: value,
        configKey,
      })
    );
  }
}

function validateAuth({ auth, configKey, context }) {
  if (!checkObject({ value: auth, path: 'mobile.auth', configKey, context })) {
    return;
  }
  const authConfigKey = auth['~k'] ?? configKey;
  const keyArgs = { configKey: authConfigKey, context };
  checkKeys({ object: auth, allowed: AUTH_KEYS, path: 'mobile.auth', ...keyArgs });
  checkOptionalBoolean({ value: auth.emailCode, path: 'mobile.auth.emailCode', ...keyArgs });
  if (!type.isUndefined(auth.unlock) && !UNLOCK_MODES.includes(auth.unlock)) {
    collectExceptions(
      context,
      new ConfigError(`App "mobile.auth.unlock" should be one of ${UNLOCK_MODES.join(', ')}.`, {
        received: auth.unlock,
        configKey: authConfigKey,
      })
    );
  }
  checkOptionalInteger({
    value: auth.unlockAfter,
    path: 'mobile.auth.unlockAfter',
    minimum: 0,
    ...keyArgs,
  });
  checkOptionalBoolean({ value: auth.sharedDevice, path: 'mobile.auth.sharedDevice', ...keyArgs });
  checkOptionalInteger({
    value: auth.sessionExpiresIn,
    path: 'mobile.auth.sessionExpiresIn',
    minimum: 1,
    ...keyArgs,
  });
}

// The schema check (testSchema) only warns, and a shell cannot open an app
// whose mobile config it does not understand, so the mobile key is checked
// here and an unknown key fails the build. Every error is collected, so one
// build reports them all.
//
// Purpose texts for the capabilities a shell's profile adds are checked once
// mobile.permissions exists; until then a profile is accepted on its name.
function validateMobileConfig({ mobile, context }) {
  if (!checkObject({ value: mobile, path: 'mobile', context })) {
    return;
  }
  const configKey = mobile['~k'];
  checkKeys({ object: mobile, allowed: MOBILE_KEYS, path: 'mobile', configKey, context });
  checkOptionalString({
    value: mobile.homePageId,
    path: 'mobile.homePageId',
    configKey,
    context,
  });
  if (
    !type.isUndefined(mobile.minShellVersion) &&
    (!type.isString(mobile.minShellVersion) || semver.valid(mobile.minShellVersion) === null)
  ) {
    collectExceptions(
      context,
      new ConfigError('App "mobile.minShellVersion" should be a semver version, like "7.4.0".', {
        received: mobile.minShellVersion,
        configKey,
      })
    );
  }
  if (!type.isUndefined(mobile.menus)) {
    validateMenus({ menus: mobile.menus, configKey, context });
  }
  if (
    !type.isUndefined(mobile.pages) &&
    checkArray({ value: mobile.pages, path: 'mobile.pages', configKey, context })
  ) {
    mobile.pages.forEach((page, index) => {
      checkObject({ value: page, path: `mobile.pages[${index}]`, configKey, context });
    });
  }
  if (!type.isUndefined(mobile.shells)) {
    validateShells({ shells: mobile.shells, configKey, context });
  }
  if (!type.isUndefined(mobile.auth)) {
    validateAuth({ auth: mobile.auth, configKey, context });
  }
  if (!type.isUndefined(mobile.notifications)) {
    validateMobileNotifications({ notifications: mobile.notifications, configKey, context });
  }
  if (!type.isUndefined(mobile.share)) {
    validateMobileShare({ share: mobile.share, configKey, context });
  }
  if (!type.isUndefined(mobile.widgets)) {
    validateMobileWidgets({ widgets: mobile.widgets, configKey, context });
  }
  if (!type.isUndefined(mobile.shortcuts)) {
    validateMobileShortcuts({ shortcuts: mobile.shortcuts, configKey, context });
  }
  if (!type.isUndefined(mobile.background)) {
    validateMobileBackground({ background: mobile.background, configKey, context });
  }
}

export default validateMobileConfig;
