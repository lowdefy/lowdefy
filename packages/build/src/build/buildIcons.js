/*
  Copyright 2020-2021 Lowdefy, Inc

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

const iconPackages = {
  'react-icons/ai': /"(Ai[A-Z0-9]\w*)"/gm,
  'react-icons/bs': /"(Bs[A-Z0-9]\w*)"/gm,
  'react-icons/bi': /"(Bi[A-Z0-9]\w*)"/gm,
  'react-icons/di': /"(Di[A-Z0-9]\w*)"/gm,
  'react-icons/fi': /"(Fi[A-Z0-9]\w*)"/gm,
  'react-icons/fc': /"(Fc[A-Z0-9]\w*)"/gm,
  'react-icons/fa': /"(Fa[A-Z0-9]\w*)"/gm,
  'react-icons/gi': /"(Gi[A-Z0-9]\w*)"/gm,
  'react-icons/go': /"(Go[A-Z0-9]\w*)"/gm,
  'react-icons/gr': /"(Gr[A-Z0-9]\w*)"/gm,
  'react-icons/hi': /"(Hi[A-Z0-9]\w*)"/gm,
  'react-icons/im': /"(Im[A-Z0-9]\w*)"/gm,
  'react-icons/io': /"(IoIos[A-Z0-9]\w*)"/gm,
  'react-icons/io5': /"(Io[A-Z0-9]\w*)"/gm,
  'react-icons/md': /"(Md[A-Z0-9]\w*)"/gm,
  'react-icons/ri': /"(Ri[A-Z0-9]\w*)"/gm,
  'react-icons/si': /"(Si[A-Z0-9]\w*)"/gm,
  'react-icons/ti': /"(Ti[A-Z0-9]\w*)"/gm,
  'react-icons/vsc': /"(Vsc[A-Z0-9]\w*)"/gm,
  'react-icons/wi': /"(Wi[A-Z0-9]\w*)"/gm,
  'react-icons/cg': /"(Cg[A-Z0-9]\w*)"/gm,
};

function getConfigIcons({ components, icons, regex }) {
  [...JSON.stringify(components.global || {}).matchAll(regex)].map((match) => icons.add(match[1]));
  [...JSON.stringify(components.menus || []).matchAll(regex)].map((match) => icons.add(match[1]));
  [...JSON.stringify(components.pages || []).matchAll(regex)].map((match) => icons.add(match[1]));
}

function getBlockDefaultIcons({ components, context, icons, regex }) {
  Object.entries(components.types.blocks).forEach(([blockName, block]) => {
    context.types.icons[block.package][blockName].forEach((icon) => {
      [...JSON.stringify(icon).matchAll(regex)].map((match) => icons.add(match[1]));
    });
  });
}

function buildIcons({ components, context }) {
  components.icons = [];
  Object.entries(iconPackages).forEach(([iconPackage, regex]) => {
    const icons = new Set();
    // TODO: Can we do better than this?
    // Add default icons
    if (iconPackage === 'react-icons/ai') {
      icons.add('AiOutlineLoading3Quarters');
      icons.add('AiOutlineExclamationCircle');
    }
    getConfigIcons({ components, icons, regex });
    getBlockDefaultIcons({ components, context, icons, regex });
    components.icons.push({ icons: [...icons], package: iconPackage });
  });
}

export default buildIcons;
