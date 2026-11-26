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

// Where `lowdefy test` and lowdefy_run_tests run their journeys, from browser, thorough, headless
// and build: { runner, build } or { error }. `runner` is "headless" by default: only the journeys
// that need no browser run, and the rest are listed browser-only, with the step that needs one.
// thorough makes it "mixed": each journey runs headless when it can and in the browser when it
// can't, and a journey the headless run finds needs a browser partway through runs in the browser
// too, from step 1. browser makes it "browser": every journey in the browser. headless is the
// default, kept so scripts that pass it keep working. The three options each pick the runner, so
// two of them refuse the run. build runs on the production build, headless only: running browser
// journeys on the production build is not built yet. A headless run goes one at a time, so a
// concurrency typed for one is refused rather than ignored; one from lowdefy.yaml's cli config is
// not chosen by this run, so it is left alone (`typedOptions` lists the options the run was given).
// Messages name the options with `flagPrefix`: "--" on the command line, "" for the MCP tool's
// arguments.
function readTestMode({ options, flagPrefix = '--' }) {
  const flag = (name) => `${flagPrefix}${name}`;
  const browser = options.browser === true;
  const thorough = options.thorough === true;
  const headless = options.headless === true;
  const build = options.build === true;
  if ([browser, thorough, headless].filter(Boolean).length > 1) {
    return {
      error: `${flag('browser')}, ${flag('thorough')} and ${flag(
        'headless'
      )} each pick where the journeys run: pass one of them. By default (or with ${flag(
        'headless'
      )}) only the journeys that need no browser run; ${flag(
        'thorough'
      )} runs each journey headless when it can and in the browser when it can't, and also runs in the browser each journey found to need one partway through; ${flag(
        'browser'
      )} runs every journey in the browser.`,
    };
  }
  // Only the command line takes build.
  if (build && (browser || thorough)) {
    return {
      error: `--build runs the journeys that need no browser on the production build. Running the browser journeys on the production build is not supported yet: drop --build and run "lowdefy test --${
        browser ? 'browser' : 'thorough'
      }" to run them on the dev server.`,
    };
  }
  let runner = 'headless';
  if (browser) {
    runner = 'browser';
  } else if (thorough) {
    runner = 'mixed';
  }
  if (runner === 'headless' && (options.typedOptions ?? []).includes('concurrency')) {
    return {
      error: `${flag('concurrency')} runs browser journeys side by side, and a headless run goes one at a time: drop ${flag(
        'concurrency'
      )}, or pass ${flag('thorough')} or ${flag('browser')} to run the browser journeys side by side.`,
    };
  }
  return { runner, build };
}

export default readTestMode;
