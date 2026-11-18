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

// A file the app names is appended to its origin, so anything that does not
// start with "/" could name another host and is not a path.
function isAppPath(value) {
  return typeof value === 'string' && value.startsWith('/');
}

// Loads the app's current build into a view that runs an earlier one, by doing
// the loader's boot step again: the frame's document is the host's cached
// loader, so reloading it would only run the same loader, and the frame is
// never reloaded. Asks the app for its boot answer, unmounts the running
// client, swaps the stylesheets and adds the new entry script, which starts
// the view again at resumePath. When the app still names the entry that is
// running, the same bundle starts again (restart).
async function loadViewBuild({ bridge, document, fetch, restart, resumePath, unmount }) {
  const { appOrigin } = bridge;
  const response = await fetch(`${appOrigin}${bridge.basePath}/api/view/boot`);
  if (!response.ok) {
    throw new Error(`The app answered ${response.status} to /api/view/boot.`);
  }
  const boot = await response.json();
  const stylesheets = boot.css ?? [];
  if (![boot.js, ...stylesheets].every(isAppPath)) {
    throw new Error('The app named a view file that is not a path.');
  }
  const previous = bridge.getBoot();
  unmount();
  bridge.setResumePath(resumePath);
  if (boot.js === previous.js) {
    restart();
    return;
  }
  bridge.setBoot(boot);
  const kept = new Set(stylesheets.map((file) => `${appOrigin}${file}`));
  const present = new Set();
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (!link.href.startsWith(`${appOrigin}/`)) {
      return;
    }
    if (kept.has(link.href)) {
      present.add(link.href);
    } else {
      link.remove();
    }
  });
  kept.forEach((href) => {
    if (present.has(href)) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });
  const script = document.createElement('script');
  script.type = 'module';
  script.crossOrigin = 'anonymous';
  script.src = `${appOrigin}${boot.js}`;
  script.addEventListener('error', () => {
    bridge.showFallback({ message: 'The view could not load the new version of the app.' });
  });
  document.body.appendChild(script);
}

export default loadViewBuild;
