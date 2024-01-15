/*
  Copyright 2020-2024 Lowdefy, Inc

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
  'react-icons/bi': /"(Bi[A-Z0-9]\w*)"/gm,
  'react-icons/bs': /"(Bs[A-Z0-9]\w*)"/gm,
  'react-icons/cg': /"(Cg[A-Z0-9]\w*)"/gm,
  'react-icons/ci': /"(Ci[A-Z0-9]\w*)"/gm,
  'react-icons/di': /"(Di[A-Z0-9]\w*)"/gm,
  'react-icons/fa': /"(Fa[A-Z0-9]\w*)"/gm,
  'react-icons/fc': /"(Fc[A-Z0-9]\w*)"/gm,
  'react-icons/fi': /"(Fi[A-Z0-9]\w*)"/gm,
  'react-icons/gi': /"(Gi[A-Z0-9]\w*)"/gm,
  'react-icons/go': /"(Go[A-Z0-9]\w*)"/gm,
  'react-icons/gr': /"(Gr[A-Z0-9]\w*)"/gm,
  'react-icons/hi': /"(Hi[A-Z0-9]\w*)"/gm,
  'react-icons/im': /"(Im[A-Z0-9]\w*)"/gm,
  'react-icons/io': /"(IoIos[A-Z0-9]\w*)"/gm,
  'react-icons/io5': /"(Io[A-Z0-9]\w*)"/gm,
  'react-icons/lu': /"(Lu[A-Z0-9]\w*)"/gm,
  'react-icons/md': /"(Md[A-Z0-9]\w*)"/gm,
  'react-icons/pi': /"(Pi[A-Z0-9]\w*)"/gm,
  'react-icons/ri': /"(Ri[A-Z0-9]\w*)"/gm,
  'react-icons/rx': /"(Rx[A-Z0-9]\w*)"/gm,
  'react-icons/si': /"(Si[A-Z0-9]\w*)"/gm,
  'react-icons/sl': /"(Sl[A-Z0-9]\w*)"/gm,
  'react-icons/tb': /"(Tb[A-Z0-9]\w*)"/gm,
  'react-icons/tfi': /"(Tfi[A-Z0-9]\w*)"/gm,
  'react-icons/ti': /"(Ti[A-Z0-9]\w*)"/gm,
  'react-icons/vsc': /"(Vsc[A-Z0-9]\w*)"/gm,
  'react-icons/wi': /"(Wi[A-Z0-9]\w*)"/gm,
};

function getConfigIcons({ components, icons, regex }) {
  [...JSON.stringify(components.global || {}).matchAll(regex)].map((match) => icons.add(match[1]));
  [...JSON.stringify(components.menus || []).matchAll(regex)].map((match) => icons.add(match[1]));
  [...JSON.stringify(components.pages || []).matchAll(regex)].map((match) => icons.add(match[1]));
}

function getBlockDefaultIcons({ blocks, context, icons, regex }) {
  blocks.forEach((block) => {
    (context.typesMap.icons[block.typeName] || []).forEach((icon) => {
      [...JSON.stringify(icon).matchAll(regex)].map((match) => icons.add(match[1]));
    });
  });
}

function buildIconImports({ blocks, components, context, defaults = {} }) {
  const iconImports = [];
  Object.entries(iconPackages).forEach(([iconPackage, regex]) => {
    defaults;
    const icons = new Set(defaults[iconPackage]);
    getConfigIcons({ components, icons, regex });
    getBlockDefaultIcons({ blocks, context, icons, regex });
    iconImports.push({ icons: [...icons], package: iconPackage });
  });
  return iconImports;
}

export default buildIconImports;
