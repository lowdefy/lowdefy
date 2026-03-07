/* eslint-disable no-console */

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

import { BuildError, LowdefyInternalError } from '@lowdefy/errors';

import createContext from '../../createContext.js';
import logCollectedErrors from '../../utils/logCollectedErrors.js';
import makeId from '../../utils/makeId.js';
import tryBuildStep from '../../utils/tryBuildStep.js';

import addDefaultPages from '../addDefaultPages/addDefaultPages.js';
import addKeys from '../addKeys.js';
import buildApp from '../buildApp.js';
import buildAuth from '../buildAuth/buildAuth.js';
import buildConnections from '../buildConnections.js';
import buildApi from '../buildApi/buildApi.js';
import buildLogger from '../buildLogger.js';
import buildImports from '../buildImports/buildImports.js';
import buildMenu from '../buildMenu.js';
import buildRefs from '../buildRefs/buildRefs.js';
import buildTypes from '../buildTypes.js';
import cleanBuildDirectory from '../cleanBuildDirectory.js';
import copyPublicFolder from '../copyPublicFolder.js';
import testSchema from '../testSchema.js';
import validateConfig from '../validateConfig.js';
import writeApp from '../writeApp.js';
import writeAuth from '../writeAuth.js';
import writeConfig from '../writeConfig.js';
import writeConnections from '../writeConnections.js';
import writeApi from '../writeApi.js';
import writeGlobal from '../writeGlobal.js';
import writeJs from '../buildJs/writeJs.js';
import writeLogger from '../writeLogger.js';
import writeMaps from '../writeMaps.js';
import updateServerPackageJson from '../full/updateServerPackageJson.js';
import writeMenus from '../writeMenus.js';
import writePageRegistry from './writePageRegistry.js';
import writePluginImports from '../writePluginImports/writePluginImports.js';

import addInstalledTypes from './addInstalledTypes.js';
import buildJsShallow from './buildJsShallow.js';
import buildShallowPages from './buildShallowPages.js';
import stripPageContent from './stripPageContent.js';
import writeSourcelessPages from './writeSourcelessPages.js';

async function shallowBuild(options) {
  makeId.reset();

  let context;
  try {
    context = createContext(options);

    let components;
    try {
      components = await buildRefs({
        context,
        shallowOptions: true,
      });
    } catch (err) {
      if (err.isLowdefyError) {
        context.handleError(err);
        throw new BuildError('Build failed with 1 error(s). See above for details.');
      }
      throw err;
    }

    // addKeys + testSchema first for error location info
    tryBuildStep(addKeys, 'addKeys', { components, context });
    stripPageContent({ components, context });
    tryBuildStep(testSchema, 'testSchema', { components, context });

    logCollectedErrors(context);

    // Build skeleton steps (everything except page content)
    tryBuildStep(buildApp, 'buildApp', { components, context });
    tryBuildStep(buildLogger, 'buildLogger', { components, context });
    tryBuildStep(validateConfig, 'validateConfig', { components, context });
    tryBuildStep(addDefaultPages, 'addDefaultPages', { components, context });
    tryBuildStep(addKeys, 'addKeys', { components, context });
    tryBuildStep(buildAuth, 'buildAuth', { components, context });
    tryBuildStep(buildConnections, 'buildConnections', { components, context });
    tryBuildStep(buildApi, 'buildApi', { components, context });

    const { pageRegistry, sourcelessPageArtifacts } = buildShallowPages({ components, context });

    tryBuildStep(buildJsShallow, 'buildJsShallow', { components, context });

    tryBuildStep(buildMenu, 'buildMenu', { components, context });
    tryBuildStep(buildTypes, 'buildTypes', { components, context });

    // Update server package.json before addInstalledTypes so that addInstalledTypes
    // sees the full set of dependencies on every run (not just after the first build).
    // This prevents plugin import files from differing between the initial and
    // subsequent builds, which would trigger unnecessary Next.js rebuilds.
    await updateServerPackageJson({ components, context });

    tryBuildStep(addInstalledTypes, 'addInstalledTypes', { components, context });
    tryBuildStep(buildImports, 'buildImports', { components, context });
    tryBuildStep(addKeys, 'addKeys', { components, context });

    logCollectedErrors(context);

    // Write all build artifacts
    await cleanBuildDirectory({ context });
    await writeSourcelessPages({ sourcelessPageArtifacts, context });
    await writeApp({ components, context });
    await writeAuth({ components, context });
    await writeConnections({ components, context });
    await writeApi({ components, context });
    await writeConfig({ components, context });
    await writeGlobal({ components, context });
    await writeLogger({ components, context });
    await writeMaps({ context });
    await context.writeBuildArtifact(
      'connectionIds.json',
      JSON.stringify([...context.connectionIds])
    );
    await writeMenus({ components, context });
    await writeJs({ context });
    await context.writeBuildArtifact('jsMap.json', JSON.stringify(context.jsMap));
    await context.writeBuildArtifact(
      'customTypesMap.json',
      JSON.stringify(options.customTypesMap ?? {})
    );
    // Persist snapshot of installed packages for JIT missing-package detection.
    // Written as a build artifact so JIT builds compare against the skeleton
    // build state, not a potentially-updated package.json (race condition).
    await context.writeBuildArtifact(
      'installedPluginPackages.json',
      JSON.stringify([...(context.installedPackages ?? [])])
    );
    await writePluginImports({ components, context });
    await writePageRegistry({ pageRegistry, context });
    await copyPublicFolder({ components, context });

    return { components, pageRegistry, context };
  } catch (err) {
    if (err instanceof BuildError) {
      throw err;
    }
    // Unexpected internal error - preserve Lowdefy errors as-is, wrap plain errors
    const lowdefyErr = err.isLowdefyError
      ? err
      : new LowdefyInternalError(err.message, { cause: err });
    if (context) {
      context.handleError(lowdefyErr);
    } else {
      const logger = options.logger ?? console;
      logger.error(lowdefyErr);
    }
    throw new BuildError('Build failed due to internal error. See above for details.');
  }
}

export default shallowBuild;
