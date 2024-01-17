# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 4.0.1

### Patch Changes

- Fix build issue on release.

# [4.0.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.15...v4.0.0) (2024-01-16)

We're excited to announce Lowdefy V4, a full-stack web framework that simplifies building web applications, internal tools, admin panels, BI dashboards, and CRUD apps using YAML or JSON configuration files.

In this update, Lowdefy developers now enjoy faster app performance and improved functionality with custom code plugins.

## New Features in Lowdefy V4

1. **Next.js build**: Lowdefy apps have been converted to run on top of the [Next.js](https://nextjs.org/) framework.
2. **All of Auth.js**: App authentication are now implemented by configuring any [Auth.js](https://authjs.dev/) supported providers, adapters and callbacks and events, all of which can be customized.
3. **Plugin extensibility**: Apps can now be extended with any [**npm**](https://www.npmjs.com/) or [**pnpm workspace**](https://pnpm.io/workspaces) plugins.
4. **Flexible Styling**: Change any of Ant Design's [more than 900 style variables](https://github.com/ant-design/ant-design/blob/4.x-stable/components/style/themes/default.less).
5. **Better, Faster Rendering**: Reduced page loading times, better loading state management including easy configuration of loading skeletons where needed.

See our [blog post](https://lowdefy.com/lowdefy-v4-launch) for more details.

See our [migration guide](https://docs.lowdefy.com/v3-to-v4) to guidance on converting V3 apps to V4.

## Pricing and Licensing Changes

Starting with Lowdefy **V4**, we are introducing a [capped usage based pricing](https://lowdefy.com/pricing) to Lowdefy apps that include authentication.

Given the new pricing model we have changed how we license Lowdefy, for more information see [the licenses page](https://docs.lowdefy.com/licenses) in the Lowdefy docs.

## Changes Compared to v4.0.0-rc.15

### Major Changes

- 5cfe04a68: Upgrade change-case dependency to 5.4.0. This is a breaking change and effects the `_change_case` operator. Changes to the `_change_case` operator:

  - Options splitRegex and stripRegexp are no longer supported.
  - paramCase has been renamed to kebabCase
  - headerCase has been renamed to trainCase
  - The following options have been added:
    - locale
    - mergeAmbiguousCharacters
    - prefixCharacters
    - split
    - suffixCharacters

### Minor Changes

- Add cover content area to Card block. ([c8a75a9](https://github.com/lowdefy/lowdefy/commit/c8a75a9155c994cc96658933ca4d0b6a5b1afc74))
- Add git sha to build artifacts. ([c0c0a51](https://github.com/lowdefy/lowdefy/commit/c0c0a512d4586852b32d0fcce2d413848ccbadde))
- Optimise server apiWrapper. ([7c48608](https://github.com/lowdefy/lowdefy/commit/7c48608b700694c66b94289ff9c3aa323c0e20e2))
- Support Phosphor icon set. ([82009c6](https://github.com/lowdefy/lowdefy/commit/82009c653d42ce0639b4de786a4adbffb150eb2b))

### Patch Changes

- 66e3c1bfe: Improve property validation errors in MongoDBCollection connection.
- a8673449b: Update dependency mongodb to v6.3.0.
- Add error boundary to servers. ([c3f2c4f](https://github.com/lowdefy/lowdefy/commit/c3f2c4fc2fc7dbd981752b2d1792c141bb221d02))
- Cleanup unused buildoutput. ([75db8b1](https://github.com/lowdefy/lowdefy/commit/75db8b1d380ed82df3bbe6226fa1f299639a470f))
- Fix sign out event user definition ([3821bfd](https://github.com/lowdefy/lowdefy/commit/3821bfdd7c7b4f8db9258bb849aeb5c607effd22))
- Fix warning validation not showing. ([7289dcc](https://github.com/lowdefy/lowdefy/commit/7289dcc9e2bd49ee942ba969aab5a924b8900c7b))
- User defined validation messages should over required message. ([f40c135](https://github.com/lowdefy/lowdefy/commit/f40c1353b396333fc3ba9bc4bcbbdf8958906953))

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

### Bug Fixes

- **blocks-antd:** Check if option exists before checking tag. ([a72688d](https://github.com/lowdefy/lowdefy/commit/a72688d687674e309f103244eacba9613938293a))

### Features

- Add cover content area to Card block. ([c8a75a9](https://github.com/lowdefy/lowdefy/commit/c8a75a9155c994cc96658933ca4d0b6a5b1afc74))
- Support Phosphor icon set. ([82009c6](https://github.com/lowdefy/lowdefy/commit/82009c653d42ce0639b4de786a4adbffb150eb2b))

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

### Bug Fixes

- Fix server dev plugin dependencies. ([3f14ba0](https://github.com/lowdefy/lowdefy/commit/3f14ba07e121d127bc94462b15b2cae01a911e9d))

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

### Bug Fixes

- **blocks-antd:** Change to controlled tab, closes [#1705](https://github.com/lowdefy/lowdefy/issues/1705) ([c804c18](https://github.com/lowdefy/lowdefy/commit/c804c18c7753782e301b7e1d077f27f4138939a7))
- **blocks-antd:** Control tabs using setActiveKey method. ([1d2845c](https://github.com/lowdefy/lowdefy/commit/1d2845c3a73d8cf536fb081f5c61c823ec98375f))
- **blocks-antd:** Mention html support in title schema. ([6929fa3](https://github.com/lowdefy/lowdefy/commit/6929fa3cc83ca50e4bdd38ce6dc9b1ceb7794ff0))
- **blocks-antd:** Set ant-tabs-tabpane-hidden class to display none. ([c354acb](https://github.com/lowdefy/lowdefy/commit/c354acb0e8937d9c025bb810d34914ca66d57fe1))
- **deps:** Revert less to 4.1.3. ([ea298c9](https://github.com/lowdefy/lowdefy/commit/ea298c9f49d0a30b7877f28c12cde944e2c1b803))
- **helpers:** Do not add quotes around strings in query params. ([250c617](https://github.com/lowdefy/lowdefy/commit/250c6174f54c27ddc11a11295a387afeef7272fc))

### Features

- **api:** Add connectionId to request object. ([df16dbc](https://github.com/lowdefy/lowdefy/commit/df16dbca8545128cb51f78d173a2a96e47cbf729))
- **blocks-antd:** Add onFocus and onBlur events to inputs ([ac9f342](https://github.com/lowdefy/lowdefy/commit/ac9f342c6bcd2b0c5df940fc9cc4783013f44714))
- **blocks-antd:** Render HTML in tabs titles. ([28421cc](https://github.com/lowdefy/lowdefy/commit/28421cc2ae644f0924d876d1b276334e20cfdfa3))
- **blocks-antd:** Trigger onChange event when active key changes. ([0c1908e](https://github.com/lowdefy/lowdefy/commit/0c1908e2c4887c4b492a8a2c6994b0bf63eb02b7))
- **docs:** Add connectionId field to request docs. ([9f67461](https://github.com/lowdefy/lowdefy/commit/9f67461bed5f56a6a2f089bb6723a0bef9f358bf))

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- **build:** Fix path keys. ([a6d9bb9](https://github.com/lowdefy/lowdefy/commit/a6d9bb9b376205d1a3ce1ffc5c133a2a8e44b5e1))
- **build:** Handel rec array keys. ([ce429e7](https://github.com/lowdefy/lowdefy/commit/ce429e7fd67c307456b705b4bb23782854be8852))
- **build:** Reduce spaces in build output. ([2e14c4f](https://github.com/lowdefy/lowdefy/commit/2e14c4f38ba8819aefddd1072c69910e6c0b6969))
- **build:** reset id counter. ([a06d15d](https://github.com/lowdefy/lowdefy/commit/a06d15da753ed1026c891a8611df5534d80aae91))
- **build:** Update menuLink in lowdefy schema to include urlQuery and input. ([3d1f6c5](https://github.com/lowdefy/lowdefy/commit/3d1f6c5981f635eeee84e4c7c606867517aa13b5))
- Deepsource style fixes. ([e0804b8](https://github.com/lowdefy/lowdefy/commit/e0804b87999e6d812f2d2378770ed214d4264142))
- Deepsource style fixes. ([2086f5d](https://github.com/lowdefy/lowdefy/commit/2086f5d2e8e5665ec5fd16ce83e59119571f833d))
- **deps:** Update dependency mongodb to v4.17.1 ([35abd12](https://github.com/lowdefy/lowdefy/commit/35abd12336d60ad316905cc19260061af7efc90e))
- **docs:** Fix payload on request examples. ([5ce3335](https://github.com/lowdefy/lowdefy/commit/5ce3335469c01979011f55cffd4f76285ef13d1a))
- **docs:** Update example requests to make use of payload. ([2917d07](https://github.com/lowdefy/lowdefy/commit/2917d07c423051125f723ca329691e5b5a1eafe8))
- Fix engine tests. ([9a826e6](https://github.com/lowdefy/lowdefy/commit/9a826e6667ebcd780dc430addbff5ee65c10fbf6))
- Fix KnexBuilder connection. ([9f4d823](https://github.com/lowdefy/lowdefy/commit/9f4d823a9c19c68a90bdb7229cf0f6ad5a1e2c8a))
- Fix Stripe request. ([421a326](https://github.com/lowdefy/lowdefy/commit/421a3264fecdcfc98853491c5eda97aaa235361a))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **blocks-antd:** Add onChange to DateTimeSelector. ([c0d0b87](https://github.com/lowdefy/lowdefy/commit/c0d0b8788e15359b341b37d4139763ccf40d25b7))
- **blocks-antd:** Fix Statistic decimalSeparator after ant design update. ([8a4c90c](https://github.com/lowdefy/lowdefy/commit/8a4c90c6da905a7bf5ee383edbb7e4a1e6f14be7))
- **blocks:** Add onTextSelection to Paragraph and document. ([7325633](https://github.com/lowdefy/lowdefy/commit/7325633d27adb876734e62140fc3e97b7e4ff119))
- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Patch version updates for various deps. ([64068f3](https://github.com/lowdefy/lowdefy/commit/64068f38573113e9436d638489e9435ac7f45edf))
- **deps:** Revert rehype and remark blocks-markdown deps ([f075afc](https://github.com/lowdefy/lowdefy/commit/f075afc21c0f8748fdfa5433b59d3ce307edaf6a))
- **deps:** UIpdate dependency mingo to v6.4.4 ([7f63c57](https://github.com/lowdefy/lowdefy/commit/7f63c571b141ddebb7d080790e820430e6970cec))
- **deps:** Update @elastic/elasticsearch to v7.17.12 ([f5edd4c](https://github.com/lowdefy/lowdefy/commit/f5edd4cda33df8b1999dba93e48ae673fb17c13b))
- **deps:** Update axios to v1.5.0. ([a23099a](https://github.com/lowdefy/lowdefy/commit/a23099af2738faff4a27c55bcf413ca3da5cdbd2))
- **deps:** Update dependencies rehype-raw and remark-gfm ([683ff03](https://github.com/lowdefy/lowdefy/commit/683ff039a2da4c6d6ffed4166a4068bd6d3b5fe4))
- **deps:** Update dependency @emotion/css to v11.11.2 ([6bd3155](https://github.com/lowdefy/lowdefy/commit/6bd3155430c861dadedbce7f49b0ccc32922aa29))
- **deps:** Update dependency @react-google-maps/api to v2.19.2 ([8f69817](https://github.com/lowdefy/lowdefy/commit/8f69817c2f186fe506e3ba83055e665a349619dd))
- **deps:** Update dependency antd to v4.24.14 ([208acbe](https://github.com/lowdefy/lowdefy/commit/208acbebe44b98e1662deb974d4689d13de26536))
- **deps:** Update dependency aws to v2.1459.0 ([c01488c](https://github.com/lowdefy/lowdefy/commit/c01488cb8ed4290729ded77e4cc6347b4e20d009))
- **deps:** Update dependency commander to v11.0.0 ([d1a93ac](https://github.com/lowdefy/lowdefy/commit/d1a93acbdad40651b34faacb2fc8cf4c075d2e98))
- **deps:** Update dependency dompurify to v3.0.5 ([62204c5](https://github.com/lowdefy/lowdefy/commit/62204c5e25603eb997a3021d7efe57f2fb9250a9))
- **deps:** Update dependency dotenv to v16.3.1 ([82c1f7a](https://github.com/lowdefy/lowdefy/commit/82c1f7aa168cacab4197326c4f000a00e22761fb))
- **deps:** Update dependency html5-qrcode to v2.3.8 ([534e02a](https://github.com/lowdefy/lowdefy/commit/534e02aab27b4c6aa24e14cba5c7076050a26c52))
- **deps:** Update dependency knex to v2.5.1 ([45045ba](https://github.com/lowdefy/lowdefy/commit/45045ba754f040bf763659c592721f0824a32205))
- **deps:** Update dependency mssql to v10.0.1 ([491ab72](https://github.com/lowdefy/lowdefy/commit/491ab72d023ffa9ef673a8ce46ce4feeaaae96de))
- **deps:** Update dependency next to v13.5.4. ([230a687](https://github.com/lowdefy/lowdefy/commit/230a6876993a0802190a7f33d823fe5630062da9))
- **deps:** Update dependency next-auth to v4.23.1 ([48f9780](https://github.com/lowdefy/lowdefy/commit/48f97809e825fb9afdd169120371184b3e2a98c8))
- **deps:** Update dependency ora to v7.0.1 ([7b58aac](https://github.com/lowdefy/lowdefy/commit/7b58aac1538f765f78b6e6dfa7dc06f7d5349116))
- **deps:** Update dependency pg to v8.11.3 ([40706a1](https://github.com/lowdefy/lowdefy/commit/40706a1886c421b6ba028a943178bdcc33fdcab8))
- **deps:** Update dependency pino to v8.15.0 ([d380b3c](https://github.com/lowdefy/lowdefy/commit/d380b3cfa51387f1602689e353f82c59dc1cd9ed))
- **deps:** Update dependency rc-motion to v2.9.0. ([a8bf242](https://github.com/lowdefy/lowdefy/commit/a8bf242024ec88785fba3f7185ad31b4e8f4f3db))
- **deps:** Update dependency react-icons to v4.11.0 ([21f23d4](https://github.com/lowdefy/lowdefy/commit/21f23d40cf0a7c4ed1931b55ebf854b2bc239948))
- **deps:** Update dependency redis to v4.6.8 ([41051a3](https://github.com/lowdefy/lowdefy/commit/41051a34ed29b9159c8011db0a7f51b6a669fdef))
- **deps:** Update dependency stripe to v13.6.0 ([4ec189b](https://github.com/lowdefy/lowdefy/commit/4ec189b0afed3166b93199e816406b85b36b83a3))
- **deps:** Update dependency swr to v2.2.2 ([017e865](https://github.com/lowdefy/lowdefy/commit/017e865023edafeb52428466d8fa7e0c2b96b9f2))
- **deps:** Update dependency tinycolor2 to v1.6.0. ([0f21f87](https://github.com/lowdefy/lowdefy/commit/0f21f878c50bd5c67360d58606e42e4fd91faad8))
- **deps:** Update dependency yaml to 2.3.2 ([cbcdc7d](https://github.com/lowdefy/lowdefy/commit/cbcdc7d3e313fca96fa52bc4724344a061d9f444))
- **deps:** Update development dependencies. ([b7d7cca](https://github.com/lowdefy/lowdefy/commit/b7d7cca10e676949957cf6650ec706ab1a08f68a))
- **docs:** Add Fetch action documentation. ([8a2af0c](https://github.com/lowdefy/lowdefy/commit/8a2af0c22a04e2ca6438dd6e13c9533d0b82face))
- **docs:** Fix Apache Echarts default locale. ([c1707e3](https://github.com/lowdefy/lowdefy/commit/c1707e397a6216f23de877a0bf2491a88d7643ea)), closes [#1326](https://github.com/lowdefy/lowdefy/issues/1326)
- **docs:** General polish and bug fixes. ([384e2ff](https://github.com/lowdefy/lowdefy/commit/384e2ff7224181c96b0b130b1f6ff583fc849cd3))
- **docs:** Update CopyToClipboard docs. ([8fd55ca](https://github.com/lowdefy/lowdefy/commit/8fd55cacc20c2a326cb7bf6fa7bf2f5a1bd9f53f))
- **docs:** Update migration guide ([9c1e6c0](https://github.com/lowdefy/lowdefy/commit/9c1e6c0ff2cb095b06fd9175f25e0fba0190b0d9))
- Documentation fixes. ([7753924](https://github.com/lowdefy/lowdefy/commit/7753924e578a860b890bab8c24497b090bc07f78))
- Fix docs quickstart command ([ad305b5](https://github.com/lowdefy/lowdefy/commit/ad305b582f74b8245d45aa6a8f6a572822bbcbf4))
- **plugin-mongodb:** Fix schema discription. ([5f5cca1](https://github.com/lowdefy/lowdefy/commit/5f5cca1ca6fcacd6092dd6e56620346926925ad3))
- Remove unnecessary dependencies from server ([a8246c0](https://github.com/lowdefy/lowdefy/commit/a8246c0e84cd5d1545de05c17de4cea029836b0a))
- **server-dev:** Update stdOutLineHandler for pino logs ([2cef6d7](https://github.com/lowdefy/lowdefy/commit/2cef6d7e66d8ef7a34d9dec5eb1d6aea2fdb4f3f))
- Update to Next 13 and update Link. ([33c34c3](https://github.com/lowdefy/lowdefy/commit/33c34c3b5b10973bd749b7dc806210aa7d92dbda))
- **web:** Fix website build after removed plugins. ([9e2115d](https://github.com/lowdefy/lowdefy/commit/9e2115d8b94f662711036e94b8dedae36f61fff9))
- **website:** Configure home page id on website. ([2542644](https://github.com/lowdefy/lowdefy/commit/2542644c1840145b08881b03caa48a729af2ae72))

### Features

- **actions-core:** Add CopyToClipboard action. ([964cd8f](https://github.com/lowdefy/lowdefy/commit/964cd8fb9cee93f4979f5c106f6ba89b5ea9b3a1))
- **blocks-algolia:** Add DocSearch block. ([701ee87](https://github.com/lowdefy/lowdefy/commit/701ee87ec7f3e5f2b28568e43c14948548b90d9e))
- **blocks-antd:** Add renderTags and option to render Tags in MultipleSelector. ([92a28fd](https://github.com/lowdefy/lowdefy/commit/92a28fd4ceb096257c4181a8ea0c5dd8bfbc8c2d))
- **blocks-antd:** Add Tag block. ([07d16cf](https://github.com/lowdefy/lowdefy/commit/07d16cfc31c34bc5f77e5ae76b4851f52f9bfda3))
- **blocks-antd:** Add Tag to docs. ([6a9a29e](https://github.com/lowdefy/lowdefy/commit/6a9a29e458eb52da6b65c8db5b1438ef592aa906))
- **blocks:** Add onTextSelection event to Html. ([4f00d5e](https://github.com/lowdefy/lowdefy/commit/4f00d5e8851e21d0409539b18f4ee8182a92ddcc))
- **plugin-mongodb:** Move log-collection to community plugins. ([d526a10](https://github.com/lowdefy/lowdefy/commit/d526a10da8725e9e50de13e24d29d282a1969899))
- **plugin-mongodb:** Update docs. ([4d2e03d](https://github.com/lowdefy/lowdefy/commit/4d2e03d768cd0e651706b207c654a9c8d0837241))
- Update minimum node version to 18 ([0b64fd1](https://github.com/lowdefy/lowdefy/commit/0b64fd1347fc807d79819cc9c2022671088c8921))
- **website:** Remove custom CopyToClipboard action from website. ([9c9dbc8](https://github.com/lowdefy/lowdefy/commit/9c9dbc86beea43227fc14ae09eb9fa65fe3346e8))

### BREAKING CHANGES

- Update minimum node version to 18

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Bug Fixes

- Add V3 banner to docs. ([77610d1](https://github.com/lowdefy/lowdefy/commit/77610d11c23df8c128192beb2837e92e3664b835))
- **api:** Use lowdefy get,set helpers in auth user fields. ([40dded4](https://github.com/lowdefy/lowdefy/commit/40dded47a92cce829787244e1ce1dbd5fb6e478f))
- **blocks-echarts:** Fix echarts-for-react missing tslib dependency. ([3b119d0](https://github.com/lowdefy/lowdefy/commit/3b119d01741df40996cf1144c618da23d4eb7898))
- Change lowdefy@4 references to lowdefy@rc. ([ceff662](https://github.com/lowdefy/lowdefy/commit/ceff66214482e1152bd15c74880f136f86100f4f))
- **deps:** update dependency dompurify to v2.4.7 ([5b3709b](https://github.com/lowdefy/lowdefy/commit/5b3709b00ee002f6e56c7d525fe2314c4f68ff3e))
- **deps:** update dependency echarts to v5.4.3 ([7595527](https://github.com/lowdefy/lowdefy/commit/75955279d704015a07d4b2a56b74247fbb30870c))
- **deps:** update dependency fs-extra to v11.1.1 ([e70fc3e](https://github.com/lowdefy/lowdefy/commit/e70fc3e8e5de3091f5c0acd8dde279434f958bcf))
- **deps:** update dependency semver to v7.5.2 [security] ([6326c77](https://github.com/lowdefy/lowdefy/commit/6326c77890d8262d828847b52abd097bd0f39980))
- Docs polish and fixes ([1a00dd9](https://github.com/lowdefy/lowdefy/commit/1a00dd9e741e7492646cbfe949506a956103b0c0))
- **docs:** Fix blocks on docs not rendering. ([965fffa](https://github.com/lowdefy/lowdefy/commit/965fffae3d3dc120fdd5795130b20e5697ae3d31))
- **docs:** reference version number. ([b121006](https://github.com/lowdefy/lowdefy/commit/b1210065ba990db53d37504dbd4a93aaf2b7f1d4))
- **docs:** Remove post telemetry. ([93930d6](https://github.com/lowdefy/lowdefy/commit/93930d69fc61e23f281f47da0baceb439d3356e9))
- **docs:** Tutorial fixes and polish ([69e8c07](https://github.com/lowdefy/lowdefy/commit/69e8c07d23d27a11050886b8eec16e57c5de0bff))
- Fix documentation yaml indentation. ([12a9ecb](https://github.com/lowdefy/lowdefy/commit/12a9ecbb9ea10b2ec5e1545cf10ac16b05ea3d50))
- Fix next-auth peer dependencies. ([0a251a8](https://github.com/lowdefy/lowdefy/commit/0a251a8ff9d80bdafbe0dc38e6d0394a40699d03))
- Logging cleanup. ([30a495c](https://github.com/lowdefy/lowdefy/commit/30a495c3e40fe566af306b54d7c8ece3c79de1b9))
- Plugins docs polish. ([286b01f](https://github.com/lowdefy/lowdefy/commit/286b01f167fec572f313ff164f6046bc8bcb1cf2))
- Remove arrayIndices param from operator docs. ([ba298f4](https://github.com/lowdefy/lowdefy/commit/ba298f4a7cb2360f2e938abcf8c27bcde84b87d8))
- SetState SetGlobal typo ([b54efb1](https://github.com/lowdefy/lowdefy/commit/b54efb1062f6244b24985c93b2d89d9659fb15d2))
- Small typos in plugins-dev.yaml ([45c77f3](https://github.com/lowdefy/lowdefy/commit/45c77f356f9dccc85e3944c5b051823ec58332df))
- Typo in plugins-connections.yaml ([68828cd](https://github.com/lowdefy/lowdefy/commit/68828cd254de46fd69d9d4ee0394e89001c8e0b8))
- Typos in plugins-operators.yaml ([e028644](https://github.com/lowdefy/lowdefy/commit/e028644b37f0b3e03a78d88ec017b087b36be899))
- Update switch operator error message. ([909a611](https://github.com/lowdefy/lowdefy/commit/909a611ae649194888173479f5748a52e6b91f7e))
- Update website tagline. ([cce91df](https://github.com/lowdefy/lowdefy/commit/cce91df9c74c3a8c26de68814001dd9dced35085))
- **website:** Add enterprise features section. ([39d63dc](https://github.com/lowdefy/lowdefy/commit/39d63dc16c4f16a1804aaf1bac12c56b9d14821d))
- **website:** Add font and small style changes. ([76e9e61](https://github.com/lowdefy/lowdefy/commit/76e9e6146b8e833a17fb6002602e762e2467930e))
- **website:** Add testimonials section to website. ([848d4b9](https://github.com/lowdefy/lowdefy/commit/848d4b94dc4993f19ee031c158cc7dfc5841c629))
- **website:** All Buttons use href. ([63ca371](https://github.com/lowdefy/lowdefy/commit/63ca3719e30f6f10fcbb7a2dd7e1d28e581335af))
- **website:** Fix hero link. ([af98679](https://github.com/lowdefy/lowdefy/commit/af98679dcdfc9190d60978bb6e16ea56694ddb48))
- **website:** Fix sitemap. ([fba5b15](https://github.com/lowdefy/lowdefy/commit/fba5b157add5578def3c3bb4cd7b8be0a2be363d))
- **website:** Small layout changes to website. ([b7a240e](https://github.com/lowdefy/lowdefy/commit/b7a240e7261b760cebe2ed83cebdc90a338fdc92))
- **website:** Update examples section. ([79a15d6](https://github.com/lowdefy/lowdefy/commit/79a15d632bb5e1e290df89ed217de0ab5c9f6362))
- **website:** Update open source section. ([de9e5e7](https://github.com/lowdefy/lowdefy/commit/de9e5e7ff6150c990be25e89e9819799ce43005b))
- **website:** Update plugins section. ([458e92c](https://github.com/lowdefy/lowdefy/commit/458e92c3af4fb20ba6a63f29c31efc958e40ae17))
- **website:** Update product description section. ([8f67728](https://github.com/lowdefy/lowdefy/commit/8f67728f6e3728a2e71b6249700cf0b2e22dfae9))
- **website:** Update testimonials section. ([b623cf5](https://github.com/lowdefy/lowdefy/commit/b623cf5c4588c2660510b23baa6c51ce7f9fc6dd))
- **website:** Update website hero content. ([339d46d](https://github.com/lowdefy/lowdefy/commit/339d46d9711b9ccbad4d06f549902bddcf26b7c2))
- **website:** Update website with new design. ([66e01df](https://github.com/lowdefy/lowdefy/commit/66e01df5232f67d2ad601300e766fda91fe273d2))

### Features

- Add another testimonial. ([b3b76bf](https://github.com/lowdefy/lowdefy/commit/b3b76bf700b4ed86bd17c66737c4745c96acf457))
- Add Auth provider docs. ([7335dd8](https://github.com/lowdefy/lowdefy/commit/7335dd89a9ed093eb3a2ed639be8b7f305def726))
- Add logger to next auth options. ([b30412f](https://github.com/lowdefy/lowdefy/commit/b30412f7cda93be43226728340061465bf6597f4))
- **api:** Refactor next auth configuration for logging. ([5d04948](https://github.com/lowdefy/lowdefy/commit/5d04948cc34b7d95dfc781254e0d5acb346bd2be))
- Auth event logs WIP ([7601894](https://github.com/lowdefy/lowdefy/commit/760189432f271f682eb9f23abd960ff5d5b12873))
- **blocks-aggrid:** Update AgGrid to v29.3.5. ([8c6898a](https://github.com/lowdefy/lowdefy/commit/8c6898a6c57d458af2183a03a4b84bb710abfac7))
- Connector section. ([bb0d818](https://github.com/lowdefy/lowdefy/commit/bb0d8181417a1dca63a0a8e3dcd8ccf62b28bfa6))
- **docs:** Add border radius. ([6d50050](https://github.com/lowdefy/lowdefy/commit/6d500504d7224c80c2a148060fb650411e94416a))
- **docs:** Add operator plugin docs. ([9fd356a](https://github.com/lowdefy/lowdefy/commit/9fd356a38d4ffa91e50171f9e8202763e98deb64))
- **docs:** Add plugins docs wip. ([00f661f](https://github.com/lowdefy/lowdefy/commit/00f661fa5fce55bdf243081a3c15439f1b0eb560))
- **docs:** Add posthog ([58e2b3a](https://github.com/lowdefy/lowdefy/commit/58e2b3a4c86f587da7c3757fdef2887f8e34dad2))
- **docs:** Plugin development docs. ([792eee0](https://github.com/lowdefy/lowdefy/commit/792eee0a6962494eadacb8cde7a592ecd61bbee4))
- **docs:** Post feedback and newsletter. ([cf7a4e2](https://github.com/lowdefy/lowdefy/commit/cf7a4e2c40b5477f577b7f627dc50fb5260699fc))
- finalize testimonials. ([60bb443](https://github.com/lowdefy/lowdefy/commit/60bb4430045511129457ef8d482e7cd3d20fc638))
- Fix colors and sponsor btn. ([1160011](https://github.com/lowdefy/lowdefy/commit/1160011eb755447c9b044de42a4229186e76c84e))
- Plugin documentation ([6a4d3fe](https://github.com/lowdefy/lowdefy/commit/6a4d3fe696712d770e719cb47800e7b45c80c2e5))
- Plugins docs wip ([182ecab](https://github.com/lowdefy/lowdefy/commit/182ecab9020884a635ca432c306647afe02665d4))
- Server logging polish and cleanup. ([fe46d23](https://github.com/lowdefy/lowdefy/commit/fe46d23408d3d24d15cc284faa74c2e0eb154f8b))
- **server-dev:** Log errors in dev server. ([cacdc12](https://github.com/lowdefy/lowdefy/commit/cacdc12a3b3773603d61487089ae7061cb483af3))
- **server:** Add info logs to request calls. ([0f90fdd](https://github.com/lowdefy/lowdefy/commit/0f90fdd9a3d0b18e57829447dfa0097e1a858006))
- **server:** Log server errors with pino. ([ed36f2f](https://github.com/lowdefy/lowdefy/commit/ed36f2f1aa1134ff4deb7da46f18463b8f70c173))
- **server:** Server logging WIP. ([0718405](https://github.com/lowdefy/lowdefy/commit/0718405735c09170064739575ccd40d0e3e9fed0))
- **server:** Updates to logging. ([e3fea46](https://github.com/lowdefy/lowdefy/commit/e3fea46b9eec40b603401a2eefd3e602ee42e988))
- Update dev server to work with logger. ([f036a62](https://github.com/lowdefy/lowdefy/commit/f036a623067bdcc225d37137511baacd4f317535))
- Website add tag. ([07ae642](https://github.com/lowdefy/lowdefy/commit/07ae6422b4036e1823e670e209e67c0cffec9345))
- **website:** Add posthog. ([7a357d1](https://github.com/lowdefy/lowdefy/commit/7a357d1f39bc0aaec48b2b7252a1be650116bcd2))
- **website:** Add robots.txt ([b894817](https://github.com/lowdefy/lowdefy/commit/b8948174c15dadfeb4e9e64f0124ea7df9f0f151))
- **website:** Add website newsletter signup. ([158232e](https://github.com/lowdefy/lowdefy/commit/158232e438b355e1cc15caaeeea2cde3d7f54e4c))
- **website:** copy version rc. ([d8235eb](https://github.com/lowdefy/lowdefy/commit/d8235eb37ab0159a765ccc4e6da44444e362a0c3))
- **website:** Final style changes. ([438a519](https://github.com/lowdefy/lowdefy/commit/438a5193df34e7b8f44367709da37cb07abf15de))
- **website:** Generate sitemap. ([8e105fd](https://github.com/lowdefy/lowdefy/commit/8e105fd053ba8ad598624f225ad8543b8a0a4fb6))
- **website:** Post to discord. ([c86492c](https://github.com/lowdefy/lowdefy/commit/c86492c517ae435d47a6c74bbb16b8edcebc6977))
- **website:** Some color fixes. ([cda004a](https://github.com/lowdefy/lowdefy/commit/cda004aee4aea54aea051a7230ee25f2b9752c7a))
- **website:** Update typography and hero. ([9845121](https://github.com/lowdefy/lowdefy/commit/98451212196ee8fa4679bf1d29f748d2f1ee6a2f))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

### Bug Fixes

- **connection-mongodb:** Use Lowdefy serialiser util to serialise object ids. ([b7d5d71](https://github.com/lowdefy/lowdefy/commit/b7d5d718466c44a3c01d94359540e8e5e9def96b))
- **docs:** Add note to migration guide on serialise breaking changes ([4a27aad](https://github.com/lowdefy/lowdefy/commit/4a27aadfe251ad620cbe44a1e73e65bd015fe283))
- **engine:** Fix setting values of blocks to null using set state. ([58d0cf8](https://github.com/lowdefy/lowdefy/commit/58d0cf8cdebf6536c51ad96ab342be0e681b4298))
- Update serializer util to not clash with \_date operator ([b8cdcb3](https://github.com/lowdefy/lowdefy/commit/b8cdcb3e44a0b1157c111bc7679ac428138c6f97))

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Bug Fixes

- Add 200 response on auth API head requests ([d51e28f](https://github.com/lowdefy/lowdefy/commit/d51e28f99e9051ca7aba90c05fc325074b08469c))
- Auth methods should return signin promises. ([5dcb778](https://github.com/lowdefy/lowdefy/commit/5dcb7788f54c07f6b5e4f3e9cf3d27537a795bb4))
- **blocks-antd:** Add regex property to PhoneNumberInput block. ([c1e4080](https://github.com/lowdefy/lowdefy/commit/c1e4080476034704b105421a805e086c162a8e20))
- **blocks-antd:** Add regex property to TextInput block. ([548e7a9](https://github.com/lowdefy/lowdefy/commit/548e7a925bc440436a51c140249e9f85881327f7))
- **blocks-antd:** Rename regex property to replaceInput. ([cd811ae](https://github.com/lowdefy/lowdefy/commit/cd811ae6fae47a8384c73f439fd8fab86d0226ac))
- **blocks-antd:** Update PhoneNumberInput styles.less file to include Select styles. ([8bdd479](https://github.com/lowdefy/lowdefy/commit/8bdd479afdc5afb001c4b8f5485789a94a4aee50))
- **connection-mongodb:** Handle upsert true on MongoDBUpdateOne ([7611bee](https://github.com/lowdefy/lowdefy/commit/7611bee1899332b6ccca03fada7cec1541d6c902))
- **deps:** update dependency yaml to v2.2.2 [security] ([8e015fe](https://github.com/lowdefy/lowdefy/commit/8e015fec47a40bc5233f23d8da345720475d1232))
- Fix basePath on requests. ([a2b4aaf](https://github.com/lowdefy/lowdefy/commit/a2b4aaf19ba6a5ccf213e7d08a2df342794d4420)), closes [#1554](https://github.com/lowdefy/lowdefy/issues/1554)
- Fix initialisation of lowdefy context object. ([2ed4398](https://github.com/lowdefy/lowdefy/commit/2ed4398d59be5b037e7a4d17f7e5a14398e73973))
- Fix next auth session provider base path ([715cdf2](https://github.com/lowdefy/lowdefy/commit/715cdf2cc48da88a55055c4af28435aa789f67ea))
- Fix server configuration migration guide ([53f52f6](https://github.com/lowdefy/lowdefy/commit/53f52f6b150ddbabfef5ab13b9a983173839fc97))
- Fix web manifest and icons with base path. ([9620a2c](https://github.com/lowdefy/lowdefy/commit/9620a2c80133ebcbaedbe08d66fb1387a3fb38f1))
- Reload page if auth session expires ([6223783](https://github.com/lowdefy/lowdefy/commit/6223783b84892f8c9469ee740417ccca1004a16b))
- Server session not passed to session provider ([36f8d5a](https://github.com/lowdefy/lowdefy/commit/36f8d5ae15b0a6aae58fd6b4cab955f91a2d93e7))

### Features

- **actions-core:** Add UpdateSession action. ([c5d6011](https://github.com/lowdefy/lowdefy/commit/c5d601151acbdb791aaf1304ae95b0ccb18b8c03))
- Add helper findLogCollectionRecordTestMongoDb ([bc590c9](https://github.com/lowdefy/lowdefy/commit/bc590c99c241f0fbb046be4e13a710070c96cba5))
- **blocks-antd:** Add Carousel block to default Lowdefy blocks. ([85972d1](https://github.com/lowdefy/lowdefy/commit/85972d1d8e4f3fbd00ac55e386ef0f9a326bbdaa))
- **connection-mongodb:** Add log collection tests MongoDBDeleteMany ([15a8b22](https://github.com/lowdefy/lowdefy/commit/15a8b2226828a80ab83d5cfe11c355bb3f45d576))
- **connection-mongodb:** Add log collection tests MongoDBDeleteOne ([5a1334a](https://github.com/lowdefy/lowdefy/commit/5a1334a291c0c1a2263ab0c53cb727efaf6a8693))
- **connection-mongodb:** Add log collection tests MongoDBInsertMany ([64dc0d2](https://github.com/lowdefy/lowdefy/commit/64dc0d22b8810f2ca23085770cffd61aaacb5c92))
- **connection-mongodb:** Add log collection tests MongoDBInsertOne ([a882513](https://github.com/lowdefy/lowdefy/commit/a882513a81cafcc355d212bbb9331a18dd3cc809))
- **connection-mongodb:** Add log collection tests MongoDBUpdateMany ([1b9c64b](https://github.com/lowdefy/lowdefy/commit/1b9c64bb56b7b780ea87b8bc430503386a1bac72))
- **connection-mongodb:** Add log collection tests MongoDBUpdateOne ([9a66604](https://github.com/lowdefy/lowdefy/commit/9a666042429620ff689ee19cef8b97315a795fc5))
- **docs:** Add Layout, Header-Content-Footer example to docs and migration guide ([878601e](https://github.com/lowdefy/lowdefy/commit/878601efda3b6190f34151e35daf6882a37ce328))
- Remove support for setting base path using an environment variable ([ec7052d](https://github.com/lowdefy/lowdefy/commit/ec7052dab152645b4a5ed9098320e46488041034))
- Update project readme for v4. ([60f9708](https://github.com/lowdefy/lowdefy/commit/60f9708d2b5292b343dacfe510c9cd33ac8dc874))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

### Bug Fixes

- **blocks-antd:** Fix search on PhoneNumberInput block. ([6c97b69](https://github.com/lowdefy/lowdefy/commit/6c97b69064cc41e0bde0e6ba7f4730de135eeec7))
- **docs:** Update docker docs ([d8b6e46](https://github.com/lowdefy/lowdefy/commit/d8b6e4600259ccf52c1b7d4eecf74b8e76d7724b))
- **serializer:** Add test case. ([41b79cd](https://github.com/lowdefy/lowdefy/commit/41b79cdfa4c0fad797ccb4dae91688b6d6c4e86b))
- **serializer:** Make _k_ enumerable first. ([427f5b9](https://github.com/lowdefy/lowdefy/commit/427f5b908fdd64de5cc3848a16687f28637aa53c))

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Bug Fixes

- **actions-core:** Update GeolocationCurrentPosition error handling. ([bfc2498](https://github.com/lowdefy/lowdefy/commit/bfc249856082290cd567ec44c49cbc27f9681eef))
- **blocks-ag-grid:** Update ag-grid README.md ([f1ee1dc](https://github.com/lowdefy/lowdefy/commit/f1ee1dce278247a4c43766162acfff95c2191696))
- **blocks-aggrid:** onRowClick and onRowSelected events. ([17a9df5](https://github.com/lowdefy/lowdefy/commit/17a9df54a2558112b2f00942ccbcb841a32efc06))
- **blocks-antd:** Update Header and Sider blocks schemas ([6786cdb](https://github.com/lowdefy/lowdefy/commit/6786cdb899a69f2d117aef23bc63942ac4574dee))
- **blocks-antd:** Update PhoneNumberInput ([2cdfe2c](https://github.com/lowdefy/lowdefy/commit/2cdfe2cfa710b08eefeca9773f9aebd73b4b899e))
- **blocks-google-maps:** Fix example in README. ([67e7e22](https://github.com/lowdefy/lowdefy/commit/67e7e22a2419e85bb09bc6444486ef13c6caaf14))
- **blocks-loaders:** Remove IconSpinner and update Spinner ([daa5696](https://github.com/lowdefy/lowdefy/commit/daa5696f3e53b4ed8590248ec948248cd16c1055))
- **blocks-loaders:** Update Skeleton blocks schemas ([12914da](https://github.com/lowdefy/lowdefy/commit/12914daa92922d72365c30e408c233da0eb16744))
- **build:** Fix tests. ([68313eb](https://github.com/lowdefy/lowdefy/commit/68313eb489f6fe3d47100c1325c99d90b133065f))
- Change backlinks for layout to layout-overview ([0852011](https://github.com/lowdefy/lowdefy/commit/08520113d6d9a7824a95e0b7a43cb73e19fbe769))
- **cli:** Add requiresLowdefyYaml to context. ([f3c6584](https://github.com/lowdefy/lowdefy/commit/f3c658489f7a0164ef00bed8422ef21ba2d61d6f))
- **cli:** Fix command is init condition in validateVersion. ([b3e25b7](https://github.com/lowdefy/lowdefy/commit/b3e25b7b97cd265d93e123ebb1e5bc8228a329a8))
- **cli:** Fix undefined version error when calling lowdefy init. ([a589cd5](https://github.com/lowdefy/lowdefy/commit/a589cd596acb1ed444322dceff2407b1714fe112))
- **cli:** Update tests. ([743f440](https://github.com/lowdefy/lowdefy/commit/743f440732fa08a5718afffd1e4ead070bb366f0))
- **deps:** update dependency next-auth to v4.20.1 [security] ([bcf12a3](https://github.com/lowdefy/lowdefy/commit/bcf12a37ae4fa921abcd6f943e14ace2fd0c5eb8))
- **deps:** update dependency next-auth to v4.20.1 [security] ([7e408a2](https://github.com/lowdefy/lowdefy/commit/7e408a2095e73dca79b9777217aec37e11d4cba3))
- **deps:** update dependency sqlite3 to v5.1.5 [security] ([cbc8b05](https://github.com/lowdefy/lowdefy/commit/cbc8b0580d71b9a8917e27e6b6f711dfdbaed402))
- **docs:** Additional details on GoogleMapsScript.yaml ([f3296fd](https://github.com/lowdefy/lowdefy/commit/f3296fd0010b18dbb269f6acc7e310c4b79c5b42))
- **docs:** AgGrid docs typo. ([62f5937](https://github.com/lowdefy/lowdefy/commit/62f59376aadca524b15e357e160564f435d2e25e))
- **docs:** Fix monorepo docker deploy docs. ([c7a75e6](https://github.com/lowdefy/lowdefy/commit/c7a75e6351ee3448c63270400e1d2897a29d9163))
- **docs:** Only call telemetry on prod. ([5ac37b8](https://github.com/lowdefy/lowdefy/commit/5ac37b87608108f2be4587e29a9d3aac373b9f2c))
- **docs:** Rename layout in concepts to layout-overview ([621d1bd](https://github.com/lowdefy/lowdefy/commit/621d1bdf5bf58f1fa00269daa54b258ff0b9f55a))
- **docs:** Update AgGrid docs. ([9eeab3e](https://github.com/lowdefy/lowdefy/commit/9eeab3ed1f90c22bcdb3fbce46f8d874121f8e0c))
- **docs:** Update GoogleMaps blocks docs. Split into GoogleMaps, GoogleMapsHeatmap, GoogleMapsScript. ([262f5a4](https://github.com/lowdefy/lowdefy/commit/262f5a4392ecc3288f802b41cb0a854a01e991d9))
- **docs:** Update schema_definition usage. ([86f6c67](https://github.com/lowdefy/lowdefy/commit/86f6c67258cb2ae48b765f848dd00d2e6d74e8d1))
- **operator:** fix operator tests. ([9d3acff](https://github.com/lowdefy/lowdefy/commit/9d3acfffa19153a4537ff76851e2383f441db7f9))
- **operators:** Remove _r_ on build operators. ([68ce4f5](https://github.com/lowdefy/lowdefy/commit/68ce4f56969de3b5dede537867eda1a9f825bdc9))
- **plugin-aws:** Update S3UploadPhoto schema ([f1acc17](https://github.com/lowdefy/lowdefy/commit/f1acc17e4275bc8bc677836f24ece0b067193a29))
- Rename depreciated unstable_getServerSession. ([7dcb0c6](https://github.com/lowdefy/lowdefy/commit/7dcb0c665969bafdf03e082389c9101d00146636))
- **server-dev:** Update reinstall dependencies warning message ([86f4b9f](https://github.com/lowdefy/lowdefy/commit/86f4b9fa0dadac468a97b9aa4169a7ae62a71fc9))
- Update PhoneNumberInput examples ([ae52024](https://github.com/lowdefy/lowdefy/commit/ae52024395ed5de697b796f5d9dce6943d3fb753))

### Features

- **blocks-aggrid:** Add onSortChanged method. ([aa262fb](https://github.com/lowdefy/lowdefy/commit/aa262fb72243c0339ab7dc7563932cd6c5465d36))
- **blocks-aggrid:** Implement loading in AgGrid and AgGridInput. ([80db126](https://github.com/lowdefy/lowdefy/commit/80db126ac9122d4203a283bb6116521716f9a404))
- **blocks-aggrid:** Pass loading through to blocks. ([79d2a6c](https://github.com/lowdefy/lowdefy/commit/79d2a6c15e2fb27be7315d83984a49a615f24a66))
- **blocks-aggrid:** Update all blocks schema.json file. ([70cf5d1](https://github.com/lowdefy/lowdefy/commit/70cf5d1ce7a8055f128a09aed411118e3817c083))
- **blocks-antd:** Add PhoneNumberInput block. ([9ef0339](https://github.com/lowdefy/lowdefy/commit/9ef033913aa9726995cb9c3cd1e66cc6311413ba))
- **blocks-antd:** Add tests for PhoneNumberInput. ([eab2338](https://github.com/lowdefy/lowdefy/commit/eab23383d6e3460a68236c50b79e7bee180c6267))
- **build:** change makeId to incremental counter. ([69ac158](https://github.com/lowdefy/lowdefy/commit/69ac1584d435954e327dfdf6db590af24fad5d4f))
- deserialize client config. ([1f82002](https://github.com/lowdefy/lowdefy/commit/1f820025445567c5f1f0f146c3a84941a5eece24))
- **docs:** Add AgGrid display block. ([107866b](https://github.com/lowdefy/lowdefy/commit/107866b54a0cb1b5e676cd8b05ea2b36bf544085))
- **docs:** Add AgGrid server-side filter and sort example ([1dff161](https://github.com/lowdefy/lowdefy/commit/1dff161e58ff636d1e98a1ecacf3cb500764e933))
- **docs:** Add GeolocationCurrentPosition action to the docs. ([bdd75c0](https://github.com/lowdefy/lowdefy/commit/bdd75c09efa566fcf4887249787ce5858888a8a8))
- **docs:** Add GoogleMaps block to docs. ([eab438a](https://github.com/lowdefy/lowdefy/commit/eab438a0fa7f52eecd220f2c70ad69192be3ece4))
- **docs:** Add Header, Content, Sider, Footer, Layout blocks docs ([d7798b0](https://github.com/lowdefy/lowdefy/commit/d7798b0927da9602c9f680dc7e38a731b113cea7))
- **docs:** Add more GoogleMaps examples. ([7109d65](https://github.com/lowdefy/lowdefy/commit/7109d65aad73f292a4d377605d2b94cc3c08b5e8))
- **docs:** Add PhoneNumberInput block to the docs. ([b7d539e](https://github.com/lowdefy/lowdefy/commit/b7d539ea34826d52be167314dd8c1b64585d3a30))
- **docs:** Add Skeleton blocks docs ([a96a985](https://github.com/lowdefy/lowdefy/commit/a96a98574fdeae8f80b9998c9a8563f76b8902bd))
- **docs:** Finalise AgGrid docs and update README. ([0024b34](https://github.com/lowdefy/lowdefy/commit/0024b34d33e4e645d252dea42d895c3751a87202))
- **docs:** Update GeolocationCurrentPosition action docs. ([5af8c1c](https://github.com/lowdefy/lowdefy/commit/5af8c1c5081672ef55145a43f8ad97720700f48c))
- **helpers:** Add additional serializer tests. ([76b4384](https://github.com/lowdefy/lowdefy/commit/76b4384492779a4dcc1a04bd61becd8895603262))
- Make refMap and keyMap. ([6ebcc73](https://github.com/lowdefy/lowdefy/commit/6ebcc73b89c8c7906ab45ad49e9294b0229e2b12))
- Rename nodeParser to serverParser and buildParser. ([0b61e5e](https://github.com/lowdefy/lowdefy/commit/0b61e5e5710084cc19bba4eb6de95c3a53beb4b9))
- **server-dev:** Add building config spinner. ([45fd3f3](https://github.com/lowdefy/lowdefy/commit/45fd3f39ef7d46163b16618a2712c33b1f78c8ac))
- **server-dev:** Ignore _k_ on rebuild check. ([32d89b1](https://github.com/lowdefy/lowdefy/commit/32d89b14755400b1858d8d1d8a1da2e5f32d9658))
- **server-dev:** Only watch package.json. ([cbb1bc6](https://github.com/lowdefy/lowdefy/commit/cbb1bc6ce930c8c1de9e7e5790c46e2d21ff21c7))
- Use _k_ and _r_ as non-ennumerables. ([60a83b8](https://github.com/lowdefy/lowdefy/commit/60a83b81111f4f5b01fc2dbd9ded0b2496cee7a7))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

### Bug Fixes

- **blocks-google-maps:** Fix typo in readme. ([4b9582d](https://github.com/lowdefy/lowdefy/commit/4b9582dad8c7f110b6f7ffa896bb70d07488461e))
- **blocks-google-maps:** Fix zoom not working when defaulting to use fitbounds. ([d272512](https://github.com/lowdefy/lowdefy/commit/d272512536be3a82f3578bb0ae36a584024e563b))
- **deps:** Update dependency knex to v2.4.2 ([e4b4942](https://github.com/lowdefy/lowdefy/commit/e4b4942a20f15f4b66c447253b01e0c39e283007))
- **docs:** Polish concepts pages ([9cfce96](https://github.com/lowdefy/lowdefy/commit/9cfce96f23f0304aa9ef4a38744a82323621e670))
- Fix docs generate sitemap transformer ([9cf4c1d](https://github.com/lowdefy/lowdefy/commit/9cf4c1d130f8c99d2eda420c68e0847bd76e6926))

### Features

- **blocks-google-maps:** Add ability to add Marker Clusterers to map. ([3b19b49](https://github.com/lowdefy/lowdefy/commit/3b19b496296ae2f1abdc4c1f604006c54d8a2568))
- **blocks-google-maps:** Add examples and descriptions of marker clusterers and new methods. ([8d5cf5f](https://github.com/lowdefy/lowdefy/commit/8d5cf5f99bca908f2c120989c083812ef1224c24))
- **blocks-google-maps:** Update google maps block schema. ([b6b6997](https://github.com/lowdefy/lowdefy/commit/b6b69971074526f21e581efa91e5e6542c02f15e))

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

### Bug Fixes

- **deps:** Downgrade dependency antd to v4.22.5 ([ec0d911](https://github.com/lowdefy/lowdefy/commit/ec0d911f40282a8445cea0de2268373aadd02bd4))

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

### Bug Fixes

- **deps:** Downgrade dependency antd to v4.24.5 ([8602e71](https://github.com/lowdefy/lowdefy/commit/8602e719bda786c84086dd13a73287cefea7812a))

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

### Bug Fixes

- Add public_default folder to server npm files ([2f1db67](https://github.com/lowdefy/lowdefy/commit/2f1db674f477026d2292d643140dc39b77809753))

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- \_user: true should return null if logged out. ([d9b89d7](https://github.com/lowdefy/lowdefy/commit/d9b89d77e2da4ecda11f3a56c168e98c0788d1f8))
- Add MongoDBAdapter docs. ([c609b25](https://github.com/lowdefy/lowdefy/commit/c609b25311af8b5df250fc27b56f2fbbe6e80d49))
- Allow axios data property to be an array ([9b83af5](https://github.com/lowdefy/lowdefy/commit/9b83af5e0fa0600ff39b1c317fbce7e5be2a17a0)), closes [#1158](https://github.com/lowdefy/lowdefy/issues/1158)
- Auth docs fixes ([0e7a013](https://github.com/lowdefy/lowdefy/commit/0e7a0133a78904be54de79327dd7eca327bf4ce5))
- **blocks-basic:** Update Anchor schema. ([7ce7d15](https://github.com/lowdefy/lowdefy/commit/7ce7d1588b97699c5a9d830cd765f5c413a972fb))
- **build:** Clean public folder before copying over folders. ([cd84268](https://github.com/lowdefy/lowdefy/commit/cd842683538a023cb83c93f76a36c4cb119240dc))
- **build:** Evaluate build operators before getting key from refDef. ([a9d873c](https://github.com/lowdefy/lowdefy/commit/a9d873c6b2e65ca538489e90bd92b1ed5d7945c4))
- **build:** More generic default 404. ([592a901](https://github.com/lowdefy/lowdefy/commit/592a9019c80e060d5beba9828a655748996ab2d6))
- **client:** Allow onClick to be passed down to Link component. ([718a352](https://github.com/lowdefy/lowdefy/commit/718a35259ac111cc385df098c069957095ff1413))
- **client:** Update how Link handles onClick. ([622ec8c](https://github.com/lowdefy/lowdefy/commit/622ec8cf94b111862098325629e69fbc3cd28123))
- **cli:** Use semver to validate version. ([13e5c45](https://github.com/lowdefy/lowdefy/commit/13e5c454bac5a82abbc1fff1f3553d7b51125e88))
- **cli:** Warn if user is running v3 app. ([4b62d09](https://github.com/lowdefy/lowdefy/commit/4b62d09a6df731574fd210e30dd907de9525fc3c))
- **connection-mongodb:** Fix responses, fix after and update user to meta ([485c0b7](https://github.com/lowdefy/lowdefy/commit/485c0b7c11418544d3f51eceab7e75273a65fb8e))
- **connection-mongodb:** Update MongoDBUpdateOne test ([1de6f7a](https://github.com/lowdefy/lowdefy/commit/1de6f7a0fa6a1fa384d2f85a2f8a90274ff35cac))
- **deps:** Dependencies minor version updates ([e50ec30](https://github.com/lowdefy/lowdefy/commit/e50ec30a8bf7dcd38d3ca4cbf68907935939f088))
- **deps:** Update axios to v1.2.2 (major version) ([18d725e](https://github.com/lowdefy/lowdefy/commit/18d725e9ff8b2d049ecd7182c1241553950e8d4f))
- **deps:** Update connection driver minor versions. ([bbd43c1](https://github.com/lowdefy/lowdefy/commit/bbd43c139efbb8559c279c1eea635512dbdc026c))
- **deps:** Update dep ora to v6.1.2 ([98afaed](https://github.com/lowdefy/lowdefy/commit/98afaedde508c42e5e573157bc78fe683cda4280))
- **deps:** Update dep uuid major version to 9.0.0 ([a88b974](https://github.com/lowdefy/lowdefy/commit/a88b97420098895905a784031673131581731558))
- **deps:** Update dependency @ant-design/icons ([497ff67](https://github.com/lowdefy/lowdefy/commit/497ff672a3f90c3fa00fa1d0839168a71702f456))
- **deps:** Update dependency antd to v4.24.7 ([1348a48](https://github.com/lowdefy/lowdefy/commit/1348a48f361168fa7eaa6b9c6dfa6f513dc139f4))
- **deps:** Update dependency fs-extra to v11.1.0 (major version) ([0f388d7](https://github.com/lowdefy/lowdefy/commit/0f388d7a977fb524467af8a8f6bc328076d7f47e))
- **deps:** Update dependency knex to v2.3.0 ([0918690](https://github.com/lowdefy/lowdefy/commit/09186907c86cdbc5331a8b0caeca44c59805ae58))
- **deps:** Update dependency mssql to 9.0.1 ([5016949](https://github.com/lowdefy/lowdefy/commit/5016949dd6557c914fc7ada768a0a4f1bf926bb3))
- **deps:** Update dependency query-string to v8.1.0 ([5602b37](https://github.com/lowdefy/lowdefy/commit/5602b373c84f6061520e65b2765d545202d3e796))
- **deps:** Update echarts and react-colorful minor versions. ([2ef3865](https://github.com/lowdefy/lowdefy/commit/2ef38653170d4b1f1feafbdf8073b698b2276de9))
- **deps:** Update emotion css dependencies. ([7cc5588](https://github.com/lowdefy/lowdefy/commit/7cc5588d5936e7514f2e2a3400ce18f98d92586d))
- **deps:** Update minor versions of util packages. ([2d7a2a5](https://github.com/lowdefy/lowdefy/commit/2d7a2a55c88f0ee33eff49e5ff541f6296ec4337))
- **deps:** Update patch versions of dependencies ([9edaef7](https://github.com/lowdefy/lowdefy/commit/9edaef7e1aa940ff8aa795e60c25fb6369244ca9))
- **deps:** Update react-icon and add support for new icon packs ([ae9cbf2](https://github.com/lowdefy/lowdefy/commit/ae9cbf23a331ce2945d9e2ff34a53210121c9134))
- **deps:** Update swr to v2.0.0 (major version). ([e16a39a](https://github.com/lowdefy/lowdefy/commit/e16a39a581034e1108ad45d39e26f73c43db7574))
- **docs:** Changed reference to request in DownloadCsv examples ([c81dc42](https://github.com/lowdefy/lowdefy/commit/c81dc42900ad7ddfee9922542022dbfe06451520))
- **docs:** Cleanup \_js references. ([f236a46](https://github.com/lowdefy/lowdefy/commit/f236a466c2a8d433893897b0f38184046f14bc48))
- **docs:** Fix \_object operator docs. ([8d1e10f](https://github.com/lowdefy/lowdefy/commit/8d1e10feb58e0e8638c89115466950ae43f7db84)), closes [#1339](https://github.com/lowdefy/lowdefy/issues/1339)
- **docs:** Fix syntax on Custom Styling Ant theme import example. ([b356f09](https://github.com/lowdefy/lowdefy/commit/b356f09779e3ad78e6e85035db59fbbfc9737c7b))
- **docs:** Fix typo ([fe9cba1](https://github.com/lowdefy/lowdefy/commit/fe9cba12056c502eaac33edeed0714afd4b8b360))
- **docs:** Make environment variables lowercase. ([bafc31d](https://github.com/lowdefy/lowdefy/commit/bafc31d6dde5558f5ef0025955a7cb9b326f3f06))
- **docs:** Minor fixes to requests and connections. ([f321396](https://github.com/lowdefy/lowdefy/commit/f321396e2a95f015ba31eb963a88639c712dbfa4))
- **docs:** Page and App State docs wording fixes. ([6de0792](https://github.com/lowdefy/lowdefy/commit/6de07926700a712d3a3d607e7f421ccf853f9849))
- **docs:** Revert pnpm-lock file changes. ([6dbcdb5](https://github.com/lowdefy/lowdefy/commit/6dbcdb58656dc5e6d004c7c6f14db5b52da6ddaf))
- **docs:** Update block docs. ([44a838f](https://github.com/lowdefy/lowdefy/commit/44a838f254cd99607a3813a2b3d4c44838ff1542))
- **docs:** Update custom code section. ([3d29cd6](https://github.com/lowdefy/lowdefy/commit/3d29cd688813ec58a7ca02c8d72af61032675e6e))
- **docs:** Update MongoDB docs with log collection info ([8e302b9](https://github.com/lowdefy/lowdefy/commit/8e302b9783052bf98af7e52fc5b51672f55efb42))
- **engine:** Fix validation when using a dynamic approach to setting required. ([14ae1db](https://github.com/lowdefy/lowdefy/commit/14ae1db166f4abe972f084f8d9646a925020b8bc))
- **engine:** Remove unnecessary props spreading. ([7ebf2ce](https://github.com/lowdefy/lowdefy/commit/7ebf2ced7cb99c68450cad633c31dd3f4f9032aa))
- **engine:** Update createLink error message test. ([d434d9e](https://github.com/lowdefy/lowdefy/commit/d434d9ee448cc101eab406201986d7ceddce8c76))
- **engine:** Update Link to allow use of href. ([d00344a](https://github.com/lowdefy/lowdefy/commit/d00344adf2c36291878abb87b725893327853012))
- Fix auth doc page paths ([e4bbdaf](https://github.com/lowdefy/lowdefy/commit/e4bbdafbc08e0c3e72c6933dd65e330e1bd1d341))
- Fix jest testsfor es modules in operators and utils packages ([e239727](https://github.com/lowdefy/lowdefy/commit/e239727d1e9b74cd8945037cee462f8ec4afcdb3))
- Fix pnpm lock file ([fcfb4cc](https://github.com/lowdefy/lowdefy/commit/fcfb4cc57f3cd3d6c45ded617c976618bff71d52))
- Remove copy plugins folder functionality ([6c5e35f](https://github.com/lowdefy/lowdefy/commit/6c5e35f68d2c179f980107193fd279272d9edc08))
- Rename copyDirectory util to copyFileOrDirectory. ([b7d3884](https://github.com/lowdefy/lowdefy/commit/b7d38844c8e29cafa0d29852d034e391b8dfdf9d))
- Reset server package.json to original version on CLI start. ([6fac2aa](https://github.com/lowdefy/lowdefy/commit/6fac2aabc8a8e4d95e6ad0922ff3b82f73427a30))
- **server-dev:** Rename public folder to public_default. ([4bb4285](https://github.com/lowdefy/lowdefy/commit/4bb4285bc5c66fbf19c083618b73871278894253))
- **server:** Rename public folder to public_default. ([506cdda](https://github.com/lowdefy/lowdefy/commit/506cddac5384a5c6ed2ccba33aba4a58ef0cfaf5))
- **tests:** Fix jest mocks for es modules in connections. ([e3fadb2](https://github.com/lowdefy/lowdefy/commit/e3fadb2e4fe3bb4948b5f12a752f9356f20e8eb7))
- **tests:** Fix jest tests for es modules. ([0dc3bed](https://github.com/lowdefy/lowdefy/commit/0dc3bede2f7f3e4bb9096fcfe43da7c43fd4f7b5))
- Updates to page and app state docs. ([79ca911](https://github.com/lowdefy/lowdefy/commit/79ca91189fc2d9fb11e311c803b929b68709fdd4))
- **website:** Add images to public folder. ([5112d6d](https://github.com/lowdefy/lowdefy/commit/5112d6d5bf17c7d1452467e889f378b3ceb94268))
- **website:** Update footer layout and styling. ([ec1b0ac](https://github.com/lowdefy/lowdefy/commit/ec1b0ac5e6ecfbd41c137a7628751b6e31423491))
- **website:** Update package.json. ([5cfff35](https://github.com/lowdefy/lowdefy/commit/5cfff352b93631dd86ec75f7dab0aed09370df31))

### Features

- Add auth configuration docs. ([8ec89ce](https://github.com/lowdefy/lowdefy/commit/8ec89ce66e2265ee4d95dc676f8ed066feef3404))
- Add Auth0LogoutCallback documentation. ([3fd174d](https://github.com/lowdefy/lowdefy/commit/3fd174d47ff69bc6b6a1e6329f4b0359f9771cb4))
- Add init-docker CLI command and docker docs ([d27975b](https://github.com/lowdefy/lowdefy/commit/d27975b52373b5bded837bb6d5202fe06ab8630d))
- Add init-vercel CLI command and Vercel deployment docs. ([408e21a](https://github.com/lowdefy/lowdefy/commit/408e21a1af4052af2fb16c335378977f70e0451b))
- Add next auth default provider docs. ([9c06de0](https://github.com/lowdefy/lowdefy/commit/9c06de019d03b18273c72cd5c80d7ee6bc05d4a3))
- Add OpenIDConnectProvider docs ([200182f](https://github.com/lowdefy/lowdefy/commit/200182fb1d123ea6ede2a60ef975dde4ce37db56))
- Add user object docs. ([6c8ed5f](https://github.com/lowdefy/lowdefy/commit/6c8ed5fcdb3c5c5e23194416834a0e81097f8cc1))
- **deps:** Update dependency stripe to v11.5.0 (major version) ([7669ed5](https://github.com/lowdefy/lowdefy/commit/7669ed5517840fbb0d10eb10f102b37be8ef355c))
- **docs:** Add build note to all build operator pages. ([cff4233](https://github.com/lowdefy/lowdefy/commit/cff4233fb73a172cdde423bd124ae4f57b5d2f73)), closes [TECHMRM/lowdefy#46](https://github.com/TECHMRM/lowdefy/issues/46)
- **docs:** Add Custom Styling Concept page. ([1aad894](https://github.com/lowdefy/lowdefy/commit/1aad894956ca70425712e01cb56546075d7dbbc9))
- **docs:** Add Page and App State concept page. ([52dce71](https://github.com/lowdefy/lowdefy/commit/52dce71496bcdd05e677d575a2fcd328c177f3c4))
- **docs:** Add v3 to v4 migration guide page to the docs. ([d7f6128](https://github.com/lowdefy/lowdefy/commit/d7f6128f831ff6b33bb5ced3a5a5594ae28327fe))
- **docs:** Added DownloadCsv and PdfMake docs ([72f8a83](https://github.com/lowdefy/lowdefy/commit/72f8a83d8cbb1efaece083be6011fc86178fdea8))
- **docs:** Create build operator docs. ([2ea77e3](https://github.com/lowdefy/lowdefy/commit/2ea77e3eadf5bc6066b20ad6e56db20c7e6d1fce))
- **docs:** Remove all context references in docs. ([b316753](https://github.com/lowdefy/lowdefy/commit/b3167531b5db35c45a1265e7c0cc72ea7a466dbc))
- **docs:** Remove old context and state page. ([4392222](https://github.com/lowdefy/lowdefy/commit/439222255a2cf4fd499852bb9a957612849772ab))
- **docs:** Update \_build descriptions and examples. ([31236ae](https://github.com/lowdefy/lowdefy/commit/31236ae7fe48fdbe7db90bbd9f3c53bb39af52d4))
- **docs:** Update build operator concept description. ([e6f8caa](https://github.com/lowdefy/lowdefy/commit/e6f8caaf27896782e0f67750b7cb0b0a5a4f48b1))
- **docs:** Update context-and-state page references. ([aeab7ea](https://github.com/lowdefy/lowdefy/commit/aeab7ea6cf44381133c4db3de29efce7f1d51a57))
- **docs:** User docs intro, protected pages and roles sections ([4a59107](https://github.com/lowdefy/lowdefy/commit/4a5910727accf23826e161ae9eda05368c904310))
- Update CLI docs ([28ac5c5](https://github.com/lowdefy/lowdefy/commit/28ac5c58acfb3933a32df1a3fe0012db1f7bb7df))
- Update dependency next-auth and add new providers. ([ca72d8c](https://github.com/lowdefy/lowdefy/commit/ca72d8c87b50651c701ea619a5e061210adf3e53))
- Updates to login and logout documentation ([4236023](https://github.com/lowdefy/lowdefy/commit/4236023102e227806ebaa8eb9175f2ceecb5965f))
- **website:** Add build_internal section to home page. ([2a57e34](https://github.com/lowdefy/lowdefy/commit/2a57e347a0c795fe298a90e15436e7b7541249b1))
- **website:** Add build_uis section to home page. ([71cc0e9](https://github.com/lowdefy/lowdefy/commit/71cc0e902eff25a606a816e2f6771e3669f115e6))
- **website:** Add connect section to home page. ([8034b32](https://github.com/lowdefy/lowdefy/commit/8034b32b0bea65b8431078eea67c4238634424d9))
- **website:** Add create_app section to home page. ([8ff9344](https://github.com/lowdefy/lowdefy/commit/8ff9344fe2696e96f93999f8336de284b1e7cd3d))
- **website:** Add create_faster section to home page. ([d296a81](https://github.com/lowdefy/lowdefy/commit/d296a81a67fd85b20435f6374348a2e971377101))
- **website:** Add customers section. ([2a622e3](https://github.com/lowdefy/lowdefy/commit/2a622e329ae8e453aa3a4a70b72c84db41cd5b22))
- **website:** Add examples section to home page. ([4660508](https://github.com/lowdefy/lowdefy/commit/466050882027f7170e47a8719f60f5be0961e008))
- **website:** Add footer to home page. ([3f2ff58](https://github.com/lowdefy/lowdefy/commit/3f2ff58e3ebd8c84874fe9013bb9507215edda40))
- **website:** Add give_it_a_try section to home page. ([0340d70](https://github.com/lowdefy/lowdefy/commit/0340d7055f97456534918453fd5f9db2ed193f32))
- **website:** Add header to home page. ([688834b](https://github.com/lowdefy/lowdefy/commit/688834b4697bb372e8c6e4fae68e8ff509123862))
- **website:** Add images to website public folder. ([0e5d191](https://github.com/lowdefy/lowdefy/commit/0e5d1919dcb31d9659c66da7a548b4786c166121))
- **website:** Add lowdefy website to repo. ([fc7c87b](https://github.com/lowdefy/lowdefy/commit/fc7c87bd6e9121b975c5bfa20c0d56ce8c771c7f))
- **website:** Add open_source section to home page. ([d860580](https://github.com/lowdefy/lowdefy/commit/d8605800d68d4402a86eb19538ae74b04c3d1611))
- **website:** Add styles.less file to website. ([b30a825](https://github.com/lowdefy/lowdefy/commit/b30a825d1d92217296ea81ca9927912efdafb814))
- **website:** Fix menu for mobile. ([5f95958](https://github.com/lowdefy/lowdefy/commit/5f95958c2b4b75f5a5a43414e9ad34ba04321b2b))
- **website:** Polish 3 sections and add connections. ([822a758](https://github.com/lowdefy/lowdefy/commit/822a75871d350999a3de48339bae2d66575a8cca))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

### Bug Fixes

- Add next config todo note ([1b9e7b9](https://github.com/lowdefy/lowdefy/commit/1b9e7b979198dcdfd9ddb2d5b5a896d0df7a7611))
- **blocks-color-selectors:** Fix color selector state bug. ([f10be2d](https://github.com/lowdefy/lowdefy/commit/f10be2db44e91772acb50ba343669cf86e820593))
- **build:** Remove validateConfig theme config default. ([8b0c02b](https://github.com/lowdefy/lowdefy/commit/8b0c02b1dbba05ca8c5a56bc7b5c927a6db5cf0e))
- **docs:** Add lowdefy_app_schema.png ([f5a583b](https://github.com/lowdefy/lowdefy/commit/f5a583bf3b250d0b56d1cd4681872d6f8bb275ea))
- Docs introduction updates and fixes. ([57b3e93](https://github.com/lowdefy/lowdefy/commit/57b3e935e860587a2b69391aac324601a9f64df9))
- **docs:** Change Additional Page to Data Display Page. ([fafa178](https://github.com/lowdefy/lowdefy/commit/fafa178269045db9fe30d99b804558ff83657243))
- **docs:** Changed feedback anchors to boxes ([8f407ac](https://github.com/lowdefy/lowdefy/commit/8f407ac73a38d5859d33c912f458de4610aab792))
- **docs:** Fix typo. ([a01b4b9](https://github.com/lowdefy/lowdefy/commit/a01b4b982d10991e995c3b93a6973d2211a27b44))
- **docs:** Next for tutorial-start. ([e7de18b](https://github.com/lowdefy/lowdefy/commit/e7de18baee7e6445dc9a6e986be0589126a524e6))
- **docs:** Not renaming throw to break. ([a9ce920](https://github.com/lowdefy/lowdefy/commit/a9ce920919b6d1d4189ced072e88fabde7db5d55))
- **docs:** Simplify step titles. ([ade6016](https://github.com/lowdefy/lowdefy/commit/ade601674ad617165a4caba1e0335dc346a18d91))
- **docs:** Small fixes to v4 tutorial pages. ([9654eef](https://github.com/lowdefy/lowdefy/commit/9654eef9a0e0ece57d5e66f6400d8265e9346466))
- **docs:** Small grammar changes on introduction page. ([2185f7c](https://github.com/lowdefy/lowdefy/commit/2185f7c393e3cb32cf216ae86ec4d59f0b1a25a3))
- **docs:** Small grammar changes on overview concept page. ([d7f5f95](https://github.com/lowdefy/lowdefy/commit/d7f5f958bb5326e80b79cad66c7c811233af2893))
- **docs:** Update example tutorial code repo links. ([96399a2](https://github.com/lowdefy/lowdefy/commit/96399a2f88c7c58f5e0d8d837f92ffad1791ecf2))
- **docs:** Update overview page. ([89863fc](https://github.com/lowdefy/lowdefy/commit/89863fc7b13f4acb5a505ef5ec46d2922d92fbeb))
- **docs:** Update the introduction page for v4. ([d0cee2d](https://github.com/lowdefy/lowdefy/commit/d0cee2d77ddcf5a84e9eb41283c1128170870c47))
- **docs:** Update tutorial to reference pnpm instead of npm. ([03779d5](https://github.com/lowdefy/lowdefy/commit/03779d5cfac0a1aa60c314008ea9419ede966cff))
- **docs:** Updated moment operator description ([875f0ae](https://github.com/lowdefy/lowdefy/commit/875f0aeb8da33e7a316840835896c08db2431845))
- Fix broken ref in docs ([10cdb56](https://github.com/lowdefy/lowdefy/commit/10cdb561c6e9c7078bab4af09b20d2da762d9f4b))
- Fix watch path CLI config for relative paths. ([54a5440](https://github.com/lowdefy/lowdefy/commit/54a54409dc5e123c5d1d875770873c72826eec90))
- **operators-js:** Add null as valid type to string operator methods. ([2d9903b](https://github.com/lowdefy/lowdefy/commit/2d9903b97359fe4609d33676f0d3bac3357f06b9))
- **operators-js:** Set operators-js tests to use UTC timezone ([8bc1341](https://github.com/lowdefy/lowdefy/commit/8bc1341cd0318b00143036e54daf5d959e928477))
- **operators-js:** Update \_string tests. ([62890b1](https://github.com/lowdefy/lowdefy/commit/62890b1b96f77913e7b352b65f3b43e48224818e))
- **operators-js:** Updated parse and UTC in date operator ([b890455](https://github.com/lowdefy/lowdefy/commit/b8904559fccd15a1851051a1e3d8284b28f84553))
- **plugin-aws:** s3-upload-blocks readme update. ([cede9eb](https://github.com/lowdefy/lowdefy/commit/cede9eb77d6a44db89486ecc68ff22d06ee2d568))

### Features

- Add output standalone config to next config for docker deployments ([ac662fe](https://github.com/lowdefy/lowdefy/commit/ac662fefbeae43e01ab63c2f7b81dab51179a6ad))
- Add support for user defined style files ([d33049b](https://github.com/lowdefy/lowdefy/commit/d33049b1b95f6bc84c9b91c2d15b92601210615e))
- **docs:** Add updated tutorial for v4. ([7b9cb77](https://github.com/lowdefy/lowdefy/commit/7b9cb7798503463120ba730c81d6e0ae6ba46fd5))
- **docs:** Added intl operator doc ([924f7fa](https://github.com/lowdefy/lowdefy/commit/924f7fa4d7b5c47765184bc72f9d3a4b7e410d40))
- **docs:** Added moment operator doc ([4c8540b](https://github.com/lowdefy/lowdefy/commit/4c8540b711c7773e48d01b05c2040fdef5016e46))
- **docs:** Rename some tutorial files and minor fixes. ([0b1122d](https://github.com/lowdefy/lowdefy/commit/0b1122d9687a15673f2cfae030df09e6092fe9ca))
- **docs:** Update tutorial-start. ([200bcb0](https://github.com/lowdefy/lowdefy/commit/200bcb0429680f374afcf51bf0a770a956bf08a4))
- **docs:** Updated date operator doc with more methods ([fb423d7](https://github.com/lowdefy/lowdefy/commit/fb423d7307141bba482dd3a837530abd5501e76f))
- **operators-js:** Updated date operator with more methods and tests ([d19cf2e](https://github.com/lowdefy/lowdefy/commit/d19cf2eccc2d425e5825e88744b3c7359a9fc923))
- **plugin-aws:** Add README for S3 Upload Blocks. ([e8d462f](https://github.com/lowdefy/lowdefy/commit/e8d462f5455da4adb67e9150d499d471e5044f72))
- **plugin-aws:** Make s3 blocks available for use. ([26c4d15](https://github.com/lowdefy/lowdefy/commit/26c4d15c3cfa0220b2c783592f36ebdb5e32c334))
- **plugin-aws:** Update s3-upload-blocks. ([55eda89](https://github.com/lowdefy/lowdefy/commit/55eda89d24a5169cb17a8742199ce67e8d3eab78))
- **plugin-next-auth:** Add OpenIDConnectProvider. ([abbc62a](https://github.com/lowdefy/lowdefy/commit/abbc62aebbfa00596e941bcf1d0f3f71522bdca0))
- **plugin-next-auth:** Update OpenIDConnectProvider. ([c5fdeb7](https://github.com/lowdefy/lowdefy/commit/c5fdeb7fa7df882f9cedcc07f80af8743471a1b3))
- Remove support for config.theme.lessVariables ([53a6931](https://github.com/lowdefy/lowdefy/commit/53a693146d1299cff45c81dcefa1315d530b7d98))
- Updates to overview page. ([936159c](https://github.com/lowdefy/lowdefy/commit/936159cfc0762837fb1dd7a4e427d51e507f7831))

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

### Bug Fixes

- **blocks-antd:** DateTimePicker to use onSelect for better UX. ([6ea10cc](https://github.com/lowdefy/lowdefy/commit/6ea10cc437399c78f781746320e5f5d23cb6c2dd))
- **blocks-antd:** Import tooltip styles on Paragraph and Title for copy. ([ec3ad08](https://github.com/lowdefy/lowdefy/commit/ec3ad0876f4a31d6ee8cad708d9a807439326bb4))
- **blocks-qr:** Don't call start and stop if scanner is not running. ([2e6c1fe](https://github.com/lowdefy/lowdefy/commit/2e6c1fe3017a4e36ea50922c2ff569ad275e261c))
- **build:** Include operators-moment as default in build. ([633bcf9](https://github.com/lowdefy/lowdefy/commit/633bcf989bafcfd916c97f7b98b8ec654d17b338))
- Fix Radio Selector not working for non-label/value fields. ([f3897c7](https://github.com/lowdefy/lowdefy/commit/f3897c7b63aa30d7b77953ba80e95ce31384b367))

### Features

- **blocks-antd:** Add parser property to NumberInput. ([95fbf13](https://github.com/lowdefy/lowdefy/commit/95fbf1301a59393d693b4f6480596ee17897b9c5))
- **blocks-antd:** Add parser to NumberInput schema file ([88aabdf](https://github.com/lowdefy/lowdefy/commit/88aabdfe08d530467898ed485d42d52a7de7e132))
- **build:** Add operators-moment to generateDefaultTypes ([1e869ad](https://github.com/lowdefy/lowdefy/commit/1e869ad45af7d2e84319a6170c8d0ec735be957e))

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

### Bug Fixes

- **api:** Fix readConfigFile tests. ([f2591f2](https://github.com/lowdefy/lowdefy/commit/f2591f29775d3b669fb553ebb9dd9a7e75faa002))
- Cache API file reads across all requests. ([2b90efb](https://github.com/lowdefy/lowdefy/commit/2b90efb041cf43e5344c5f2f5a8630ae06c8aad6))
- **helpers:** Update cachedPromises tests. ([335409e](https://github.com/lowdefy/lowdefy/commit/335409e4a470a6f0ed9906c903d129d1d7eef67e))

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

### Bug Fixes

- **api:** Fix "too many files open" error in api. ([b2d0b63](https://github.com/lowdefy/lowdefy/commit/b2d0b63cceac0b2b3dc870a8b435c6f187ff7a5a))

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

### Bug Fixes

- **blocks-aggrid:** Add valueType to input blocks. ([89a8d55](https://github.com/lowdefy/lowdefy/commit/89a8d55bdf2cec262e3ea3e487ed6fba41be3bec))
- **blocks-antd:** Breadcrumb should not render defaultTitle as label. ([a8762f0](https://github.com/lowdefy/lowdefy/commit/a8762f05a17e086b8e4ee62e1a67e9b0d46c64a7))
- **blocks-antd:** Fix breadcrumb icon size bug. ([c3b022f](https://github.com/lowdefy/lowdefy/commit/c3b022fd9fb67100f9cb5039500b0e9063930053))
- **build:** Fix dynamic import of \_ref resolvers and transformers. ([aaa6f55](https://github.com/lowdefy/lowdefy/commit/aaa6f558029e173d44cbe7b7ac64ecff5d6cc96c))
- **docs:** Add format operator change to migration guide. ([deee945](https://github.com/lowdefy/lowdefy/commit/deee945b5fab1ed6716824ed01a04de94dc99b50))

### Features

- **api:** Pass blockId, requestId, pageId and parsed payload to requests. ([edc25ef](https://github.com/lowdefy/lowdefy/commit/edc25efc3cbb0d61ddfdf7ac13275a66321a2a8a))
- **connection-mongodb:** Add changeLog to connection and requests. ([8e3a0b9](https://github.com/lowdefy/lowdefy/commit/8e3a0b9bc84a410f6dcf2954ba62d3e231a53672))

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/lowdefy

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

### Bug Fixes

- **buiid:** Add authPages to ldf schema. ([814b474](https://github.com/lowdefy/lowdefy/commit/814b4747da03cfe941010d558070f814d0f66a86))
- **docs:** Add links to relevant pages on Connections and Requests concept page. ([d611ea5](https://github.com/lowdefy/lowdefy/commit/d611ea5901b9c9e552b83c41f6a7f5b674515f34))

### Features

- **docs:** Add working example to Connections and Requests concept page. ([a567a35](https://github.com/lowdefy/lowdefy/commit/a567a35ec213aa1507de4303f9c2423efc503e64))

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

### Bug Fixes

- **docs:** Fix Refernces and Templates wording. ([d9ad6e0](https://github.com/lowdefy/lowdefy/commit/d9ad6e012a786eeb90ec2e938dd465040c158fb1))
- **docs:** Update docs build script. ([6b2ace3](https://github.com/lowdefy/lowdefy/commit/6b2ace32fe406daf8879d6de282a38e7dfcdd652))
- Fix server pnpm installs. ([c7be221](https://github.com/lowdefy/lowdefy/commit/c7be22150ed14afcb8b6508bd771112a542e0a26))

### Features

- Add the abilty to get a key from a reference JSON or YAML file. ([192267e](https://github.com/lowdefy/lowdefy/commit/192267ef716df1997a998a923e8b050aa5b86d35))
- **api:** Map nextAuthConfig.pages. ([0798d39](https://github.com/lowdefy/lowdefy/commit/0798d393c65bd22ece769be7d56d456d07b3b74b))
- **docs:** Add References and Templates use cases. ([1ee298e](https://github.com/lowdefy/lowdefy/commit/1ee298ee370bac30e1189237d5cf9ccb69a5fac3))
- **docs:** Update References and Templates concept page. ([9468acf](https://github.com/lowdefy/lowdefy/commit/9468acfa6e458bb72216e485b520fa0cf37d8cb4))
- Rename \_var name param to key for consistency ([d5bda68](https://github.com/lowdefy/lowdefy/commit/d5bda6876a52cd97fcdaac62c8aa3b99085bc3d5))

### BREAKING CHANGES

- The \_var operator ‘name’ param has been renamed to ‘key’ to be more consistent with other getter operators.

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/lowdefy

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

### Bug Fixes

- Fix CLI tests failing due to pnpm. ([d95524a](https://github.com/lowdefy/lowdefy/commit/d95524ad6b4e37452176cf1aaa046269daf2ba53))
- Update Wait action tests to be more robust. ([b2c559c](https://github.com/lowdefy/lowdefy/commit/b2c559c7edf5d01b30d10268ad2e6c35006b6718))

### Features

- Add additional migration guide notes. ([45eae2c](https://github.com/lowdefy/lowdefy/commit/45eae2cbb0845981ead2cc76028925a0f7b1372e))
- Change CLI to use pnpm as package manager. ([e9d7d73](https://github.com/lowdefy/lowdefy/commit/e9d7d73aed2fc9d40699210f2f8846df0170d481))
- Update the V4 migration guide. ([e05e424](https://github.com/lowdefy/lowdefy/commit/e05e424a1851da6cbf40f91f4a6d9628f1a7421d))

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

### Bug Fixes

- **blocks-antd:** Cleanup styles objects. ([c771cc9](https://github.com/lowdefy/lowdefy/commit/c771cc9a339a14b2f30dac65253f1b46178bba7d))
- **blocks-antd:** Fix issues in PageHeaderMenu and PageSiderMenu. ([81668f0](https://github.com/lowdefy/lowdefy/commit/81668f0e8a9452077c861fdc71cc40257de44bcc))
- **server:** Move viewport setting to the \_document. ([4471e49](https://github.com/lowdefy/lowdefy/commit/4471e499cd384491df493c0be6095e27af3a003b))
- **server:** Set page viewport. ([9c05a6d](https://github.com/lowdefy/lowdefy/commit/9c05a6d8d7cc16c723089c6499005945fc2a5aaa))

### Features

- **blocks-antd:** Add logo.srcMobile and logo.breakpoint properties. ([21bbeab](https://github.com/lowdefy/lowdefy/commit/21bbeabc2ce7b8cd81fd9904bc4a0735b4afdd9d))

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

### Bug Fixes

- **actions-core:** Change geolocation test values. ([f8c68ff](https://github.com/lowdefy/lowdefy/commit/f8c68ffe60913efb0292a01cd826239b723a922f))
- **actions-core:** Change res to position. ([0bcf8c2](https://github.com/lowdefy/lowdefy/commit/0bcf8c293b2b6b70c8e8221f6ba5508c436147fa))
- **blocks-aggrid:** Import all input types. ([06f753e](https://github.com/lowdefy/lowdefy/commit/06f753ef0dc821ec9f62617b28109e56d3e62347))
- **blocks-qr:** Change formatsToSupport enum to handle strings. ([7794dee](https://github.com/lowdefy/lowdefy/commit/7794deed9e63bcd281a7fa61ce101f31f3a7f1bb))
- **build:** Add additional default types. ([9f42115](https://github.com/lowdefy/lowdefy/commit/9f421151fd67d2d0c7985b38343472454bc8332b))

### Features

- **actions-core:** Add GeolocationCurrentPosition action. ([b55f529](https://github.com/lowdefy/lowdefy/commit/b55f529d3476d4640a7fb539a3276d431dca8f80))
- **blocks-qr:** Add inactiveByDefault property to README and schema. ([cb4b780](https://github.com/lowdefy/lowdefy/commit/cb4b780187346c167ced524eea1d1d149549ee79))
- **blocks-qr:** Add QRScanner block. ([5778234](https://github.com/lowdefy/lowdefy/commit/5778234f366a030d055f0e1a604cfa27f47617ac))
- **blocks-qr:** Update README and schema for QRScanner. ([53f216d](https://github.com/lowdefy/lowdefy/commit/53f216d0b8631ba322a75d096e487276cdac0e8e))
- **dosc:** Update Connections and Requests concept page. ([97d1d76](https://github.com/lowdefy/lowdefy/commit/97d1d764505e2c23bfcbf67116271b2ab8a853f0))
- **plugins:** Add actions-pdf-make. ([f9b30e4](https://github.com/lowdefy/lowdefy/commit/f9b30e45dc1672dbb0314e65dd5c7428720a4b13))
- **plugins:** Add plugin-auth0. ([10a6206](https://github.com/lowdefy/lowdefy/commit/10a6206f93bf5a78e90b5c3659a64bc08132bdc1))
- **plugins:** Add plugin-csv. ([403eb15](https://github.com/lowdefy/lowdefy/commit/403eb150f51efe478959ba93c16c6bb2554024ae))

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

### Bug Fixes

- **blocks-antd:** Add class for feedback icon margin. ([1e29169](https://github.com/lowdefy/lowdefy/commit/1e29169774e9c70295573bc5051ee91aaeb5e5be))
- **blocks-antd:** Fix autocomplete bug when option is selected. ([2c02f08](https://github.com/lowdefy/lowdefy/commit/2c02f088e592b3a3cd1c48e22a515e655cddc098))
- **blocks-antd:** Fix feedback icon classes so that correct color is shown. ([c1f9b7d](https://github.com/lowdefy/lowdefy/commit/c1f9b7d8e61bfffa3e643955ef8d44468885babd))
- Fix extra bouncing when changing from displaying feedback to displaying extra. ([f5b70a4](https://github.com/lowdefy/lowdefy/commit/f5b70a4e371d01632a75d015ac18ab42a7901e62))
- Log server install output at debug level. ([c77a220](https://github.com/lowdefy/lowdefy/commit/c77a2205c6cc10a7f6e282f02ac787ee13ea4bb9))
- Revert back to ant classes. ([8bdcfd5](https://github.com/lowdefy/lowdefy/commit/8bdcfd54d42dcffa57a88aaaafc00c6bbbdec850))
- **server-dev:** Fix server dev file watchers. ([7e3fedd](https://github.com/lowdefy/lowdefy/commit/7e3feddffe017edefcc325a8a146918318a8b329))

### Features

- **blocks-antd:** Add default suffix icon to date selectors. ([997fae8](https://github.com/lowdefy/lowdefy/commit/997fae855d901b36f2fe3e637b2b38ac7193158d))
- **blocks-antd:** Add feedback classes for corresponding colors. ([230570b](https://github.com/lowdefy/lowdefy/commit/230570b0008dfc627b85205d22545ae5f728e7ed))
- **blocks-antd:** Add feedback icon to TextInput and Selectors. ([f7f78e9](https://github.com/lowdefy/lowdefy/commit/f7f78e9aece55b5da3aa95c70b2a8a694db2487a))
- **blocks-antd:** Add feedback icon to WeekSelector. ([2719887](https://github.com/lowdefy/lowdefy/commit/2719887bde4019e109e0e57157389ecc48467fc8))
- **blocks-antd:** Add status to input components. ([91f7532](https://github.com/lowdefy/lowdefy/commit/91f753242b640c3722ef922632e77c5a23d2640b))
- **blocks-antd:** Change content to use named args. ([832f68c](https://github.com/lowdefy/lowdefy/commit/832f68c671e23c30f960792c8dd91164c6742f6a))
- **blocks-antd:** Change feedback icon to be added in label. ([91a1e8b](https://github.com/lowdefy/lowdefy/commit/91a1e8b5e44d8f0e3f7cbc4e945f5dca063de8db))
- **blocks-antd:** Cleanup AutoComplete. ([8732368](https://github.com/lowdefy/lowdefy/commit/8732368ac140a6c9782de942ef66d3b348651b3e))
- **blocks-antd:** Fix autocomplete bugs. ([71523cb](https://github.com/lowdefy/lowdefy/commit/71523cba4365b00ca7d1243a5f36ab77b4b073dc))
- **blocks-antd:** Replace ant feedback classes. ([51ba949](https://github.com/lowdefy/lowdefy/commit/51ba94947fd6b836408ba0dd2cc0fa7d9d42be62))

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

### Bug Fixes

- Clean up files. ([eaf6bde](https://github.com/lowdefy/lowdefy/commit/eaf6bde3364e24cc5fce949ad03b9db2c779ea6e))
- **cli:** Fix CLI print tests. ([fd8345e](https://github.com/lowdefy/lowdefy/commit/fd8345e5dee20b993662e2990850dd543acd3cb6))
- **cli:** Improve CLI options specification. ([6d550fd](https://github.com/lowdefy/lowdefy/commit/6d550fd4620cde2ded905c3946ed86500c3efed5))
- **cli:** Remove dependency chalk. ([aebe925](https://github.com/lowdefy/lowdefy/commit/aebe925ea61ba10109b1c59e79cbe12fbce1840e))
- **deps:** Update dependency commander to v9.4.0. ([e2cd7d6](https://github.com/lowdefy/lowdefy/commit/e2cd7d6aecb6f0d0f4d7c6a15571010b8acc1237))
- Fix dev server auth api route. ([a51af68](https://github.com/lowdefy/lowdefy/commit/a51af68e6291eea9185f65425e480ace6a269103))
- **server-dev:** Remove build retries. ([c27ff36](https://github.com/lowdefy/lowdefy/commit/c27ff36e174f085d00bc0c76f2e2c3d8d2ad9bd2))
- **server-dev:** Simplify server-dev manager code. ([e4101d0](https://github.com/lowdefy/lowdefy/commit/e4101d019b47d8cf1d5065116f003bcdf8a38fdf))

### Features

- Cleanup dev server logs. ([27a22c8](https://github.com/lowdefy/lowdefy/commit/27a22c8d34b822268a834704fe9c022397180386))
- CLI output improvements. ([f00bb9b](https://github.com/lowdefy/lowdefy/commit/f00bb9b32e03e77ef1ef19c69055da4b05880cd8))
- **cli:** Add log level option. ([5903c8e](https://github.com/lowdefy/lowdefy/commit/5903c8e4165334eb31f80580c3816a34ac36592d))
- **cli:** Imporve build and start command output. ([f721792](https://github.com/lowdefy/lowdefy/commit/f721792ba9bafd00c8b126ae0ed86c1523025c15))
- **cli:** Throw if Lowdefy CLI is run with node < v14. ([4a99337](https://github.com/lowdefy/lowdefy/commit/4a9933798e304ce0b00bab8b85b851b90dfc2d96))
- **docs:** Add nunjucks date filter example. ([c4df77d](https://github.com/lowdefy/lowdefy/commit/c4df77d0b2bdeb1280db4f315a975952f09d27ef))
- **docs:** Update Events and Actions concept page. ([eb61475](https://github.com/lowdefy/lowdefy/commit/eb614758df9c5036d24ce224142dda3c60172021))
- **docs:** Update Menus concept page. ([0f8e3eb](https://github.com/lowdefy/lowdefy/commit/0f8e3ebcba1315a5f14cec4a02cd6f8426f948e2))
- **docs:** Update Secrets concept page. ([f0bddb8](https://github.com/lowdefy/lowdefy/commit/f0bddb86e11e71b9705c231eba66a8d71c8cdf56))
- Improved logging WIP. ([0bbf19d](https://github.com/lowdefy/lowdefy/commit/0bbf19d69926440930995d457514544608ec5b5b))
- **server-dev:** Do not stop process if initial build fails. ([506cbeb](https://github.com/lowdefy/lowdefy/commit/506cbeb090b130cacbbb923aa0fa8d0e3a48ad5a))

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

### Bug Fixes

- Add additional operator tests. ([ddf8e51](https://github.com/lowdefy/lowdefy/commit/ddf8e51f8b1d9bab1490015021afa2bb0e29c6d8))
- Add buildAuthPlugin tests. ([df77f5d](https://github.com/lowdefy/lowdefy/commit/df77f5d51e4a36c997040c0575cdf66edc0a371f))
- **blocks-antd:** Center Label when inline. ([491e4a9](https://github.com/lowdefy/lowdefy/commit/491e4a99c85c106cfc8502ec3dddb8e5d14d73d3))
- **blocks-antd:** Fix RadioSelector not displaying which item is checked. ([8df75e6](https://github.com/lowdefy/lowdefy/commit/8df75e6136597f68f7073a0a26f92ff6a2a51d4a))
- **blocks-antd:** Remove minHight on Label. ([0999baa](https://github.com/lowdefy/lowdefy/commit/0999baaa22f476a01e14e769a30a81953a0b2faf))
- **blocks-google-maps:** Fix map jumping when clicking markers. ([6a6c2c7](https://github.com/lowdefy/lowdefy/commit/6a6c2c78acb9d6b565aa9760c4c385c68c75e8d8))
- **build:** Add default for catch when try is defined and catch is not. ([b1159e1](https://github.com/lowdefy/lowdefy/commit/b1159e147380e024e66879f4fe2e8061d215cedc))
- **docs:** Add catch to Selector and MultipleSelector block pages. ([9777175](https://github.com/lowdefy/lowdefy/commit/9777175ed6028d9ee6eabe68e63e14c4508d6d0b))
- **docs:** correct filePath for ControlledList ([c3a2cce](https://github.com/lowdefy/lowdefy/commit/c3a2cce54ee21064786571977183321f154f058a))
- **docs:** correct link to \_secret operator ([7124669](https://github.com/lowdefy/lowdefy/commit/712466993dd9b35e76d12da3146e6820138d41e6))
- **docs:** Docs V4 compatibilty fixes. ([520dce1](https://github.com/lowdefy/lowdefy/commit/520dce1f7bfa5d5b2eab36ebb58f340e5bf15cc6))
- **docs:** Fix MongoDB page. ([e282e54](https://github.com/lowdefy/lowdefy/commit/e282e54f650c06fed0bf947eecd0946fbbf8b469))
- **docs:** Fix typo media to menu. ([bccc978](https://github.com/lowdefy/lowdefy/commit/bccc978190e617689050df44af9183f68ce10ccf))
- **docs:** Remove catch from MultipleSelector and Selector block pages. ([adf6932](https://github.com/lowdefy/lowdefy/commit/adf6932528f9104905c272282e10ad5369a6bcd3))
- **docs:** Remove outdated pages and add todos. ([ff2c02b](https://github.com/lowdefy/lowdefy/commit/ff2c02b54476e92bf8a949bd91990d1a112791c3))
- **docs:** Rename and remove actions pages. ([0da95f3](https://github.com/lowdefy/lowdefy/commit/0da95f3ac97170864519e39b934c5b6ce9626919))
- Fix \_intl.relativeTimeFormat operator and add tests. ([627b970](https://github.com/lowdefy/lowdefy/commit/627b9707073d7298c04683d0265d8eaab1bd2ac2))
- Fix addUserFieldsToSession when using auth adapter. ([850ee69](https://github.com/lowdefy/lowdefy/commit/850ee69e1ab2245b9abb1af4eeb1636286a6af64))
- Fix handling of null values in \_array and \_object operators. ([1333f43](https://github.com/lowdefy/lowdefy/commit/1333f43315fc7895139e1c981992dac83b1dabf1))
- Fix next-auth getServerSession. ([c5ee6ae](https://github.com/lowdefy/lowdefy/commit/c5ee6aef6227b68786b955d83de2a4f733569225))
- **google-maps:** update center comparison. ([c0cedb7](https://github.com/lowdefy/lowdefy/commit/c0cedb74159a896bb1b6b5cf44dc183fe5982302))
- **operators-js:** Fix intl operator tests. ([841bbe6](https://github.com/lowdefy/lowdefy/commit/841bbe60e507a876c75644422999b2c9a2b48915))
- **operators-moment:** Change tests to run on UTC timezone. ([f8db062](https://github.com/lowdefy/lowdefy/commit/f8db062b122b28e0e8b5d5808a078dd09766856a))
- Revert image url ([714ce8c](https://github.com/lowdefy/lowdefy/commit/714ce8c9298738b5097074d68c25db5b24ee272b))

### Features

- Add \_intl operator. ([fbf4b14](https://github.com/lowdefy/lowdefy/commit/fbf4b14960ad176037546fd67bbe0ababf30aa3e))
- Add \_object.entries and \_object.fromEntries operator methods. ([499b726](https://github.com/lowdefy/lowdefy/commit/499b7269f2a91bd079f20a69df7ec7b2823633e4))
- Add Next-Auth MongoDB adapter. ([bdffb86](https://github.com/lowdefy/lowdefy/commit/bdffb86edf578c5ea603f382b237601c42e14044))
- Add support for auth adapters in build and servers. ([5ae6e2b](https://github.com/lowdefy/lowdefy/commit/5ae6e2bb232f5ad634d92b171887066a6f0a57a0))
- Add support for Next-Auth adapters. ([337dbf4](https://github.com/lowdefy/lowdefy/commit/337dbf46278ee8306b603a13357c14130cd6c3e9))
- **docs:** Add examples to Lowdefy App Schema concept page. ([f27f7dd](https://github.com/lowdefy/lowdefy/commit/f27f7dd58e9cbb19ab620e4c9b265851a6396617))
- **docs:** Add examples to References and Templates concept page. ([cbe8690](https://github.com/lowdefy/lowdefy/commit/cbe8690877cfe8495f51f56a0b4284e8245c8dd3))
- **docs:** Add Menu concept page. ([5dfc51e](https://github.com/lowdefy/lowdefy/commit/5dfc51e2b1975bf45b713a0423a2ed6ce066cd1f))
- **docs:** Add more to references section on Lowdefy App Schema concept page. ([5837c29](https://github.com/lowdefy/lowdefy/commit/5837c29b0e95dd7432b8f4c6d314179c9aaf1428))
- **docs:** Add payload to Connections and Requests concept page. ([4f9bff6](https://github.com/lowdefy/lowdefy/commit/4f9bff6889655f6ae7cc4f8f517015adb3c0dc7f))
- **docs:** Add References and Templates concept page. ([874bc37](https://github.com/lowdefy/lowdefy/commit/874bc37e9ba3e59505d85787af5df0b0686d30c2))
- **docs:** Add roles example to Menus concept page. ([54c13df](https://github.com/lowdefy/lowdefy/commit/54c13dfac0aa5eabe507227ae174d4123fbcc0a0))
- **docs:** Add small changes to Blocks concept page. ([b4bcd68](https://github.com/lowdefy/lowdefy/commit/b4bcd68767166479063cf5cf27a7b242846eae2c))
- **docs:** Change pages example on Lowdefy App Schema concept page. ([1d17867](https://github.com/lowdefy/lowdefy/commit/1d17867585b365a21baccdb87c96bd049a70cda2))
- **docs:** Format changes to Blocks concept page. ([4713be6](https://github.com/lowdefy/lowdefy/commit/4713be632dbd35ab13855bf6f0c44f72fd0ee5b8))
- **docs:** General improvements to Events and Actions concept page. ([182ffc2](https://github.com/lowdefy/lowdefy/commit/182ffc2a787b7119716122b35d3035f1fdb5acb1))
- **docs:** General improvements to the Secrets concept page. ([1121edb](https://github.com/lowdefy/lowdefy/commit/1121edb66a6c4207c867e009bba9a9751aee0319))
- **docs:** Small changes in Blocks concept page. ([588e4aa](https://github.com/lowdefy/lowdefy/commit/588e4aa679103aeafccfcd3b5c073dd05bb8f7a2))
- **docs:** Small changes to Connections and Requests concept page. ([7c13734](https://github.com/lowdefy/lowdefy/commit/7c13734c6b8088bd9b0d92f90fa17f1c2ce2aae4))
- **docs:** Small format changes to Lowdefy App Schema concept page. ([8bf7f78](https://github.com/lowdefy/lowdefy/commit/8bf7f781cb7b85ba7206636816cca5f7dd69073f))
- **docs:** Small improvements to Lowdefy App Schema concept page. ([3864638](https://github.com/lowdefy/lowdefy/commit/386463869c78c494c05636e1e435419c96917b02))
- **docs:** Update blocks concept page. ([3e6a9b2](https://github.com/lowdefy/lowdefy/commit/3e6a9b2affd70c97aac60e80a5aa2c291002ad0b))
- **docs:** Update Connections and Requests concept page. ([879891e](https://github.com/lowdefy/lowdefy/commit/879891e2213cc57bad66ab0b73dba97e93985979))
- **docs:** Update Lowdefy App Schema concept page. ([7cd587e](https://github.com/lowdefy/lowdefy/commit/7cd587e1d4595c1ce26f57035583971218b4d479))
- **docs:** Update Lowdefy App Schema Concept Page. ([b39ce85](https://github.com/lowdefy/lowdefy/commit/b39ce85d47b7501974107ea6b3b04178945bb06d))
- Implement appendHead and appendBody in v4. ([ba7ef7d](https://github.com/lowdefy/lowdefy/commit/ba7ef7d4000bb0ba757092114a90979387daba8a)), closes [#1047](https://github.com/lowdefy/lowdefy/issues/1047)
- Implement appendHead and appendBody. ([d9ae2ee](https://github.com/lowdefy/lowdefy/commit/d9ae2eef8ef848f335901dd1332b8d995c03bdb0))
- **operators-moment:** Add moment operators. ([bf82067](https://github.com/lowdefy/lowdefy/commit/bf82067e90c247a2a8b8deb111cd8ceb75071bce))
- Update next-auth. ([972d5f3](https://github.com/lowdefy/lowdefy/commit/972d5f30ce57886419bc26fd5f19e386418e3dbb))

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

### Bug Fixes

- Add additional operator tests. ([ddf8e51](https://github.com/lowdefy/lowdefy/commit/ddf8e51f8b1d9bab1490015021afa2bb0e29c6d8))
- Add buildAuthPlugin tests. ([df77f5d](https://github.com/lowdefy/lowdefy/commit/df77f5d51e4a36c997040c0575cdf66edc0a371f))
- **blocks-antd:** Remove minHight on Label. ([0999baa](https://github.com/lowdefy/lowdefy/commit/0999baaa22f476a01e14e769a30a81953a0b2faf))
- **build:** Add default for catch when try is defined and catch is not. ([b1159e1](https://github.com/lowdefy/lowdefy/commit/b1159e147380e024e66879f4fe2e8061d215cedc))
- **docs:** Add catch to Selector and MultipleSelector block pages. ([9777175](https://github.com/lowdefy/lowdefy/commit/9777175ed6028d9ee6eabe68e63e14c4508d6d0b))
- **docs:** correct filePath for ControlledList ([c3a2cce](https://github.com/lowdefy/lowdefy/commit/c3a2cce54ee21064786571977183321f154f058a))
- **docs:** correct link to \_secret operator ([7124669](https://github.com/lowdefy/lowdefy/commit/712466993dd9b35e76d12da3146e6820138d41e6))
- **docs:** Docs V4 compatibilty fixes. ([520dce1](https://github.com/lowdefy/lowdefy/commit/520dce1f7bfa5d5b2eab36ebb58f340e5bf15cc6))
- **docs:** Fix typo media to menu. ([bccc978](https://github.com/lowdefy/lowdefy/commit/bccc978190e617689050df44af9183f68ce10ccf))
- **docs:** Remove catch from MultipleSelector and Selector block pages. ([adf6932](https://github.com/lowdefy/lowdefy/commit/adf6932528f9104905c272282e10ad5369a6bcd3))
- **docs:** Remove outdated pages and add todos. ([ff2c02b](https://github.com/lowdefy/lowdefy/commit/ff2c02b54476e92bf8a949bd91990d1a112791c3))
- **docs:** Rename and remove actions pages. ([0da95f3](https://github.com/lowdefy/lowdefy/commit/0da95f3ac97170864519e39b934c5b6ce9626919))
- Fix \_intl.relativeTimeFormat operator and add tests. ([627b970](https://github.com/lowdefy/lowdefy/commit/627b9707073d7298c04683d0265d8eaab1bd2ac2))
- Fix addUserFieldsToSession when using auth adapter. ([850ee69](https://github.com/lowdefy/lowdefy/commit/850ee69e1ab2245b9abb1af4eeb1636286a6af64))
- Fix handling of null values in \_array and \_object operators. ([1333f43](https://github.com/lowdefy/lowdefy/commit/1333f43315fc7895139e1c981992dac83b1dabf1))
- **operators-js:** Fix intl operator tests. ([841bbe6](https://github.com/lowdefy/lowdefy/commit/841bbe60e507a876c75644422999b2c9a2b48915))
- **operators-moment:** Change tests to run on UTC timezone. ([f8db062](https://github.com/lowdefy/lowdefy/commit/f8db062b122b28e0e8b5d5808a078dd09766856a))
- Revert image url ([714ce8c](https://github.com/lowdefy/lowdefy/commit/714ce8c9298738b5097074d68c25db5b24ee272b))

### Features

- Add \_intl operator. ([fbf4b14](https://github.com/lowdefy/lowdefy/commit/fbf4b14960ad176037546fd67bbe0ababf30aa3e))
- Add \_object.entries and \_object.fromEntries operator methods. ([499b726](https://github.com/lowdefy/lowdefy/commit/499b7269f2a91bd079f20a69df7ec7b2823633e4))
- Add Next-Auth MongoDB adapter. ([bdffb86](https://github.com/lowdefy/lowdefy/commit/bdffb86edf578c5ea603f382b237601c42e14044))
- Add support for auth adapters in build and servers. ([5ae6e2b](https://github.com/lowdefy/lowdefy/commit/5ae6e2bb232f5ad634d92b171887066a6f0a57a0))
- Add support for Next-Auth adapters. ([337dbf4](https://github.com/lowdefy/lowdefy/commit/337dbf46278ee8306b603a13357c14130cd6c3e9))
- **docs:** Add examples to Lowdefy App Schema concept page. ([f27f7dd](https://github.com/lowdefy/lowdefy/commit/f27f7dd58e9cbb19ab620e4c9b265851a6396617))
- **docs:** Add examples to References and Templates concept page. ([cbe8690](https://github.com/lowdefy/lowdefy/commit/cbe8690877cfe8495f51f56a0b4284e8245c8dd3))
- **docs:** Add Menu concept page. ([5dfc51e](https://github.com/lowdefy/lowdefy/commit/5dfc51e2b1975bf45b713a0423a2ed6ce066cd1f))
- **docs:** Add payload to Connections and Requests concept page. ([4f9bff6](https://github.com/lowdefy/lowdefy/commit/4f9bff6889655f6ae7cc4f8f517015adb3c0dc7f))
- **docs:** Add References and Templates concept page. ([874bc37](https://github.com/lowdefy/lowdefy/commit/874bc37e9ba3e59505d85787af5df0b0686d30c2))
- **docs:** Add roles example to Menus concept page. ([54c13df](https://github.com/lowdefy/lowdefy/commit/54c13dfac0aa5eabe507227ae174d4123fbcc0a0))
- **docs:** Change pages example on Lowdefy App Schema concept page. ([1d17867](https://github.com/lowdefy/lowdefy/commit/1d17867585b365a21baccdb87c96bd049a70cda2))
- **docs:** Format changes to Blocks concept page. ([4713be6](https://github.com/lowdefy/lowdefy/commit/4713be632dbd35ab13855bf6f0c44f72fd0ee5b8))
- **docs:** General improvements to Events and Actions concept page. ([182ffc2](https://github.com/lowdefy/lowdefy/commit/182ffc2a787b7119716122b35d3035f1fdb5acb1))
- **docs:** General improvements to the Secrets concept page. ([1121edb](https://github.com/lowdefy/lowdefy/commit/1121edb66a6c4207c867e009bba9a9751aee0319))
- **docs:** Small changes in Blocks concept page. ([588e4aa](https://github.com/lowdefy/lowdefy/commit/588e4aa679103aeafccfcd3b5c073dd05bb8f7a2))
- **docs:** Small changes to Connections and Requests concept page. ([7c13734](https://github.com/lowdefy/lowdefy/commit/7c13734c6b8088bd9b0d92f90fa17f1c2ce2aae4))
- **docs:** Small format changes to Lowdefy App Schema concept page. ([8bf7f78](https://github.com/lowdefy/lowdefy/commit/8bf7f781cb7b85ba7206636816cca5f7dd69073f))
- **docs:** Update blocks concept page. ([3e6a9b2](https://github.com/lowdefy/lowdefy/commit/3e6a9b2affd70c97aac60e80a5aa2c291002ad0b))
- **docs:** Update Connections and Requests concept page. ([879891e](https://github.com/lowdefy/lowdefy/commit/879891e2213cc57bad66ab0b73dba97e93985979))
- **docs:** Update Lowdefy App Schema concept page. ([7cd587e](https://github.com/lowdefy/lowdefy/commit/7cd587e1d4595c1ce26f57035583971218b4d479))
- Implement appendHead and appendBody in v4. ([ba7ef7d](https://github.com/lowdefy/lowdefy/commit/ba7ef7d4000bb0ba757092114a90979387daba8a)), closes [#1047](https://github.com/lowdefy/lowdefy/issues/1047)
- Implement appendHead and appendBody. ([d9ae2ee](https://github.com/lowdefy/lowdefy/commit/d9ae2eef8ef848f335901dd1332b8d995c03bdb0))
- **operators-moment:** Add moment operators. ([bf82067](https://github.com/lowdefy/lowdefy/commit/bf82067e90c247a2a8b8deb111cd8ceb75071bce))

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

### Bug Fixes

- **blocks-aggrid:** Fix typo 😱 ([21eef06](https://github.com/lowdefy/lowdefy/commit/21eef065d00eb1f7e7e9c2d0b180c49848dbec2e))

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

### Bug Fixes

- **blocks-aggrid:** Fix typo in processColDefs. ([3073510](https://github.com/lowdefy/lowdefy/commit/307351054100033545606fe1a57d5d03269f28b5))
- **engine:** Fix createGetUrlQuery tests. ([1c9a500](https://github.com/lowdefy/lowdefy/commit/1c9a500c3bb112e6e06abbb3a642918be0784991))
- Read urlQuery from location where used, not on lowdefy. ([11541e4](https://github.com/lowdefy/lowdefy/commit/11541e4722359bb57bace8298fc475caf58dbf6e))
- **server-dev:** BatchChanges.newChange to only revolve for strings. ([30a78fb](https://github.com/lowdefy/lowdefy/commit/30a78fbf77b483cb3b039f4ead11004b604346bc))

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

### Bug Fixes

- **api:** Should be passing profile, not provider. ([02f9fe0](https://github.com/lowdefy/lowdefy/commit/02f9fe0d5e284fc7ce802a7bd9617ca7cb58f5ba))
- **blocks-aggrid:** Rec fix cellRenderer. ([4bb03b1](https://github.com/lowdefy/lowdefy/commit/4bb03b133ad37cab4404c890caa3b30e2a7cb347))
- **deps:** update dependency next-auth to v4.9.0 [security] ([7d07007](https://github.com/lowdefy/lowdefy/commit/7d070078ef171f308359f7cfd534d8a207f76956))

### Features

- **api:** Add provider to linkAccountEvent. ([a90f10b](https://github.com/lowdefy/lowdefy/commit/a90f10b68d2a291dcb98883fdf54c53ecbbd3a71))

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

### Bug Fixes

- Allow cellRenderer in Aggrid to render html. ([811ef4f](https://github.com/lowdefy/lowdefy/commit/811ef4f28092155172a4e7f8485fb93847453ac4))
- Await content on buildRef to fix ref error message. ([10379b1](https://github.com/lowdefy/lowdefy/commit/10379b15194e8f2f890b1507bb5bdf55beb04aaf))
- **build:** Add test for file not found to buildRefs. ([d45c28e](https://github.com/lowdefy/lowdefy/commit/d45c28e3e44f026073be64ff80335c116aa1488d))
- Fix axios failing tests. ([ca64872](https://github.com/lowdefy/lowdefy/commit/ca64872a130c2b8f5d0798f7489b39c99143d329))
- Menu selected item issue. ([ac266ec](https://github.com/lowdefy/lowdefy/commit/ac266ece5d7658a3e5e9c212f49b897a30dd278e))

### Features

- Add extra next-auth configuration properties. ([9781ba4](https://github.com/lowdefy/lowdefy/commit/9781ba46620eb0ddaa11d7d41eb0d8f518999784))

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

### Bug Fixes

- **blocks-google-maps:** Fix fitBounds. ([a4748ba](https://github.com/lowdefy/lowdefy/commit/a4748baf4c1b17472df235e681a660dc8871c222))
- **blocks-google-maps:** Fix load script libraries. ([c9376f0](https://github.com/lowdefy/lowdefy/commit/c9376f03cbe57927c57491fa21847350f585bf96))
- **blocks-google-maps:** Fix onLoad event. ([2c1de9a](https://github.com/lowdefy/lowdefy/commit/2c1de9a6f7052981b44e34c7442fe8e1e6496cf8))
- **blocks-google-maps:** Fixes to onLoad. ([1dd08e4](https://github.com/lowdefy/lowdefy/commit/1dd08e4c2c34b2406351cb2e0a11908cf4e6f6ac))
- **build:** Add new plugins as dev dependencies. ([145e598](https://github.com/lowdefy/lowdefy/commit/145e5989139c95acae4029e0a95b1de552457d46))
- **build:** Evaluate build operators in lowdefy.yaml ([49ed3e1](https://github.com/lowdefy/lowdefy/commit/49ed3e14fd7453cd246324d1b791e902dc5a3c8f))
- **client:** Fix layout on skeleton containers. ([fb38d00](https://github.com/lowdefy/lowdefy/commit/fb38d00536befeb5aebcf26c12132c8e8f0fcc92))
- **client:** Remove area and layout default object. ([27a56f1](https://github.com/lowdefy/lowdefy/commit/27a56f18e6e71faa51696d014b41b97744a3ff57))
- **client:** Skeleton to get parent blocks properties and styles. ([0022fc0](https://github.com/lowdefy/lowdefy/commit/0022fc0b37695c523e99b6b653b0fc54f846d4ed))
- **deps:** Update dependency next-auth to v4.5.0. ([49dd43a](https://github.com/lowdefy/lowdefy/commit/49dd43ae4249129d029fbd8d1135d00fb26a5b7a))
- Fix nunjucks operator shorthand en operators runtime definition. ([e2c3291](https://github.com/lowdefy/lowdefy/commit/e2c329199295baba108796f19a9d13a8b39008b5))
- Fix package.json fixes. ([17f54ac](https://github.com/lowdefy/lowdefy/commit/17f54aceafc749be7e513fdcad829cd3ad4673ac))
- Fix userFields implementation. ([c566541](https://github.com/lowdefy/lowdefy/commit/c566541538749c27cdda32381c7255e3e37ae32e))
- Fix userFields in production server. ([614d7c9](https://github.com/lowdefy/lowdefy/commit/614d7c915d20c12ad285336a8d6fd0c942c11c48))
- **layout:** Apply area and layout default. ([af8611f](https://github.com/lowdefy/lowdefy/commit/af8611fddf11373828b33fe2616d635a401b25d9))
- Remove userFields debug logs. ([8fad19f](https://github.com/lowdefy/lowdefy/commit/8fad19f28c4e4f39dc3135e0a3f1e2e2c8e4689c))
- **server-dev:** Add max count in waitForRestartedServer ping. ([d7d8a0b](https://github.com/lowdefy/lowdefy/commit/d7d8a0b221322171096929954376b87d7c8ce838))
- **server-dev:** Should not be minified. ([d61e9e0](https://github.com/lowdefy/lowdefy/commit/d61e9e0db4de869390e3f1992cc30f826a40ec93))

### Features

- **actions-core:** Add Fetch action. ([4c47ba6](https://github.com/lowdefy/lowdefy/commit/4c47ba65a18422ea5e849110c51be9e62e20c597))
- Add callbackUrl and redirect as logout action params. ([9c13bd6](https://github.com/lowdefy/lowdefy/commit/9c13bd65df26e8e9bcb0b0c72b68adad45134fc2))
- Add url as a login and logout callbackUrl parameter. ([78d099a](https://github.com/lowdefy/lowdefy/commit/78d099a02833aee5df157f8ac64ed3c9fff396f0))
- Add userFields feature to map auth provider data to usernobject. ([0ab688b](https://github.com/lowdefy/lowdefy/commit/0ab688b7f2c153cd904160a28c91c0581b6e1e07))
- **blocks-google-maps:** Add onLoad to maps. ([e9a75df](https://github.com/lowdefy/lowdefy/commit/e9a75df9cb1aaa95838f21ef6485e0ee9a9ce73f))
- **blocks-google-maps:** Switch to @react-google-maps/api. ([3edbd9a](https://github.com/lowdefy/lowdefy/commit/3edbd9aeaff5013f23ed1c173de17828b8be5d5f))
- **blocks-google-maps:** Update Google Maps block docs. ([2657a3c](https://github.com/lowdefy/lowdefy/commit/2657a3c6c390807ba987980407a1fd75fac5dede))
- Move browser globals to lowdefy.\_internal.globals. ([94c4016](https://github.com/lowdefy/lowdefy/commit/94c401660832956c9c2da0df2119ba89fe7fb08e))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

### Bug Fixes

- Configure server Lowdefy build with env variables, not args. ([590588c](https://github.com/lowdefy/lowdefy/commit/590588c125886655b9487c6dc4184a571533fe26))

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

### Bug Fixes

- **build:** Add default dependancies. ([7d0e03a](https://github.com/lowdefy/lowdefy/commit/7d0e03a87b83991d6bc4d52ae8b524344db07635))
- **build:** Evaluate build operators in lowdefy.yaml root. ([c340b52](https://github.com/lowdefy/lowdefy/commit/c340b5237f15b7673425f086944211238a16904b))
- Configure server lowdefy build with commandline args instead of env from CLI ([648f050](https://github.com/lowdefy/lowdefy/commit/648f050377077ddd0e677250e7f9e7d422fdea36))
- **dev-server:** Add google maps and aggrid as default types. ([b3fa3a2](https://github.com/lowdefy/lowdefy/commit/b3fa3a24c325cfecd7ae48dc2019523ccab102d4))

### Features

- Add —no-next-build option to CLI build command. ([9b565f4](https://github.com/lowdefy/lowdefy/commit/9b565f4950f3087d54e9be3c0f768cba1d0651d1))
- **blocks-aggrid:** Add aggrid as a default block. ([3133fee](https://github.com/lowdefy/lowdefy/commit/3133feeefe27b52fecfd352060d7cd25013c5d51))
- **blocks-googl-maps:** Update docs. ([fb950b6](https://github.com/lowdefy/lowdefy/commit/fb950b662135bf2163429d813204a7d65da1df33))
- **blocks-google-maps:** Add google maps as a default block. ([b0daaec](https://github.com/lowdefy/lowdefy/commit/b0daaec9fa06972da82a39d9c2ca94da90680b4b))
- **build:** Add aggrid and maps as default block types. ([fbc3818](https://github.com/lowdefy/lowdefy/commit/fbc38185ea385fcfde1f35cfe2d4cfb3d2732388))

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

### Bug Fixes

- **blocks-google-maps:** Fix fitBounds. ([a4748ba](https://github.com/lowdefy/lowdefy/commit/a4748baf4c1b17472df235e681a660dc8871c222))
- **blocks-google-maps:** Fix load script libraries. ([c9376f0](https://github.com/lowdefy/lowdefy/commit/c9376f03cbe57927c57491fa21847350f585bf96))
- **blocks-google-maps:** Fix onLoad event. ([2c1de9a](https://github.com/lowdefy/lowdefy/commit/2c1de9a6f7052981b44e34c7442fe8e1e6496cf8))
- **blocks-google-maps:** Fixes to onLoad. ([1dd08e4](https://github.com/lowdefy/lowdefy/commit/1dd08e4c2c34b2406351cb2e0a11908cf4e6f6ac))
- **build:** Add default dependancies. ([7d0e03a](https://github.com/lowdefy/lowdefy/commit/7d0e03a87b83991d6bc4d52ae8b524344db07635))
- **build:** Add new plugins as dev dependencies. ([145e598](https://github.com/lowdefy/lowdefy/commit/145e5989139c95acae4029e0a95b1de552457d46))
- **build:** Evaluate build operators in lowdefy.yaml ([49ed3e1](https://github.com/lowdefy/lowdefy/commit/49ed3e14fd7453cd246324d1b791e902dc5a3c8f))
- **build:** Evaluate build operators in lowdefy.yaml root. ([c340b52](https://github.com/lowdefy/lowdefy/commit/c340b5237f15b7673425f086944211238a16904b))
- **client:** Fix layout on skeleton containers. ([fb38d00](https://github.com/lowdefy/lowdefy/commit/fb38d00536befeb5aebcf26c12132c8e8f0fcc92))
- **client:** Skeleton to get parent blocks properties and styles. ([0022fc0](https://github.com/lowdefy/lowdefy/commit/0022fc0b37695c523e99b6b653b0fc54f846d4ed))
- **deps:** Update dependency next-auth to v4.5.0. ([49dd43a](https://github.com/lowdefy/lowdefy/commit/49dd43ae4249129d029fbd8d1135d00fb26a5b7a))
- **dev-server:** Add google maps and aggrid as default types. ([b3fa3a2](https://github.com/lowdefy/lowdefy/commit/b3fa3a24c325cfecd7ae48dc2019523ccab102d4))
- Fix nunjucks operator shorthand en operators runtime definition. ([e2c3291](https://github.com/lowdefy/lowdefy/commit/e2c329199295baba108796f19a9d13a8b39008b5))
- Fix package.json fixes. ([17f54ac](https://github.com/lowdefy/lowdefy/commit/17f54aceafc749be7e513fdcad829cd3ad4673ac))
- Fix userFields implementation. ([c566541](https://github.com/lowdefy/lowdefy/commit/c566541538749c27cdda32381c7255e3e37ae32e))
- Fix userFields in production server. ([614d7c9](https://github.com/lowdefy/lowdefy/commit/614d7c915d20c12ad285336a8d6fd0c942c11c48))
- Remove userFields debug logs. ([8fad19f](https://github.com/lowdefy/lowdefy/commit/8fad19f28c4e4f39dc3135e0a3f1e2e2c8e4689c))
- **server-dev:** Add max count in waitForRestartedServer ping. ([d7d8a0b](https://github.com/lowdefy/lowdefy/commit/d7d8a0b221322171096929954376b87d7c8ce838))

### Features

- **actions-core:** Add Fetch action. ([4c47ba6](https://github.com/lowdefy/lowdefy/commit/4c47ba65a18422ea5e849110c51be9e62e20c597))
- Add callbackUrl and redirect as logout action params. ([9c13bd6](https://github.com/lowdefy/lowdefy/commit/9c13bd65df26e8e9bcb0b0c72b68adad45134fc2))
- Add url as a login and logout callbackUrl parameter. ([78d099a](https://github.com/lowdefy/lowdefy/commit/78d099a02833aee5df157f8ac64ed3c9fff396f0))
- Add userFields feature to map auth provider data to usernobject. ([0ab688b](https://github.com/lowdefy/lowdefy/commit/0ab688b7f2c153cd904160a28c91c0581b6e1e07))
- **blocks-aggrid:** Add aggrid as a default block. ([3133fee](https://github.com/lowdefy/lowdefy/commit/3133feeefe27b52fecfd352060d7cd25013c5d51))
- **blocks-googl-maps:** Update docs. ([fb950b6](https://github.com/lowdefy/lowdefy/commit/fb950b662135bf2163429d813204a7d65da1df33))
- **blocks-google-maps:** Add google maps as a default block. ([b0daaec](https://github.com/lowdefy/lowdefy/commit/b0daaec9fa06972da82a39d9c2ca94da90680b4b))
- **blocks-google-maps:** Add onLoad to maps. ([e9a75df](https://github.com/lowdefy/lowdefy/commit/e9a75df9cb1aaa95838f21ef6485e0ee9a9ce73f))
- **blocks-google-maps:** Switch to @react-google-maps/api. ([3edbd9a](https://github.com/lowdefy/lowdefy/commit/3edbd9aeaff5013f23ed1c173de17828b8be5d5f))
- **blocks-google-maps:** Update Google Maps block docs. ([2657a3c](https://github.com/lowdefy/lowdefy/commit/2657a3c6c390807ba987980407a1fd75fac5dede))
- **build:** Add aggrid and maps as default block types. ([fbc3818](https://github.com/lowdefy/lowdefy/commit/fbc38185ea385fcfde1f35cfe2d4cfb3d2732388))
- Move browser globals to lowdefy.\_internal.globals. ([94c4016](https://github.com/lowdefy/lowdefy/commit/94c401660832956c9c2da0df2119ba89fe7fb08e))

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

### Bug Fixes

- Configure server Lowdefy build with env variables, not args. ([590588c](https://github.com/lowdefy/lowdefy/commit/590588c125886655b9487c6dc4184a571533fe26))

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

### Bug Fixes

- **cli:** Define build directory on context. ([51bc05f](https://github.com/lowdefy/lowdefy/commit/51bc05f835cade977f7d2c0476b76fa38d762655))
- Configure server lowdefy build with commandline args instead of env from CLI ([648f050](https://github.com/lowdefy/lowdefy/commit/648f050377077ddd0e677250e7f9e7d422fdea36))
- Remove output directory cli option ([ba281a6](https://github.com/lowdefy/lowdefy/commit/ba281a6a2c7a75bc05b4e5495e46063d62e555d8))
- **server:** Fix for next.js output file tracing. ([34c3f2d](https://github.com/lowdefy/lowdefy/commit/34c3f2d91a03d7e062cb493557d791e12782cec2))

### Features

- Add —no-next-build option to CLI build command. ([9b565f4](https://github.com/lowdefy/lowdefy/commit/9b565f4950f3087d54e9be3c0f768cba1d0651d1))

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

### Bug Fixes

- **cli:** Define build directory on context. ([51bc05f](https://github.com/lowdefy/lowdefy/commit/51bc05f835cade977f7d2c0476b76fa38d762655))
- Remove output directory cli option ([ba281a6](https://github.com/lowdefy/lowdefy/commit/ba281a6a2c7a75bc05b4e5495e46063d62e555d8))
- **server:** Fix for next.js output file tracing. ([34c3f2d](https://github.com/lowdefy/lowdefy/commit/34c3f2d91a03d7e062cb493557d791e12782cec2))

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- **actions-core:** Fix actions core tests. ([8647f91](https://github.com/lowdefy/lowdefy/commit/8647f915be3aa625a9f1f96f582e16b2bbb78ea5))
- **actions:** Convert tests to use new testContext. ([1a6f8df](https://github.com/lowdefy/lowdefy/commit/1a6f8df2a18f21d9fe538aa9670b5fe51c412449))
- Add lerna-debug.log to gitignore. ([e521be2](https://github.com/lowdefy/lowdefy/commit/e521be29af82a43a0c5532a4713a6cf019032347))
- **blocks-echarts:** Do not break if dataset.source is null. ([30d3d7e](https://github.com/lowdefy/lowdefy/commit/30d3d7ea0ec6fffef258efb7688761130f289ffb))
- Build createContext should not be async, create separate file. ([67c03ec](https://github.com/lowdefy/lowdefy/commit/67c03ec345f0ef17cdb4197afe0cc87a532a636b))
- **build:** defaultTypesMap to write a js file to dist. ([331284e](https://github.com/lowdefy/lowdefy/commit/331284e3dfc2e8e12f13991881688c7d1b4d2121))
- **build:** Fix build tests. ([9ea612b](https://github.com/lowdefy/lowdefy/commit/9ea612b4e0ceb9785196cdf1451fb57512e059e4))
- **build:** Fix buildAuth tests. ([0882416](https://github.com/lowdefy/lowdefy/commit/0882416d6fa9a9637ec8870180a022a2bb6dbd21))
- **build:** Fix buildEvents tests. ([0dcb927](https://github.com/lowdefy/lowdefy/commit/0dcb927c0b09de8e376c54a356a6db60660ba0d5))
- **build:** remove unneccesary async await in build. ([6b974e6](https://github.com/lowdefy/lowdefy/commit/6b974e63fc79a3d1b87a478d83269ec8e8121ea0))
- **build:** Restore buildRefs tests after jest update fixes es modules. ([a684273](https://github.com/lowdefy/lowdefy/commit/a6842739f87b6e427a038d41ac5ec87016063e1e))
- **build:** Throw during build if events are not arrays. ([c0c3971](https://github.com/lowdefy/lowdefy/commit/c0c39712687ca7c4c207d46a27c746e1298b2367))
- **cli:** Check env for configDirectory. ([f8964ca](https://github.com/lowdefy/lowdefy/commit/f8964cac1ae2c55cb95fa13c06be3dc8be032538))
- **engine:** Fix createSetGlobal. ([542ed98](https://github.com/lowdefy/lowdefy/commit/542ed983dc869e82a2e06c106377035ad7fbf57e))
- **engine:** Fix engine tests. ([92182a2](https://github.com/lowdefy/lowdefy/commit/92182a2bb53b7b54179f67792bd10e6b53ad2400))
- **engine:** RootBlocks.map to use blockId. ([d31064f](https://github.com/lowdefy/lowdefy/commit/d31064ff9c685d1ae959ce9142ac11aca55fb6c0))
- **engine:** Set request to null and update before calling request. ([bb2b57b](https://github.com/lowdefy/lowdefy/commit/bb2b57b4435d232be50d3971bcdc54354ea3b711))
- **engine:** testContext to build config and use getContext. ([4539d6f](https://github.com/lowdefy/lowdefy/commit/4539d6f939c722a8e804038a9ca04b6cddc18691))
- **engine:** Update benchmark test to pass. ([529f65e](https://github.com/lowdefy/lowdefy/commit/529f65e64738e1b8b211a7c161196dd0ff667756))
- **engine:** Update createResetValidation test ([177b66f](https://github.com/lowdefy/lowdefy/commit/177b66f59ad6c6b90b9532b1d1e6744594c3aa05))
- **engine:** Update test to use built config. ([f4c0f76](https://github.com/lowdefy/lowdefy/commit/f4c0f7676e96c31b7455e6aafb815826ba51d959))
- Fix auth errors if auth is not configured. ([8a386a8](https://github.com/lowdefy/lowdefy/commit/8a386a867ca92f313b74f785477a48cd7c9a1679))
- Fix license typo. ([972acbb](https://github.com/lowdefy/lowdefy/commit/972acbb46b9b1113053797f82a41c5f9032dd8b0))
- **operators-js:** Fix \_location and \_media tests. ([f47bede](https://github.com/lowdefy/lowdefy/commit/f47bede2f8b6417aebfc02a3fd41f519ca377cb0))
- **server-dev:** Load .env using dotenv. ([85d7827](https://github.com/lowdefy/lowdefy/commit/85d78277b29e12986a5886e986bd46070c7b28ac))
- Update all packages to use @lowdefy/jest-yaml-transform. ([7bdf0a4](https://github.com/lowdefy/lowdefy/commit/7bdf0a4bb8ea972de7e4d4b82097a6fdaebfea56))
- Update tests to run on node and jsdom. ([be2180a](https://github.com/lowdefy/lowdefy/commit/be2180aea8f7e2ae0bc8d6ba0a716d31c0d76bc7))
- Use createRequire to import json files. ([a9c7ec4](https://github.com/lowdefy/lowdefy/commit/a9c7ec4eae0cf65dd42403fb405e65e13b9eca62))

### Features

- Add openid connect standard claims to user object. ([7f099e1](https://github.com/lowdefy/lowdefy/commit/7f099e1d55cab7ba79214870f1bc23235b8fd09a))
- Add version property to Lowdefy schema. ([04ff15f](https://github.com/lowdefy/lowdefy/commit/04ff15f89e404c88e204085a7a2552e5cb93b2a5))
- **cli:** Add —no-open option to cli dev command. ([bc5b12f](https://github.com/lowdefy/lowdefy/commit/bc5b12fce379352e6cbf73503154e88b980918e6))
- **cli:** Cli to load .env for build and start commands. ([ac34fe8](https://github.com/lowdefy/lowdefy/commit/ac34fe80190585b3db3f18e5fa3c4fba48563368))
- **docs:** Init v4 migration notes. ([674dc03](https://github.com/lowdefy/lowdefy/commit/674dc03f41175781e0b32a218b86addb2417079a))
- **engine:** 🏄‍♂️Engine tests are passing. ([d737e1c](https://github.com/lowdefy/lowdefy/commit/d737e1cf12ab8bef0a44aee9d3f7765aade4b2e2))
- **engine:** Add payload and blockId to context.requests[requestId]. ([e29d88b](https://github.com/lowdefy/lowdefy/commit/e29d88b326338fdec22db325dcda31ee4f73cf51))
- Export buildTestPage, add tests. ([bc9f16c](https://github.com/lowdefy/lowdefy/commit/bc9f16c2efdfc12d047b592a7bbed341d4bd6551))
- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- Package Updates. ([0f9d8cd](https://github.com/lowdefy/lowdefy/commit/0f9d8cd89186e12c66e5f833c13c12472f52eaee))
- React 18 update. ([55268e7](https://github.com/lowdefy/lowdefy/commit/55268e74ea08544ce816e85e205cd2093e0f2319))
- Set login providerId if only one provider is configured. ([8bc34a1](https://github.com/lowdefy/lowdefy/commit/8bc34a1b0533e6231bfdc2655ba48e1df701a772))
- **utils:** Add jest-yaml-transform package. ([dd9dbe4](https://github.com/lowdefy/lowdefy/commit/dd9dbe49895830b49b6602841ded0c5c285020c3))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

### Bug Fixes

- **client:** Clean up use effect hook. ([413c697](https://github.com/lowdefy/lowdefy/commit/413c697a08c429c39100f9a23298e591bc194ed4))
- **client:** On mount async method should always be called. ([912e405](https://github.com/lowdefy/lowdefy/commit/912e40522999e8e8b7eb65ec2855f43fab9c759b))
- **operators:** Fix operator tests for passing down window. ([562890f](https://github.com/lowdefy/lowdefy/commit/562890f861d13196af5aa75cef4fd5227e257b61))
- **operators:** Pass window to operators and not context. ([dd9dfad](https://github.com/lowdefy/lowdefy/commit/dd9dfad9cb38c3cb463b90e9d919f4cacfad05d9))
- **operators:** Use window from lowdefy object. ([8e31d2a](https://github.com/lowdefy/lowdefy/commit/8e31d2a7a5d982e6e747d828cd7fd68488f7ea7f))
- **server-dev:** Fix react hooks used incorrectly. ([0b36cc2](https://github.com/lowdefy/lowdefy/commit/0b36cc20984f48fc53993c51cbaef3bf05133c9d))

### Features

- Install most fill and outline antd icons for dev server. ([07ef677](https://github.com/lowdefy/lowdefy/commit/07ef6775c78482923f2c93391bfec2cd0e819749))

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

### Bug Fixes

- Adapt createAuthMethods for client package. ([4675297](https://github.com/lowdefy/lowdefy/commit/467529780bc1c90a089f6b157e264e5fbe10ca63))
- Add turbo 64 files and clean package.json. ([cc7b7c0](https://github.com/lowdefy/lowdefy/commit/cc7b7c0629316aafe5f49e41285dd96653f4d92e))
- Auth bug fixes. ([3fe249c](https://github.com/lowdefy/lowdefy/commit/3fe249c36e86fe943227f6df4f115d9386ab935b))
- **build:** Remove unused configuration from auth schema. ([4922373](https://github.com/lowdefy/lowdefy/commit/4922373d4e8258d6d08fb5adc5af576a83260ea9))
- **cli:** Do not copy node_modules in plugin folders. ([a5a131d](https://github.com/lowdefy/lowdefy/commit/a5a131de06d6a8d28926aa709a57af0a7e7adb5f))
- **client:** Fix setupLink - createLink needs lowdefy for input. ([314f131](https://github.com/lowdefy/lowdefy/commit/314f131ceb82bc39cf339dd2e6dfdf56aadb8543))
- **cli:** Plugins should be added as dependencies, not devDependencies. ([e11e11f](https://github.com/lowdefy/lowdefy/commit/e11e11f7ab62b3272bb02cfa723f61b61c836fde))
- **deps:** Update dependency next to v12.1.6 ([490ea8f](https://github.com/lowdefy/lowdefy/commit/490ea8fda5bc1892eb44ad371b2d95c99ea618fd))
- Fix auth callback import in dev server. ([557669e](https://github.com/lowdefy/lowdefy/commit/557669e79838521f719c64d5addee8c7c4d1547a))
- Fix auth tests. ([c2a8fc7](https://github.com/lowdefy/lowdefy/commit/c2a8fc7206f6a0432a95f1c99749f861a1bf45f5))
- Fix tests. ([eb85c58](https://github.com/lowdefy/lowdefy/commit/eb85c58f7a9a0531b703804810f0b61a228a592e))
- Remove console logs. ([42ab05b](https://github.com/lowdefy/lowdefy/commit/42ab05bb649c4a9fc8d020ea1591fe6b37c8304b))
- Remove test auth callback plugins. ([b22e4a1](https://github.com/lowdefy/lowdefy/commit/b22e4a150fb28a962587fa14b2d1e56fb7ffd53d))
- Remove user from block properties. ([7cadf63](https://github.com/lowdefy/lowdefy/commit/7cadf6389a3c50fafbb4834f099e6514cad790bd))
- **server-dev:** Fix dev server not running next build. ([27efcdf](https://github.com/lowdefy/lowdefy/commit/27efcdf8c5bc6a0f7c6a0b33ceb8e56ea2114a5a))
- Update lowdefy auth schema. ([60a048e](https://github.com/lowdefy/lowdefy/commit/60a048e98b89b8e6464a5c92553f56774a2c5908))
- Update operator plugin import locations. ([b65aa48](https://github.com/lowdefy/lowdefy/commit/b65aa482a3de39a6406b2a0948b6b502c84e0498))
- Use fileURLToPath when loading json files. ([4885462](https://github.com/lowdefy/lowdefy/commit/488546237b8e5964acc453f05d919f5eb952d8c4))
- Windows compatibility fixes. ([8ecdfc4](https://github.com/lowdefy/lowdefy/commit/8ecdfc4e377648761e9035e355c7ec777fd63888))

### Features

- Add support for auth callback plugins. ([a16e074](https://github.com/lowdefy/lowdefy/commit/a16e074ca801a5e9e05424fc09cb8c1e1da81cee))
- Add support for auth event plugins. ([35f28b8](https://github.com/lowdefy/lowdefy/commit/35f28b849d945d14616fc5269bdb980cceb9dee4))
- **api:** Add user to api context and user roles to authorization. ([133245e](https://github.com/lowdefy/lowdefy/commit/133245ea16b7c1aed85f67dacb503b879b027edd))
- **build:** Build auth providers and write plugin import file. ([9eb34c8](https://github.com/lowdefy/lowdefy/commit/9eb34c870074c15f7d39202b9eb3c2e21a1ff646))
- **build:** Update build for v4 auth config. ([0120462](https://github.com/lowdefy/lowdefy/commit/01204627d2159b56d7e314d8b8089f4aeccb71d1))
- Create auth plugins types maps. ([6df0010](https://github.com/lowdefy/lowdefy/commit/6df00102032648a3b8d958828a4b5e853cd38da3))
- Import all next-auth providers. ([28921ce](https://github.com/lowdefy/lowdefy/commit/28921ce4507be47db71388bfaeeea6ea9c431917))
- Import all types exported by plugins in dev server. ([b6e05fb](https://github.com/lowdefy/lowdefy/commit/b6e05fba4479417d9bc8019782b93f8c83515066))
- Include auth event plugins in build. ([4c6d108](https://github.com/lowdefy/lowdefy/commit/4c6d108dffc98a90b9ec0268fe91fb8102cb15de))
- Init package @lowdefy/plugin-next-auth ([b1dbf9e](https://github.com/lowdefy/lowdefy/commit/b1dbf9e94a0bf5b8a354fd9646acdfb8348c10df))
- Next auth implementation work in progress. ([bf5692a](https://github.com/lowdefy/lowdefy/commit/bf5692aed26a003e9412b029295a45af489728c4))
- Next auth login and logout working. ([d47f9e5](https://github.com/lowdefy/lowdefy/commit/d47f9e56cd6da7827499ef9cf248dfc64f8bd12b))
- Pass user session to api context from server. ([55f2438](https://github.com/lowdefy/lowdefy/commit/55f2438258bf8bad4b9f03647a00b8f730cacb79))
- Read auth secret from secrets object. ([f266fbf](https://github.com/lowdefy/lowdefy/commit/f266fbfa7cabbca8bcfa7e89fb06843db3bd88ce))
- **server-dev:** Next auth working in dev server. ([44fbca9](https://github.com/lowdefy/lowdefy/commit/44fbca96e28e4d72f1a406ea122b101016baa3b9))
- **server:** Add read user object from next-auth session. ([fbab7f1](https://github.com/lowdefy/lowdefy/commit/fbab7f14e7a23fcc82f4a7e1903c4aafdda8169d))
- Updates to auth configuration. ([8f7abf7](https://github.com/lowdefy/lowdefy/commit/8f7abf7fdb1cbe0dbaabe209787a128854680f7b))
- Use next-auth session to authenticate in api. ([462c0ac](https://github.com/lowdefy/lowdefy/commit/462c0ac0d05429514ecd2a2b11a6a21b8915b462))

### BREAKING CHANGES

- Removed user from block properties.
- **build:** The “config.auth” object has been moved to the “auth” object at the root of the Lowdefy config.

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

### Bug Fixes

- Fix server npm publish files. ([3f5589e](https://github.com/lowdefy/lowdefy/commit/3f5589e434817e712624e31c955b0b741e94f075))

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Bug Fixes

- **actions-core:** Fix tests. ([29ec08d](https://github.com/lowdefy/lowdefy/commit/29ec08d5314b3fdd70ac8b073db6163f98fa3e52))
- **actions:** textContext is now sync. ([13d6396](https://github.com/lowdefy/lowdefy/commit/13d6396a00067c1319ef1a956e0ed831af738cc1))
- **block-dev:** Fix mockMethodTest prototype. ([e90cefd](https://github.com/lowdefy/lowdefy/commit/e90cefd82be378fa944c636abfc7281b2a43df92))
- **block-dev:** Render props when mocking Link and Icon in stubBlockProps. ([b6b50c8](https://github.com/lowdefy/lowdefy/commit/b6b50c842a84bd74adcf6f053de5902124a3f460))
- **block-utils:** Icon should not spin on page loading. ([c3d9be5](https://github.com/lowdefy/lowdefy/commit/c3d9be52b13f91fc93d566af81cd19df6b1cc863))
- **blocks-antd:** Fix button color on focus. ([c56d1e4](https://github.com/lowdefy/lowdefy/commit/c56d1e40433127811b211f3c0736dde52124af1e))
- **blocks-antd:** Fix confirm modal button icons, closes [#1160](https://github.com/lowdefy/lowdefy/issues/1160) ([bba35be](https://github.com/lowdefy/lowdefy/commit/bba35be1dbb6a8e142f70b2415e865dba59de47b))
- **blocks-antd:** Fix menu keys. ([c6b8c69](https://github.com/lowdefy/lowdefy/commit/c6b8c69bb05c013d5112b89523424568faf34005))
- **blocks-antd:** Fix menu width wrapping. ([f71499c](https://github.com/lowdefy/lowdefy/commit/f71499cad248342e9a37584da56c0088aefcb62a))
- **blocks-antd:** Menu to show current selected page. ([72af09c](https://github.com/lowdefy/lowdefy/commit/72af09cf3dab6417d8ee6c0cdcbeec52ba092876))
- **blocks-antd:** remove onEnter and onInit events from schema descriptions. ([c0df169](https://github.com/lowdefy/lowdefy/commit/c0df1699276b6a922792a1d971ab6e596a5524e3))
- **blocks-antd:** Update snapshots. ([c4cc37a](https://github.com/lowdefy/lowdefy/commit/c4cc37acff9ade36a2db84ee395e2dbceb5a13d1))
- **blocks-basic:** Fix tests and snapshots. ([b9e6f1c](https://github.com/lowdefy/lowdefy/commit/b9e6f1ce19d5805299fbfb8f0ec846b6d6cdee6a))
- **blocks-color-selector:** Fix update state. ([f0e6f18](https://github.com/lowdefy/lowdefy/commit/f0e6f18cb6a5098301c722bc59dd0264b1fd1ee8))
- **blocks-loaders:** Remove LogoSpinner. ([3af64aa](https://github.com/lowdefy/lowdefy/commit/3af64aacaf5c8d3c64519dc82230b48842ca0fce))
- **blocks-markdown:** Cleanup markdown styles. ([5cd90fb](https://github.com/lowdefy/lowdefy/commit/5cd90fb0664c81082efc702d7ca6466d8f02da2a))
- **blocks-markdown:** Fix react-syntax-highlighter styles import. ([bc6fed7](https://github.com/lowdefy/lowdefy/commit/bc6fed771ca09de583b4bdbd03469a75e0b6b4e8))
- **blocks-markdown:** More style fixes. ([6498040](https://github.com/lowdefy/lowdefy/commit/64980406b5e11b1d052974e8f046c6880071bff3))
- **blocks-markdown:** Updated and fixed MarkdownWithCode Syntax Highlighter@15.5.0 ([424bf3e](https://github.com/lowdefy/lowdefy/commit/424bf3ec8d101a92784ad39e75c088eaefc2147f))
- **blocks:** Fix icon names in examples. ([0d28534](https://github.com/lowdefy/lowdefy/commit/0d285347cdccd3a5f5c0531b5ee069d0e735287c))
- **build:** Fix tests. ([8e7b16e](https://github.com/lowdefy/lowdefy/commit/8e7b16e3ecb7c7c25fd2d4fb48ea42ccad0bb1a8))
- **build:** Skeleton on block only a object in schema. ([98d9c57](https://github.com/lowdefy/lowdefy/commit/98d9c57d6cfb9e24ba0be897ce6812e4765b0d7b))
- **client:** Fix setupLink - createLink needs lowdefy for input. ([f152ac2](https://github.com/lowdefy/lowdefy/commit/f152ac2c5ef0bf3dc085fbe7e89648ac2ca7c550))
- **client:** Render progress bar next to context, and event order fixes. ([fc32c75](https://github.com/lowdefy/lowdefy/commit/fc32c75ea2d8c5c97e21280b09fce5518ec14d37))
- **docs:** Cleanup skeleton docs change. ([6310d13](https://github.com/lowdefy/lowdefy/commit/6310d13af0c9cc709c5c3f50cc9800ebb0a4640a))
- **docs:** Fix docs version plugin import and markdown template. ([3f3cf55](https://github.com/lowdefy/lowdefy/commit/3f3cf5569f5d15c0283f047f9a6aa404d9709fee))
- **engine:** Catch block type not found error. ([7d95728](https://github.com/lowdefy/lowdefy/commit/7d957284ca082b8aa2aa8316b1dc8d7e1ca8a2c6))
- **engine:** Init validate only if none. ([9b5bd70](https://github.com/lowdefy/lowdefy/commit/9b5bd707715ff1d65867957271f7a04298e360c9))
- **engine:** Only init validate if none. ([e0d7dd6](https://github.com/lowdefy/lowdefy/commit/e0d7dd6a21859e090ec627e18548d8274307c5b5))
- **engine:** Remove block.loading. ([31b8190](https://github.com/lowdefy/lowdefy/commit/31b8190b8d34cba8ad62b077864f3da009f0d659))
- Fix bugs in icon and icon usage in docs. ([03858f4](https://github.com/lowdefy/lowdefy/commit/03858f43502404de39024b38fac1c5f87d5c99ca))
- Fix icon names. ([2e81f58](https://github.com/lowdefy/lowdefy/commit/2e81f589fba193e7039dc7c099855831ff9a61fb))
- Fix plugins in build. ([ec8d5ca](https://github.com/lowdefy/lowdefy/commit/ec8d5ca6adc7c482e5a4ab5c2edcc7ae7026f7e8))
- **operators:** Pass operatorPrefix to operators methods. ([454523c](https://github.com/lowdefy/lowdefy/commit/454523c1ac3176c01318f9d2f59d7a4f4b7f5e7d))
- **operators:** Update test snapshot. ([655eae5](https://github.com/lowdefy/lowdefy/commit/655eae5c57204c6fd17388568d5fdf419d9a1da1))
- Replace progressBarDispatcher with process object. ([9aff083](https://github.com/lowdefy/lowdefy/commit/9aff0833104c5fed304b071f5fdbd64593a45aa5))
- Review feedback changes. ([6925625](https://github.com/lowdefy/lowdefy/commit/69256253142813f0b78c353d0698f13386d10929))
- **server-dev:** Add actions.js to build watcher. ([f9f295e](https://github.com/lowdefy/lowdefy/commit/f9f295e37cc627e1f7f2d414d9e42c7c67f45f23))
- **server-dev:** Do not render page before redirect. ([b4431b1](https://github.com/lowdefy/lowdefy/commit/b4431b17b36576cfc8cd30a5d1e2485502fd337e))
- **server-dev:** Render app rebuild page. ([7895b53](https://github.com/lowdefy/lowdefy/commit/7895b53691f83b81629c2f4dfb174c858571c407))
- **server:** Add actions-core as default to server. ([eed470f](https://github.com/lowdefy/lowdefy/commit/eed470ff2cda71028b2a152a7cbf2054bc1ef2fa))
- **server:** Bug fixes on loading inc, and add auto inc. ([dba6f49](https://github.com/lowdefy/lowdefy/commit/dba6f496666dda86428dba5fbc94dceb0a571b9d))
- **server:** Cleanup from review. ([d4dd1ca](https://github.com/lowdefy/lowdefy/commit/d4dd1cadf30ddc1f9b9700bd8c5699675607c117))
- **server:** Remount progress controller on page change. ([967ac70](https://github.com/lowdefy/lowdefy/commit/967ac70078be00b3aa2f16ed6419a971debf31dc))
- **server:** Remove block.loading. ([0995109](https://github.com/lowdefy/lowdefy/commit/09951094e15371ed9be1b36a093d0463ec0b8d70))
- Update docs snapshot test ([8987ad8](https://github.com/lowdefy/lowdefy/commit/8987ad8652158bfb66a7334d7745c99d6b49ce11))
- Update snapshots. ([19db923](https://github.com/lowdefy/lowdefy/commit/19db92316c4a1f6aeccf8bb31a3f9ba8e7e66d5a))

### Features

- **api:** evaluteOperators is sync. ([40ba4df](https://github.com/lowdefy/lowdefy/commit/40ba4df14370a7a928ffc1487092b529211b2636))
- **block-loaders:** Add progress block. ([a872dfc](https://github.com/lowdefy/lowdefy/commit/a872dfcf81e911a10996fcd4b179e6e8ed2e1262))
- **blocks-antd:** Remove color settings for menu, etc. ([bacaedb](https://github.com/lowdefy/lowdefy/commit/bacaedbbc8911b9ad4eaf36d2ecb7f60e536e331))
- **blocks-antd:** Update snapshots. ([5f5ef00](https://github.com/lowdefy/lowdefy/commit/5f5ef001c203b6c85564184683ece5fd968eea37))
- **blocks-markdown:** Use antd less style vars where possible. ([bc3dce4](https://github.com/lowdefy/lowdefy/commit/bc3dce444f629ab8964ef8b84ec2a468e0b23f17))
- **blocks:** Add skeletons to blocks meta. ([ba34939](https://github.com/lowdefy/lowdefy/commit/ba349397359d4f54d7850536329ec0682ffcf89c))
- **blocks:** loading to render inputs but disable. ([1662f36](https://github.com/lowdefy/lowdefy/commit/1662f3668402bdce09a7ec814665525fc204f365))
- **blocks:** Remove loading prop from blocks. ([fc2def3](https://github.com/lowdefy/lowdefy/commit/fc2def366c7f23d09622a60e3d716f6c995ef4e6))
- **blocks:** Remove skeleton definition on blocks. ([f938a51](https://github.com/lowdefy/lowdefy/commit/f938a51268a7c0e5fa129c0628662890b635c8c7))
- **build:** Add loading and skeleton to blocks schema. ([1398ca3](https://github.com/lowdefy/lowdefy/commit/1398ca3506a5cd4f116b87feb7feb7f06e3de518))
- **build:** Add mandatory block types. ([2351f10](https://github.com/lowdefy/lowdefy/commit/2351f106304408445edcc91407736c96d7109292))
- **build:** Build changes for skeleton and loading. ([b1d4212](https://github.com/lowdefy/lowdefy/commit/b1d4212ddd934ec67d6e305e7255ea3aa89fdf96))
- **client:** Add display message implementation. ([f94ee32](https://github.com/lowdefy/lowdefy/commit/f94ee32a797b61b5f0f2bcc4de429b815f6de864))
- **client:** Apply reset context flag to recreate context on client. ([09f49a2](https://github.com/lowdefy/lowdefy/commit/09f49a2072f2803268b20f69655e03a57ef8f097))
- **client:** Init @lowdefy/client. ([bb7931d](https://github.com/lowdefy/lowdefy/commit/bb7931d0da4ca3614ae4223ca19663a9088d2a45))
- **docs:** Fix loading and skeleton definitions on blocks concept pages. ([b6207a9](https://github.com/lowdefy/lowdefy/commit/b6207a96ecd99b00e7ed0a3a2151f96ab48d509f))
- **docs:** Remove onEnter and fix onInit and onMount definitions. ([051154f](https://github.com/lowdefy/lowdefy/commit/051154fb5b027407907659547905f87c1557e45a))
- **engine:** Add progress callAction — needs tests. ([771961c](https://github.com/lowdefy/lowdefy/commit/771961ca1dc69b197b2d3bb20d1427bb63916c0d))
- **engine:** Add runOnInit method to getContext. ([2339a3a](https://github.com/lowdefy/lowdefy/commit/2339a3a77da875e688115f7111bde1e8d706761d))
- **engine:** Add skeleton and loading eval. ([c3c35d1](https://github.com/lowdefy/lowdefy/commit/c3c35d164265576ecdf2e42bded041ba16b918f1))
- **engine:** Make getContext sync, add skeleton and loading eval. ([a876b6f](https://github.com/lowdefy/lowdefy/commit/a876b6f8cf92d1bbfd3986bb051dc69a6e1d141f))
- **operators:** Remove init so parser is now sync. ([aabedad](https://github.com/lowdefy/lowdefy/commit/aabedad46c3b27687c8095360f313f5e9e7fe19d))
- **server-dev:** Client working 🏄‍♂️ ([cafca66](https://github.com/lowdefy/lowdefy/commit/cafca662ee00379ba1d7d38acf886e718174d624))
- **server-dev:** Reload to pass resetContext flag. ([f303bc0](https://github.com/lowdefy/lowdefy/commit/f303bc046164c0d0370af66c3f7741eb04d7a93c))
- **server-dev:** Use Client in dev server. ([4089191](https://github.com/lowdefy/lowdefy/commit/4089191bc84b5e8832e358136c491985872d59fc))
- **server:** Context is now sync, use MountEvents for onInit. ([8f0ed25](https://github.com/lowdefy/lowdefy/commit/8f0ed25401f0f4cb2ee342c6511513f182ab65f5))
- **server:** Make initLowdefyContext sync. ([ef11ebb](https://github.com/lowdefy/lowdefy/commit/ef11ebb3e3cb633310c533cfecb565018914ca60))
- **server:** MountEvents, ProgressBarController and loading state. ([931dda7](https://github.com/lowdefy/lowdefy/commit/931dda7a140bd456724b83c0a28e5b6fb7c873c5))
- **server:** Refine loading in render loop, remove onEnter. ([8c67b98](https://github.com/lowdefy/lowdefy/commit/8c67b986c30535b249eb55677e45a5cf556056be))
- **server:** Remove block skeleton render. ([8ce8882](https://github.com/lowdefy/lowdefy/commit/8ce888259bc66e00b8e03e1fd2fe57b265166f5b))
- **server:** Render loop for skeleton and loading. ([3ec944b](https://github.com/lowdefy/lowdefy/commit/3ec944b752aae46270f991f52417a9e9bfd14098))
- **server:** Throw warning on illegal skeleton type. ([86bbae6](https://github.com/lowdefy/lowdefy/commit/86bbae69e80ff4539502e4faec4c3c4a45231a85))
- **server:** User Client in server. ([31de543](https://github.com/lowdefy/lowdefy/commit/31de543757f2b82ac38d9a5b0c81278ae9561de1))

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

### Bug Fixes

- **actions-core:** Fix Throw action error message if params are not an object. ([057ff7e](https://github.com/lowdefy/lowdefy/commit/057ff7eb84171e7fd68a9725133bd0472a771895))
- **actions-core:** Improve Throw action error messages. ([9ffddd6](https://github.com/lowdefy/lowdefy/commit/9ffddd6778bcc626ccd055be2dcd5b1cdde2400b))
- **block-utils:** Update test snapshots. ([445d20d](https://github.com/lowdefy/lowdefy/commit/445d20dd5ad93dfe57b420d14878f6e5b436fc55))
- **block-utils:** Wrap Icon in antd Icon component. ([07dc80a](https://github.com/lowdefy/lowdefy/commit/07dc80a08defbb322f77f9de350b5bb4a08a3d54))
- **blocks-antd:** Fix Icon name in switch. ([96e5e46](https://github.com/lowdefy/lowdefy/commit/96e5e460d02ef4016a6bcfa2e613e8e8fe9eee01))
- **blocks-antd:** Icon name corrections. ([7fa29e4](https://github.com/lowdefy/lowdefy/commit/7fa29e4290d533f252390cf48f2059c178ca7c34))
- **build:** Do not use ref resolver for lowdefy.yml files. ([3c05e57](https://github.com/lowdefy/lowdefy/commit/3c05e57749b2c9315589d77750198c99f4fe3526))
- Change swc react transform to classic runtime. ([55bb5c9](https://github.com/lowdefy/lowdefy/commit/55bb5c927e7314084fc2fbe9471d58f5099909bd))
- **cli:** Do not merge app and server package jsons ([7a97261](https://github.com/lowdefy/lowdefy/commit/7a972615431ed8993a207c69839837ebe4e69c4a))
- **cli:** Fix CLI tests. ([1c8dc54](https://github.com/lowdefy/lowdefy/commit/1c8dc544af0ed052697ba9ff0e7a47124ffb6a03))
- **docs:** Correct icon names for react-icons. ([4cae725](https://github.com/lowdefy/lowdefy/commit/4cae725caabc72848bf96ad1dc29d797d152cf27))
- **docs:** Fix \_yaml.parse takes an array. ([0943aa0](https://github.com/lowdefy/lowdefy/commit/0943aa0812ac84535d82e01825681c186fcb14ca))
- **docs:** Fix image route paths in docs. ([895d26d](https://github.com/lowdefy/lowdefy/commit/895d26d2b1ba10bd5b4ece5af73e6dd2e163da1d))
- **docs:** Fix JSON syntax error in S3 docs. ([0aa7501](https://github.com/lowdefy/lowdefy/commit/0aa7501bfcf88b144f6cf6f32a4395ea67647571))
- **docs:** Fixes in tests. ([567afa4](https://github.com/lowdefy/lowdefy/commit/567afa449182834d3d673672c6408f1e8b57f420))
- **operators:** Fix operators failing tests. ([c25b6b6](https://github.com/lowdefy/lowdefy/commit/c25b6b6ea3a6f1100daba2653b263f8aed64a8c4))
- Remove \_user from build operators and rogue console.log ([bc39f77](https://github.com/lowdefy/lowdefy/commit/bc39f77ba9b94ebecdda164a6260caf69cf89c34))
- Remove \_user from build operators. ([a812d71](https://github.com/lowdefy/lowdefy/commit/a812d71491528e6e3fa3a73b3492abdcc6a145c1))
- Revert back to react 17.0.2. ([1b38fd3](https://github.com/lowdefy/lowdefy/commit/1b38fd3e743ee7286468c7c1e2f623838dd5ed84))
- **server-dev:** Read next cli bin path from package.json. ([0146627](https://github.com/lowdefy/lowdefy/commit/01466276dcfffef1ee6f2d7b50205ddd4e48edad))
- **server:** Add index to keys to resolve react warning. ([0f25b57](https://github.com/lowdefy/lowdefy/commit/0f25b5768f09327f68703b80f63f891b1645b1e3))
- **server:** Disable ssr on \_app. ([1b13e57](https://github.com/lowdefy/lowdefy/commit/1b13e5715c29783b076878ad935626a05f7ba343))

### Features

- Add operator-js dependency to build ([83d5b79](https://github.com/lowdefy/lowdefy/commit/83d5b79cec2dc7cdc62c5b51a96dd3d50b1b26c4))
- Add support for typePrefix on custom plugins. ([d66d395](https://github.com/lowdefy/lowdefy/commit/d66d395e01688af917bda0722beba7a8a5886085))
- **blocks-color-seletors:** Replace color selectors with single color selector using react-colorful. ([7830890](https://github.com/lowdefy/lowdefy/commit/78308908c41a35b6611af07abfb84a8ee8368d93))
- **cli:** Add install custom plugins as dev dependencies. ([b6ab43b](https://github.com/lowdefy/lowdefy/commit/b6ab43bae01f10a9b2762b180d1f7d92df712e80))
- **cli:** Copy plugins folder to server. ([9f4ff92](https://github.com/lowdefy/lowdefy/commit/9f4ff92573b164c0cbfe42087e54adac60b6a74a))
- **cli:** Merge user package json into server package json. ([899a15f](https://github.com/lowdefy/lowdefy/commit/899a15f6c515d3be28d67126b653124fb7acf92c))
- Create \_env operator and build operators. ([e7421bd](https://github.com/lowdefy/lowdefy/commit/e7421bd237d77d0cc9c95ab0cffaf38ba96b2035))
- Create types map for custom plugins. ([5ddf739](https://github.com/lowdefy/lowdefy/commit/5ddf739103b7bdea57bf0a5903433555368c43c3))
- Custom plugins on dev server. ([9f65d13](https://github.com/lowdefy/lowdefy/commit/9f65d130d70494ebd74fb0ae3cf6edb4cbf31415))
- **docs:** Implement docs filter default value operator as plugin. ([fa46d22](https://github.com/lowdefy/lowdefy/commit/fa46d2267559dede520e0ddba0d070105bb85545))
- **docs:** Replace color selectors with react-colorful selector. ([3d146aa](https://github.com/lowdefy/lowdefy/commit/3d146aae853d2d437fa2a128380c13b09949365c))
- Evaluate build operators in refs. ([f8e2214](https://github.com/lowdefy/lowdefy/commit/f8e22143868b3de69147648f40c17c6d26191b22))
- **operators:** Update parse for build operators. ([d2f5f45](https://github.com/lowdefy/lowdefy/commit/d2f5f45766a59320a7234dad31f291443da38b9b))
- Simplify \_function with new operatorPrefix ([139dae6](https://github.com/lowdefy/lowdefy/commit/139dae657c4ccbd462b59744eaf5f5951f1741b3))

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- **actions-core:** Added scrollTo with no params error test. ([1402180](https://github.com/lowdefy/lowdefy/commit/140218075f0f9ce00c0e930a7b18db5629bb1ab0))
- **actions-core:** Added testContext for action testing. ([2f6189b](https://github.com/lowdefy/lowdefy/commit/2f6189b6405ccaa1e0ffbf055669970f60300476))
- **actions-core:** Changed param type check in DisplayMessage action. ([3d85e26](https://github.com/lowdefy/lowdefy/commit/3d85e26ac5b5f33897032d04ebd6e20ab1944168))
- **actions-core:** Refactored actions to use actions interface. ([563900b](https://github.com/lowdefy/lowdefy/commit/563900ba49e6025862e9444743a485952c0d2c1c))
- **actions-core:** Updated ScrollTo action tests. ([ae202f2](https://github.com/lowdefy/lowdefy/commit/ae202f2d1db7f5e56c60d4da384c2f15d8a53a18))
- **actions-core:** Updated ScrollTo action to include param error handling. ([25b656f](https://github.com/lowdefy/lowdefy/commit/25b656f115da074b7da266ce81c0bc975db2c109))
- **actions-core:** Updated Throw action tests to use new plugin config. ([ccf4fd1](https://github.com/lowdefy/lowdefy/commit/ccf4fd14c3a112f74d89939166db0e17972c95a7))
- **actions-core:** Updated Wait action tests to use new plugin config. ([abb74af](https://github.com/lowdefy/lowdefy/commit/abb74afc8e68e32960cb1c50f7930e79bbcfbed8))
- Add missing api and helpers tests. ([aa1d72c](https://github.com/lowdefy/lowdefy/commit/aa1d72c19122eb7d4343108ba6ad21c423dc2493))
- Add operators used by validation to plugin imports. ([02abd41](https://github.com/lowdefy/lowdefy/commit/02abd41e8eb7e9d1f2637de8f85fbe5dfee350ee))
- Add packages/cli/server/ to git ignore. ([20f02bd](https://github.com/lowdefy/lowdefy/commit/20f02bdef929184338a62875c6207c2ffd584e81))
- Add yarn install to dev scripts for server. ([dc7f988](https://github.com/lowdefy/lowdefy/commit/dc7f98827e5b97fe96ac2008779b8d2f456d0adb))
- **api:** Fix callRequest tests. ([58655cb](https://github.com/lowdefy/lowdefy/commit/58655cba190a3a2371e301d2bf4779bd13651ad5))
- **api:** Fixes using jest with es modules. ([d69a4dc](https://github.com/lowdefy/lowdefy/commit/d69a4dca33d49c639b3c80d90eed4ffa6ef28950))
- **blocks-antd:** Refactored tests to use new Block config. ([1919560](https://github.com/lowdefy/lowdefy/commit/191956023512213203b78f66bfcdebc451202eb0))
- **blocks-antd:** Temporary for schema for TimelineList. ([ce8640d](https://github.com/lowdefy/lowdefy/commit/ce8640d85b5ff7daa3610fe145a4569ec4c91777))
- **blocks-basic:** Refactored tests to use new Block config. ([37ba69d](https://github.com/lowdefy/lowdefy/commit/37ba69dd60301cbdbbba88bbab2f0b9573c77608))
- **blocks-color-selectors:** Fix typo in style import. ([7a90f5b](https://github.com/lowdefy/lowdefy/commit/7a90f5b3edbf8e081aa73bf40db2768bf43c2107))
- **blocks-color-selectors:** Refactored tests to use new Block config. ([bd38975](https://github.com/lowdefy/lowdefy/commit/bd389752dccb8030ad80da0f717e8ecaba71c7fd))
- **blocks-echarts:** Refactored tests to use new Block config. ([d17e34e](https://github.com/lowdefy/lowdefy/commit/d17e34ebf82a40f7f8fc28e97917e1f2f971e733))
- **blocks-loaders:** Refactored tests to use new Block config. ([e4f4590](https://github.com/lowdefy/lowdefy/commit/e4f45908e934c0f4929288db7204fba1dc66fb1e))
- **blocks-markdown:** Refactored tests to use new Block config. ([b963944](https://github.com/lowdefy/lowdefy/commit/b96394456f972386fe3395331ac0c1fb82c3ac07))
- **bock-utils:** Fix icon properties, size might be an issue. ([cd2b9ad](https://github.com/lowdefy/lowdefy/commit/cd2b9ad3957cb9a30019b94e3129a17ff6f3fc3f))
- **build:** Add writeActionImports to build. ([f0889d2](https://github.com/lowdefy/lowdefy/commit/f0889d238ca2e0558a59913b6f68069b018bc25f))
- **build:** Events with try defined should add default for catch. ([bb36b55](https://github.com/lowdefy/lowdefy/commit/bb36b55d7c3a06dea1a448fb6b588b12547141b4))
- **build:** Fix build tests. ([417f5cb](https://github.com/lowdefy/lowdefy/commit/417f5cb0043ca4e62bcedac192a5965217b0219c))
- **build:** Fix error message when block is not an object. ([5bc113b](https://github.com/lowdefy/lowdefy/commit/5bc113b18cc30090d9862d95dc6d021b0fe9af6b))
- **build:** Fix jest with es modules. ([a4d089a](https://github.com/lowdefy/lowdefy/commit/a4d089afa25363a19cddb0ee62d4e0211f1cfda3))
- **build:** Move page not an object error to addDefaultPages. ([b3c980d](https://github.com/lowdefy/lowdefy/commit/b3c980d2bfc99d1ef4f48a5fb9ef6f99353a4fd6))
- **build:** Throw better error for incorrect user transformer functions. ([d796de3](https://github.com/lowdefy/lowdefy/commit/d796de3cc7e3bf8602d76e5190cfd1d4f71c775a))
- **build:** Throw instead of logging error for build. ([cccaabc](https://github.com/lowdefy/lowdefy/commit/cccaabcdaeb357dc8c1382310166cd96af10b2e0))
- **cli:** Change additional base dir references to config. ([e20cfdf](https://github.com/lowdefy/lowdefy/commit/e20cfdfdcb1f079ea80450b87608ae57ab4e30f8))
- **cli:** Fix icon in init command. ([295faba](https://github.com/lowdefy/lowdefy/commit/295faba2bf0c9dec826fa0c589e3a7e729e635e9))
- **cli:** Fix jest es module mocks. ([78480e8](https://github.com/lowdefy/lowdefy/commit/78480e80022f79a0ab449a9a8d804e6213b676c4))
- **connection-elasticsearch:** Add license comments in schema files. ([43ec9a0](https://github.com/lowdefy/lowdefy/commit/43ec9a07c988fdf85ee4b217fff767290f0f88a2))
- **connection-elasticsearch:** Fix connection-elasticsearch plugin structure to work with version 4. ([f0c55e8](https://github.com/lowdefy/lowdefy/commit/f0c55e8afd69da8581285c9b1805e72e858e4dad))
- **connection-google-sheets:** Add license comments in schema files. ([c230318](https://github.com/lowdefy/lowdefy/commit/c23031842a2ff7cd1177235874f16a9747121801))
- **connection-google-sheets:** Fix connection-google-sheets plugin structure to work with version 4. ([2c19747](https://github.com/lowdefy/lowdefy/commit/2c1974748625a2262edb068f3a8317474eaaee50))
- **connection-google-sheets:** Revert mingo system imports. ([66a42c7](https://github.com/lowdefy/lowdefy/commit/66a42c7dc53c3bd3e54cbf3f16661750416a0d33))
- **connection-knex:** Add license comments in schema files. ([916452b](https://github.com/lowdefy/lowdefy/commit/916452b8106668f8d5e65773863abfd122b46b95))
- **connection-knex:** Fix connection-knex plugin structure to work with version 4. ([ffc9c35](https://github.com/lowdefy/lowdefy/commit/ffc9c351590921f0008192c4106ba4fab8c82e73))
- **connection-mongodb:** Add license comments in schema files. ([0872590](https://github.com/lowdefy/lowdefy/commit/08725905456a3c00d0c00ae3ed2fc5cdde2bd24e))
- **connection-mongodb:** Fix connection-mongodb plugin structure to work with version 4. ([a8b9da9](https://github.com/lowdefy/lowdefy/commit/a8b9da9707fe7aa77e64f042ac36a8efb135329b))
- **connection-mongodb:** Update dependency mongodb to v4.4.0. ([0655365](https://github.com/lowdefy/lowdefy/commit/065536568199fb5cee12d8108b910b675ac5981d))
- **connection-mongodb:** Update MongoDB connection docs ([7f0fccf](https://github.com/lowdefy/lowdefy/commit/7f0fccffe308a14331c8c6f3ddb3c4579387facb))
- **connection-sendgrid:** Add license comments in schema files. ([1850af3](https://github.com/lowdefy/lowdefy/commit/1850af3336bf4983d34b6386bdc77419b51815ed))
- **connection-sendgrid:** Fix connection-sendgrid plugin structure to work with version 4. ([1baeb0f](https://github.com/lowdefy/lowdefy/commit/1baeb0faaac7a9a008984f7a333e902d8b3be4dc))
- **connection-stripe:** Add license comments in schema files. ([cf4a614](https://github.com/lowdefy/lowdefy/commit/cf4a614d77035fd954f4a2bc3111dd270d6604e9))
- **connection-stripe:** Fix connection-stripe plugin structure to work with version 4. ([3a35829](https://github.com/lowdefy/lowdefy/commit/3a35829edae64dcd5d558698d7bc469fe9d55f0e))
- Convert link to pass pathname and query separately. ([1294914](https://github.com/lowdefy/lowdefy/commit/1294914fae0cafbe9165db230b2cf418a97e71b7))
- Convert links to use pathname and query. ([1189a8b](https://github.com/lowdefy/lowdefy/commit/1189a8bdbb6ade52eee7e8223603dc4d2dcd6223))
- **deps:** Downgrade dependency swr to v1.1.2. ([80b047f](https://github.com/lowdefy/lowdefy/commit/80b047fb8e5684d032026d9e10b50114a67af89f))
- **deps:** Update dependecy next to v12.0.10 ([c058935](https://github.com/lowdefy/lowdefy/commit/c05893578f8d5f625391b560ec24411d16df902d))
- **deps:** Update dependency @elastic/elasticsearch to v7.16.0. ([ed1346e](https://github.com/lowdefy/lowdefy/commit/ed1346ebd45a2cc6f7b2802c6cd3fb032cbaab92))
- **deps:** Update dependency @sendgrid/mail to v7.6.0. ([f44d267](https://github.com/lowdefy/lowdefy/commit/f44d267e6f2dfd060c40bbae7c6d1d6296b8f0a9))
- **deps:** Update dependency ajv to v8.9.0. ([efd18da](https://github.com/lowdefy/lowdefy/commit/efd18da6b146a60db286af00353bac0e12667884))
- **deps:** Update dependency aws-sdk to v2.1066.0. ([766acde](https://github.com/lowdefy/lowdefy/commit/766acde8de455290076e1aba97fd2ed7f8c50610))
- **deps:** Update dependency axios to v0.25.0. ([ddf13bb](https://github.com/lowdefy/lowdefy/commit/ddf13bb7f891bbb328f1ac6aea3e34894d80c42c))
- **deps:** Update dependency chokidar to v3.5.3. ([4513321](https://github.com/lowdefy/lowdefy/commit/45133218d83e9751746e1c71c6f9fa44a5b50ead))
- **deps:** Update dependency commander to v9.0.0. ([aebd5be](https://github.com/lowdefy/lowdefy/commit/aebd5bec6b28d0242d60d3ac92a667b5e39c8aca))
- **deps:** Update dependency dompurify to v2.3.5. ([41dbc3d](https://github.com/lowdefy/lowdefy/commit/41dbc3d67f0bc55214add6125cda06946eca7ac1))
- **deps:** Update dependency dotenv to v15.0.0. ([682620c](https://github.com/lowdefy/lowdefy/commit/682620c99c0e53d31467b6c3d5146f0eba596ab1))
- **deps:** Update dependency echarts to v5.3.0. ([6571f98](https://github.com/lowdefy/lowdefy/commit/6571f988c07e02df4d1ba076f4b214918358e3e9))
- **deps:** Update dependency echarts-for-react to v3.0.2. ([e5f7ed6](https://github.com/lowdefy/lowdefy/commit/e5f7ed6494c0fa2a39dc598fc2148eacfb3b9568))
- **deps:** Update dependency google-spreadsheet to v3.2.0. ([2c62cc2](https://github.com/lowdefy/lowdefy/commit/2c62cc2d328ad4dbb6927844c2ab5b8d5a48380e))
- **deps:** Update dependency knex to v1.0.1. ([26863fc](https://github.com/lowdefy/lowdefy/commit/26863fc41bacec7adbd24ced1331639d1334e169))
- **deps:** Update dependency mingo to v6.0.0. ([145dcda](https://github.com/lowdefy/lowdefy/commit/145dcdacc13074070ce8f9c4fc0bac46d8523cd6))
- **deps:** Update dependency mssql to v8.0.1. ([6848ade](https://github.com/lowdefy/lowdefy/commit/6848ade275da966b829282f29f32303845fe9ac7))
- **deps:** Update dependency next-auth to v4.1.2. ([4b63c87](https://github.com/lowdefy/lowdefy/commit/4b63c8774fab7adbc3e11f92a5e808b38d22f4c9))
- **deps:** Update dependency next-with-less to v2.0.4. ([7c71492](https://github.com/lowdefy/lowdefy/commit/7c714926ee0caeba362af78b594698635f34c70f))
- **deps:** Update dependency query-string to v7.1.0. ([f434ee9](https://github.com/lowdefy/lowdefy/commit/f434ee942e7a58228b84db4406cfeb03f55e5e5f))
- **deps:** Update dependency react to v18.0.0-rc.0 ([2345330](https://github.com/lowdefy/lowdefy/commit/23453301716f541a1e044f63a740aae09d635237))
- **deps:** Update dependency react-markdown to v8.0.0. ([f04e35b](https://github.com/lowdefy/lowdefy/commit/f04e35bff26393f425f5711a66ac23dc4031a943))
- **deps:** Update dependency redis to v4.0.3. ([c4b0e75](https://github.com/lowdefy/lowdefy/commit/c4b0e757960b994593166d58298c23ded4269bbf))
- **deps:** Update dependency rehype-raw to v6.1.1. ([e13b0f1](https://github.com/lowdefy/lowdefy/commit/e13b0f18c2c974845421821899ac132fe25f871d))
- **deps:** Update dependency stripe to v8.201.0. ([964efb4](https://github.com/lowdefy/lowdefy/commit/964efb445bfbcc36625405f33895afbef1a9c686))
- **deps:** Update dependency swr to v1.2.0. ([8c55376](https://github.com/lowdefy/lowdefy/commit/8c55376080ea89f015f208262c097e5201c21d79))
- **deps:** Update dependency yargs to v17.3.1. ([277776c](https://github.com/lowdefy/lowdefy/commit/277776c7294e57a95dfcf86d300bb20ea4742043))
- **deps:** Update emotion css packages. ([3380594](https://github.com/lowdefy/lowdefy/commit/33805944e30e919c57e3e7e1876b9c6723c3988d))
- **docs:** Add CircleColorSelector to transformer and fix typo. ([9eea4f1](https://github.com/lowdefy/lowdefy/commit/9eea4f10b145929ace661f52809594cb02580a00))
- **docs:** Add docs on ES Modules in build resolvers and transformers. ([8a3605e](https://github.com/lowdefy/lowdefy/commit/8a3605e840b9f0a86fbf58f47ecbb507e85605fe))
- **docs:** Comment our JsAction usage. ([27a2361](https://github.com/lowdefy/lowdefy/commit/27a2361fc626a78a7b34b2bcdd074bc352a6a677))
- **docs:** Update paths for all blocks and some icon name fixes. ([e4369bb](https://github.com/lowdefy/lowdefy/commit/e4369bb3453c19d76f083b139f317de7dd96e090))
- Downgrade dependency ora to v5.4.1 ([ea28ea5](https://github.com/lowdefy/lowdefy/commit/ea28ea51c2c2371e0636d3f9bc66b07470563bce))
- **engine:** Changed method action from getRequest to getRequestDetails. ([32c0b7c](https://github.com/lowdefy/lowdefy/commit/32c0b7c96f07e16c5a4b16b8501ea44da3f2ba76))
- **engine:** Fixed validate action method context reference. ([576e3a9](https://github.com/lowdefy/lowdefy/commit/576e3a9fe8234a61ed5f3237ea44cc309e4cb27d))
- **engine:** Reset input when link is followed with no input. ([fab9e2a](https://github.com/lowdefy/lowdefy/commit/fab9e2a3fb1d59ff604bee2b95edf0e8464f0a42))
- **engine:** Reverted index based block id change in callMethod action test. ([46ad3c0](https://github.com/lowdefy/lowdefy/commit/46ad3c07982dacb481b1513750db19b55fe89382))
- **engine:** Update set global action method global object reference. ([91fa543](https://github.com/lowdefy/lowdefy/commit/91fa543969a33e119df23b716d04acca55edcaf0))
- **engine:** Updated callMethod action method to use action & block plugin config. ([ddd849e](https://github.com/lowdefy/lowdefy/commit/ddd849e2de6b9691041d098fe53ace1db5940451))
- **engine:** Updated link action method test to use action & block plugin config. ([1306698](https://github.com/lowdefy/lowdefy/commit/1306698ebbd9fe6b41c77628da70c2b7f95a4e13))
- **engine:** Updated login action method test to use action & block plugin config. ([4cbd863](https://github.com/lowdefy/lowdefy/commit/4cbd863cfe8f2b325dc3e9bea4d54d1f4c1d97b7))
- **engine:** Updated logout action method test to use action & block plugin config. ([e120fe8](https://github.com/lowdefy/lowdefy/commit/e120fe88beb39fb59661151c15429c4d926782be))
- **engine:** Updated message action method test to use action & block plugin config. ([48cd251](https://github.com/lowdefy/lowdefy/commit/48cd2515e51ba769437dd3509f55b68f571a0757))
- **engine:** Updated request action method test to use action & block plugin config. ([d2bd2f5](https://github.com/lowdefy/lowdefy/commit/d2bd2f5fc207eeb15ec86559dc4bec726e037071))
- **engine:** Updated reset action method test to use action & block plugin config. ([d46add8](https://github.com/lowdefy/lowdefy/commit/d46add8f05279253cf99955315e6acda9b42a516))
- **engine:** Updated resetValidation action method test to use new plugin config. ([107a1a5](https://github.com/lowdefy/lowdefy/commit/107a1a50000d9ca731370cc41bca2e5f7d564bad))
- **engine:** Updated setGlobal action method test to use new plugin config. ([ceceec3](https://github.com/lowdefy/lowdefy/commit/ceceec34da9973d054d2138232832b2fd5aeb5aa))
- **engine:** Updated setState action method test to use new plugin config. ([27838bc](https://github.com/lowdefy/lowdefy/commit/27838bcf75bba256d13f7a72b1bfd6e1d41bceeb))
- **engine:** Updated testContext to use rootBlock config. ([c8524c6](https://github.com/lowdefy/lowdefy/commit/c8524c6742d3f45109f15ace6e2d84b6114b92d8))
- **engine:** Updated validate action method test to use new plugin config. ([f8962c6](https://github.com/lowdefy/lowdefy/commit/f8962c6451e92c467ae882c55ac0859e92ca2ba0))
- Fix docs transformer fns tests. ([8a0e331](https://github.com/lowdefy/lowdefy/commit/8a0e3313abe15bee9ce28aa2d8b8f91a3482bae3))
- Fix import issues for build. ([64a076c](https://github.com/lowdefy/lowdefy/commit/64a076cdc91b77a4b067972f77e99bfc2c571650))
- Fix util package tests. ([9d0cc45](https://github.com/lowdefy/lowdefy/commit/9d0cc45cffd3a373492bc842ba54a7254f7c509f))
- Fix V4 tests. ([d082d0c](https://github.com/lowdefy/lowdefy/commit/d082d0c335eb4426acadbf30a08de64266d9f004))
- Move S3UploadButton to plugin-aws. ([540aa03](https://github.com/lowdefy/lowdefy/commit/540aa035d2ed0672b0f3e233c1cee90e82d4bb52))
- **node-utils:** Convert writeFile function prototype. ([5371430](https://github.com/lowdefy/lowdefy/commit/53714307123f3477240767a91c5332a70a292d93))
- **node-utils:** Do not throw if readFile path is not resolved. ([b451c29](https://github.com/lowdefy/lowdefy/commit/b451c29b4a904bfdbaa31e9316b488935bdf8571))
- **operators-js:** Fix array, function, operator, type tests ([4d19d48](https://github.com/lowdefy/lowdefy/commit/4d19d48f5bdc48442820946c18d5d08c000d9c1c))
- **operators-js:** Fix getter operator tests. ([c774f3f](https://github.com/lowdefy/lowdefy/commit/c774f3f31fcbdf16aabd99d1cf76714cfa4b109f))
- **operators-js:** Fix menu and location tests ([3fac862](https://github.com/lowdefy/lowdefy/commit/3fac862c58dea6b293d9556f4e8f17dd169021d8))
- **operators-js:** Update request tests. ([f78405f](https://github.com/lowdefy/lowdefy/commit/f78405f48602f97b6954ceb07bf2e9dfb5bf5e7a))
- **operators-js:** Update shared operators tests. ([1c6cb87](https://github.com/lowdefy/lowdefy/commit/1c6cb87c59116ca02dfe02d7f76450345afa7918))
- **operators-js:** Update test name and license wording. ([708beac](https://github.com/lowdefy/lowdefy/commit/708beacc11f8de1c09c7abef3fae724f74c70d6a))
- **operators-nunjucks:** Fix tests. ([6b5d8c8](https://github.com/lowdefy/lowdefy/commit/6b5d8c81b1a14a98c0dfc0f4febb87f0fb6f6ba0))
- **plugin-aws:** Convert @lowdefy/plugin-aws to new plugin package structure. ([64043d3](https://github.com/lowdefy/lowdefy/commit/64043d3ddee84fcfc40b60ed777eff688517c2c8))
- Remove rc-animate from yarnrc config. ([0a037d1](https://github.com/lowdefy/lowdefy/commit/0a037d1218e652e02e03df36fbb8bf676c16a5d0))
- **server-dev:** Add dev server manager description. ([18cf9c2](https://github.com/lowdefy/lowdefy/commit/18cf9c2941f0001d98eed5c79dac2b111f6c6eee))
- **server-dev:** Do not error if .env file does not exist. ([fa389a1](https://github.com/lowdefy/lowdefy/commit/fa389a17eff8d716e4cc45c1262f4e3d69bdb71d))
- **server-dev:** Fix redirect. ([96ed764](https://github.com/lowdefy/lowdefy/commit/96ed764458ebed076d5bee246622c2fb457d9f33))
- **server:** Maintain the lowdefy objects during page transitions. ([4b3d061](https://github.com/lowdefy/lowdefy/commit/4b3d061a0de79b86b0fa8be9ff8948a9dc0caeb7))
- **servr-dev:** Fix 404 redirect so that browser back works. ([9df6579](https://github.com/lowdefy/lowdefy/commit/9df6579198c0dd0aef9092a98c1b455fac41a761))
- Strip auth prop from page config in api. ([693667d](https://github.com/lowdefy/lowdefy/commit/693667db5bece8081865e74dc2e4391b62f10f93))
- Update createLink tests. ([2e531b3](https://github.com/lowdefy/lowdefy/commit/2e531b385248361fc6f015e0102838462299af06))
- Update docs for Anchor. ([53117b8](https://github.com/lowdefy/lowdefy/commit/53117b88cf759991539265ca84c0f47a9b45a911))

### Features

- **actions-core:** Added CallMethod action test. ([f9333e5](https://github.com/lowdefy/lowdefy/commit/f9333e5a4fd3e7a47100000de1c9ee70488f37ca))
- **actions-core:** Added Link action test. ([d04cc03](https://github.com/lowdefy/lowdefy/commit/d04cc031d9e831c18f01b96a1ae7a05851d92cb6))
- **actions-core:** Added Login action test. ([ba6ac71](https://github.com/lowdefy/lowdefy/commit/ba6ac71731b24c3a003585b5fe4ab4763c40e186))
- **actions-core:** Added Logout action test. ([b67e77d](https://github.com/lowdefy/lowdefy/commit/b67e77d56c415b9349b84b31a49d505dda2af2ff))
- **actions-core:** Added Message action test. ([0404c0d](https://github.com/lowdefy/lowdefy/commit/0404c0d326c18d9447349520fe0e6c64d2512023))
- **actions-core:** Added Request action test. ([696d816](https://github.com/lowdefy/lowdefy/commit/696d8163c1a8128e8ec3e0704e16378b173039c5))
- **actions-core:** Added Reset action test. ([c53d111](https://github.com/lowdefy/lowdefy/commit/c53d111da0811d7822b122641d5cc36d9e61a384))
- **actions-core:** Added ResetValidation action test. ([b5fc499](https://github.com/lowdefy/lowdefy/commit/b5fc49915bdfabca2721c71cf5d5653ee62d27b9))
- **actions-core:** Added SetGlobal action test. ([66c8218](https://github.com/lowdefy/lowdefy/commit/66c8218578a3f3da77c9b722ef3141d205262499))
- **actions-core:** Added SetState action test. ([bfab2e4](https://github.com/lowdefy/lowdefy/commit/bfab2e4b6602c9b2ecf7e720dda7f49725ecb0af))
- **actions-core:** Added Validate action test. ([171aec3](https://github.com/lowdefy/lowdefy/commit/171aec380b7be3ee9ce2d003e2359bf80c82af4a))
- **actions-core:** BREAKING CHANGE - The Message action was renamed to DisplayMessage. ([a9bfe65](https://github.com/lowdefy/lowdefy/commit/a9bfe65f42094d53cd4eee60aa34fbd0a5e180a6))
- **actions-core:** Refactored @lowdefy/engine and added actions-core package to plugins. ([b08ef1d](https://github.com/lowdefy/lowdefy/commit/b08ef1d3944503be83beffb006a284e4460660d9))
- **actions-core:** Updated DisplayMessage action and tests to include edge cases. ([1d70f64](https://github.com/lowdefy/lowdefy/commit/1d70f64983922070916537c0a81b4ed343810365))
- Add build scripts for plugings. ([d37db36](https://github.com/lowdefy/lowdefy/commit/d37db362801de9f0e4d9640fc77e431edeca757a))
- Add start, start:dev and start:server-dev scripts for easy dev ⚡️. ([da813c3](https://github.com/lowdefy/lowdefy/commit/da813c3d13b39fcfdbd50b8d53c3e0b1f5e7e8e2))
- Add start:dev-docs start script. ([0c494fe](https://github.com/lowdefy/lowdefy/commit/0c494fe2ad68d02d9fac0b65a1267ee0ebaf4874))
- Add watch and ignore paths, default ref resolver to dev server and build. ([c700d9f](https://github.com/lowdefy/lowdefy/commit/c700d9fb0efbdb20dcfe5f8916e256de81acd79e))
- **blocks:** Implement Link in blocks. ([2bcf600](https://github.com/lowdefy/lowdefy/commit/2bcf600bd1ae477325cf205069952006e3032b63))
- **build:** Add buildPath to config. ([1cce024](https://github.com/lowdefy/lowdefy/commit/1cce024339bc89e4192d86f09d1a9ec233663f02))
- **build:** Add command line args for build, config and server directories. ([1ef213b](https://github.com/lowdefy/lowdefy/commit/1ef213b19d5eea582f7597310200468a787e897c))
- **build:** Added @lowdefy/actions-core plugin to build process. ([a144735](https://github.com/lowdefy/lowdefy/commit/a144735e2cf7647db5e48b434a53c974d907b4f9))
- **build:** Copy files in config public folder to next public folder. ([ceafdc8](https://github.com/lowdefy/lowdefy/commit/ceafdc8cfca0011425e7a2979e50cd2b32d883b9))
- **build:** Use dynamic import for build resolver and transformer functions. ([c9db72a](https://github.com/lowdefy/lowdefy/commit/c9db72ac55109a85cfc821dfbbf87e54b4881d59))
- **cli:** Add config option for server-dev and server directories. ([07902b0](https://github.com/lowdefy/lowdefy/commit/07902b0e06f9c72a04168842d7f9bb8de470c424))
- **cli:** Add port option for start command. ([9e16e2f](https://github.com/lowdefy/lowdefy/commit/9e16e2f9b920a44ce1ed95172b4e960afe404ffa))
- **cli:** Add port setting to dev command. ([546798a](https://github.com/lowdefy/lowdefy/commit/546798a8fc3ac877b851f31316eb5b0a49d7ac9f))
- **cli:** Pass package manager setting to dev server. ([0425f07](https://github.com/lowdefy/lowdefy/commit/0425f07e4ada328e76488e3ec0aa164ff475df5c))
- **cli:** Rename base-directory to config-directory. ([f09c569](https://github.com/lowdefy/lowdefy/commit/f09c569f0e4207ce31a9e5e002f8eb30ea221bc5))
- **docs:** Add docs for the Link component. ([37b80b1](https://github.com/lowdefy/lowdefy/commit/37b80b172bc078ab4b83f5932fc8d0908c5baf6f))
- **engine:** Added action methods to Actions class. ([e3a32aa](https://github.com/lowdefy/lowdefy/commit/e3a32aae4079fe85124039c1ac736cffb784bd4a))
- **engine:** Added getActions action method test. ([c79c7ed](https://github.com/lowdefy/lowdefy/commit/c79c7ed11da18923395aa8385fb542b5a41c7f96))
- **engine:** Added getBlockId action method test. ([5802217](https://github.com/lowdefy/lowdefy/commit/5802217d3c6b20af5412af2a491f1b9f7852c175))
- **engine:** Added getEvent action method test. ([031535c](https://github.com/lowdefy/lowdefy/commit/031535c553e1f2c7806e810d8b609f3fb3550de3))
- **engine:** Added getGlobal action method test. ([61d23a2](https://github.com/lowdefy/lowdefy/commit/61d23a282ab98202b0b431f7043e381fad7a87c7))
- **engine:** Added getInput action method test. ([5578f46](https://github.com/lowdefy/lowdefy/commit/5578f46978ae78189b90e0ce39c1133add59499d))
- **engine:** Added getPageId action method test. ([602e114](https://github.com/lowdefy/lowdefy/commit/602e114040dcf51cf9f0c259d84a62ab847c2b0d))
- **engine:** Added getRequestDetails action method test. ([55519c5](https://github.com/lowdefy/lowdefy/commit/55519c5c5945ccb2d754ff38798f8917a49bfb5a))
- **engine:** Added getState action method test. ([384d264](https://github.com/lowdefy/lowdefy/commit/384d2645d7f6b56bc9e17937f6d5e82c2c45adbe))
- **engine:** Added getUrlQuery action method test. ([6665f2e](https://github.com/lowdefy/lowdefy/commit/6665f2eaa06c604fedb4de64d0fb414d153af6b4))
- **engine:** Added getUser action method test. ([f7156f5](https://github.com/lowdefy/lowdefy/commit/f7156f5e6f9ebf1178821b46f73ddeba6e6d134a))
- **engine:** BREAKING CHANGE - The Message action was renamed to DisplayMessage. ([6c3abb7](https://github.com/lowdefy/lowdefy/commit/6c3abb71e8e82612c18148c00add90d6d8e1f36f))
- **engine:** Update link to include noLink and disableLink, fix logic. ([b9633e4](https://github.com/lowdefy/lowdefy/commit/b9633e4f105c07efbf192f09038438a0f61b0390))
- Ignore app/\*\* test config. ([f5fad82](https://github.com/lowdefy/lowdefy/commit/f5fad82a9d2e4237c660164bcce3f74dc69c677a))
- Link and basePath implementation for dev server. ([d487a1c](https://github.com/lowdefy/lowdefy/commit/d487a1c7fd496d4342a786ec7c96da13bafafc12))
- **node-utils:** Add copyDirectory. ([852a77a](https://github.com/lowdefy/lowdefy/commit/852a77a6277f0fe9c98cb39e329f60dccdb0793e))
- **node-utils:** Replace rimraf with fs-extra. ([e15031d](https://github.com/lowdefy/lowdefy/commit/e15031d32de3bc60eef5248b9f8440fc14ea11ef))
- **operators:** Change dependancy from js-yaml to yaml. ([cbb71d8](https://github.com/lowdefy/lowdefy/commit/cbb71d809b3117dbaf89b23c17a2229a24235308))
- **server-dev:** Add .env and lowdefy version watchers. ([bc52268](https://github.com/lowdefy/lowdefy/commit/bc522684abce8c050873ef20a3da66ca023cfa32))
- **server-dev:** Add port setting to server-dev. ([f5b0e7e](https://github.com/lowdefy/lowdefy/commit/f5b0e7e80f8a6002e6d6c6ea426a2b6fee8953bf))
- **server-dev:** Added import for actions plugins to the lowdefy context. ([20133bb](https://github.com/lowdefy/lowdefy/commit/20133bb0589d35b1494cd3f996ff0ea5421ee560))
- **server-dev:** Clean up server-dev manager. ([ad3511c](https://github.com/lowdefy/lowdefy/commit/ad3511cce781bdcaf4cba634c87ed541e07b0123))
- **server-dev:** Dev server plugin install and next build working. ([cf66a6f](https://github.com/lowdefy/lowdefy/commit/cf66a6f83952016b4282985b44f8eb10e7f72ea4))
- **server-dev:** Optimise dev server next build time. ([34aa84a](https://github.com/lowdefy/lowdefy/commit/34aa84acf92288ecbada387ecf9c7eefc1c0968e))
- **server-dev:** Skip calling next and lowdefy build using npm/yarn start. ([1a8699a](https://github.com/lowdefy/lowdefy/commit/1a8699a0124ba45202cc4d57255d5d0d6ff6abb7))
- **server:** Add ariaLabel and rel properties to Link. ([95b4447](https://github.com/lowdefy/lowdefy/commit/95b44473a3f67741951e4d020a0ad84a90805d94))
- **server:** Add Next Link component implementation. ([6104ae0](https://github.com/lowdefy/lowdefy/commit/6104ae0254909fa969bd9f641e540700d8d8b268))
- **server:** Add replace and scroll to Link. ([9d6ac04](https://github.com/lowdefy/lowdefy/commit/9d6ac04b09f7c2281ebc699de504bba8b8b5e13b))
- **server:** Added import for actions plugins to the lowdefy context. ([f28052c](https://github.com/lowdefy/lowdefy/commit/f28052cb510a0757310d20068105d193e2f6856c))

### Reverts

- Revert "chore: Update yarn.lock" ([f894cb4](https://github.com/lowdefy/lowdefy/commit/f894cb421e89b40d7b8a49b253930198938eabc3))
- Revert "chore: Update yarn lock to fix removal of rc-animate." ([ab3e513](https://github.com/lowdefy/lowdefy/commit/ab3e513bb95d4bacfe10794b4a77beda82cc6c29))

### BREAKING CHANGES

- **connection-mongodb:** The MongoDB driver was updated to v4, which has some changes to the option variable names.
- **operators:** \_yaml.parse now takes an array or an object data instead of a string.
- href and strong property removed for Anchor block, replaced with Link properties.
- **engine:** The Message action was renamed to DisplayMessage.
- **deps:** The Knex driver has been updated to v1.0.1 which has some changes in the returned values. See https://github.com/knex/knex/releases.
- **deps:** # marks the beginning of a comment in .env files (UNLESS the value is wrapped in quotes. Please update your .env files to wrap in quotes any values containing #.
- **cli:** Rename base-directory to config-directory.

## [3.23.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v3.23.2) (2021-11-29)

### Bug Fixes

- **blocksAntd:** Added deboucing condition to Selector and MultipleSelector. ([ce1d3e4](https://github.com/lowdefy/lowdefy/commit/ce1d3e45d5e3add137a97c17461fcf57159dc3e2))

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

### Bug Fixes

- Add loading and error icons to icon plugin import. ([3c98732](https://github.com/lowdefy/lowdefy/commit/3c98732584325622c56ebd042b1dab9df0427e02))
- **blocks-antd:** Added debounce condition to Selector and MultipleSelector ([910bee0](https://github.com/lowdefy/lowdefy/commit/910bee0837ad1bd55d456f339a7750ed37aa5d0c))
- **blocks-antd:** Swap rc-animation for rc-motion in Label to fix modules build. ([8660b6e](https://github.com/lowdefy/lowdefy/commit/8660b6e1f00c4c28e4ed4b4500b982986c712864))
- **blocks-markdown:** Upgraded react markdown dependencies. ([9eb7c3a](https://github.com/lowdefy/lowdefy/commit/9eb7c3acbd8ab4088db75637ec8f17e36289787f))
- **blocks:** Updated block meta, types and buildIcons. ([1d774a3](https://github.com/lowdefy/lowdefy/commit/1d774a310a71e125fc7bf7d0d7ef5171632a56a8))
- **build:** Updated write icon imports template. ([425823d](https://github.com/lowdefy/lowdefy/commit/425823de7f64e2e6a688ac9487d13b42bb101eb2))
- **cli:** Fix CLI dev server command. ([49f6c20](https://github.com/lowdefy/lowdefy/commit/49f6c208ec400265526487c96b9a55e36894e87d))
- **connection-redis:** Add test for connection with url string and remove custom message for connection errors. ([095b890](https://github.com/lowdefy/lowdefy/commit/095b89072e53f9f888ec24f7649ad810554d3c0c))
- **connection-redis:** Add tests with mocked redis client and bumped @swc/core version. ([11cef00](https://github.com/lowdefy/lowdefy/commit/11cef0059f684e77854344451f46c9916c0102cd))
- **connection-redis:** Pin redis dependency to a fixed version and fix error messages. ([068461f](https://github.com/lowdefy/lowdefy/commit/068461fd2f34de3e7a622ba4e983e8141bd644b0))
- **docs:** Added redis connection documentation. ([ee1620b](https://github.com/lowdefy/lowdefy/commit/ee1620bb41d8aa3f32e05e9b7e03c7986365c59f))
- Fix antd styles. ([62a752d](https://github.com/lowdefy/lowdefy/commit/62a752d66c9b7cf4ebfd07fcc92d8a195ed43be4))
- Fix blocks-echarts yarn berry packageExtensions. ([a908c1c](https://github.com/lowdefy/lowdefy/commit/a908c1c1f8ccaab37643bf8a043a6cec8f82f243))
- Fix blocks-markdown package dependencies. ([035b0c1](https://github.com/lowdefy/lowdefy/commit/035b0c108b9447570fe7d37a5386d9ea414714fa))
- Fix layout style import. ([b318343](https://github.com/lowdefy/lowdefy/commit/b3183437fe76dc49378590967671891206dcdf39))
- Fix static files. ([d2e343e](https://github.com/lowdefy/lowdefy/commit/d2e343eb8b644d953babac628470e785af641237))
- Refactored connection-redis plugin to have non restrictive schemas. ([f8d9f8e](https://github.com/lowdefy/lowdefy/commit/f8d9f8e149413a31f9f30c5665b570208a4d535b))
- **server:** Home is also returned in getRootConfig. ([b138485](https://github.com/lowdefy/lowdefy/commit/b13848527749eb6f030bd944b1b169e8bd04af5d))

### Features

- 404 page working with next server ([270c92e](https://github.com/lowdefy/lowdefy/commit/270c92e16a42a5e9988b890f2abd41b16da6f673))
- Add \_diff to client operators as well as server. ([4e23fec](https://github.com/lowdefy/lowdefy/commit/4e23fec8a4985d7453dfcf750298bc0bedeb34a2))
- Add additional operator plugins to generateDefaultTypes, and fix operaotr packages. ([a1d9c3b](https://github.com/lowdefy/lowdefy/commit/a1d9c3bf7c687603b2f79d0f75b794f703482b17))
- Add icons and webmanifest to next server. ([6a254ed](https://github.com/lowdefy/lowdefy/commit/6a254ed88282a4965aa6e7399250668a409310a3))
- Add rest of operators-diff files. ([fde3a94](https://github.com/lowdefy/lowdefy/commit/fde3a94ed9f67c62789029eaa6ef5a089cd5691c))
- Add secrets to v4 servers ([9ef2ccd](https://github.com/lowdefy/lowdefy/commit/9ef2ccd131149e72ba87aee20f1720a99dbd9e07))
- Add server manager and file watcher in reload event stream. ([8474aaf](https://github.com/lowdefy/lowdefy/commit/8474aaf63c0475cb19a76ca3df9459c05f263986))
- Add Server Sent Event reload rout and component. ([a556eab](https://github.com/lowdefy/lowdefy/commit/a556eabdbb4da2e98088e810b3cc24cccefacd4f))
- **build:** Move app.style.lessVariables to config.theme.lessVariables. ([cb14f17](https://github.com/lowdefy/lowdefy/commit/cb14f1712f9f064e96d2f71bf12bb3922aff46eb))
- **cli:** Add v4 dev command to CLI. ([02770f5](https://github.com/lowdefy/lowdefy/commit/02770f57096710afc9047403e5e4a616957c3a93))
- **clie:** Update BatchChanges to repeat and pass args to callback function. ([6dd29c5](https://github.com/lowdefy/lowdefy/commit/6dd29c5ca998ff6536d9ce3807583f4c549f070b))
- Create connection-redis plugin. ([ee2315d](https://github.com/lowdefy/lowdefy/commit/ee2315d69c678f89a8e38de8879c374895f9cb8b))
- Create operators-change-case plugin ([9aca6be](https://github.com/lowdefy/lowdefy/commit/9aca6be86d3246bc2028c9a559bf90be2f3c3298))
- Create operators-diff plugin. ([97885be](https://github.com/lowdefy/lowdefy/commit/97885bef8cc8a325ae8b301b7dfc9234e4d0ddb5))
- Create operators-mql plugin ([e3084aa](https://github.com/lowdefy/lowdefy/commit/e3084aaffa5c9d295faa699c25367883bfd690c7))
- Create operators-uuid plugin. ([7ab243b](https://github.com/lowdefy/lowdefy/commit/7ab243bfc71f47ff2f7d81e87c7b41197fcd676d))
- Create operators-yaml plugin. ([3a521ba](https://github.com/lowdefy/lowdefy/commit/3a521ba8c11e575ce74c994a6a7f4d99f6563ee6))
- Create wait helper function. ([42c09f4](https://github.com/lowdefy/lowdefy/commit/42c09f467b3d4a3b51298a2a67364137def7896d))
- Init @lowdefy/server-dev package. ([e76b40e](https://github.com/lowdefy/lowdefy/commit/e76b40e8399567bda70404dc85f06c6c2db7e837))
- **server-dev:** Add browser opener to dev server. ([ddf9d36](https://github.com/lowdefy/lowdefy/commit/ddf9d36d8689caf30f4d008e1ec2be0c48699a34))
- **server-dev:** Add dev server startup and config file watcher. ([a29576d](https://github.com/lowdefy/lowdefy/commit/a29576d45e58720f02896e5d0523f728fad036a5))
- **server-dev:** Add the abilty to restart the dev server. ([b610a63](https://github.com/lowdefy/lowdefy/commit/b610a63a522afebe66dee8481cf8caf029334201))
- **server-dev:** Dev server soft reload working. ([dd5ee07](https://github.com/lowdefy/lowdefy/commit/dd5ee07b5b39c3c22e702b5b1c8404e7a86ab500))
- **server-dev:** Fetch Lowdefy config client-side using swr. ([ce126df](https://github.com/lowdefy/lowdefy/commit/ce126df4374d74a27a2a40439aa1bf56a63723f5))
- **server-dev:** Reload client window if dev server is restarted. ([b8c1d58](https://github.com/lowdefy/lowdefy/commit/b8c1d58ea8b0056fdd9ce042590f7c7f90bcc439))
- **server-dev:** Updates to dev server manager. ([b4861d0](https://github.com/lowdefy/lowdefy/commit/b4861d0892ee9a91ff49b3bb72498d8c42c02778))

### BREAKING CHANGES

- The 404 page is now always publically accessible.

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

### Bug Fixes

- **cli:** Add node shebang to index.js. ([f711fa9](https://github.com/lowdefy/lowdefy/commit/f711fa9fad615d89263954512970ec930cf8dbcd))
- **cli:** Update getDirectories. ([8af70b0](https://github.com/lowdefy/lowdefy/commit/8af70b0e66260a87a3e0e62f1ea83a12822cb3bb))
- Fix home page route in server. ([640ab8a](https://github.com/lowdefy/lowdefy/commit/640ab8a6528019bc2f2ace818053f2f3fbb3955f))
- Fixes for V4. ([41a9a30](https://github.com/lowdefy/lowdefy/commit/41a9a30b308543605a70f7d830a14f8f7221dd01))
- Refactored blocks for Lowdefy Version 4. ([96f194d](https://github.com/lowdefy/lowdefy/commit/96f194dc5088b864ee6696b97780a0791b5a5a2d))
- Remove CHANGELOG file and aws plugin package peer depencies ([21627f7](https://github.com/lowdefy/lowdefy/commit/21627f7f7a53751099764ea444ad4519c6b18b1a))
- V4 fixes. ([088e210](https://github.com/lowdefy/lowdefy/commit/088e210620ffd8d7735cc785483845d082d5485d))

### Features

- Add client operators to operators-js. ([1453e8e](https://github.com/lowdefy/lowdefy/commit/1453e8e8d6ef2897be1d378488144b179949a7dd))
- Add start command to CLI. ([19bf81a](https://github.com/lowdefy/lowdefy/commit/19bf81ad31d9f5f002521e0aed9b1fc1599277dd))
- Add types object to telemetry. ([d2509b3](https://github.com/lowdefy/lowdefy/commit/d2509b327336c488db192fb1c8086ad685cd007b))
- Allow Less variables to be specified in server. ([bd8ccbd](https://github.com/lowdefy/lowdefy/commit/bd8ccbdaf75fa320e5f6ee6abf3fb7480a3dc180)), closes [#893](https://github.com/lowdefy/lowdefy/issues/893)
- Create operators-js plugins. ([fc0dc29](https://github.com/lowdefy/lowdefy/commit/fc0dc29ad8dcf6e7631d2bc77f1b3f8bf348bafd))
- Create operators-nunjucks plugin. ([d299d2f](https://github.com/lowdefy/lowdefy/commit/d299d2f7ed4fd2ad928882bcdd1cfda7f82c9187))
- Import operator plugins in server. ([f913e9e](https://github.com/lowdefy/lowdefy/commit/f913e9e261777a0c7f4b0a79995ef18290186b2e))
- Move server operators to operators-js plugin. ([a864473](https://github.com/lowdefy/lowdefy/commit/a864473d7f68d4921186db8a6abeb681e5fe7f41))
- **operators:** Add other functions to operators export. ([16f4da7](https://github.com/lowdefy/lowdefy/commit/16f4da78ec8e7a44fff4bdc28d4a61d421b82ca4))
- **operators:** Move common operators to operators-js plugin ([42a8054](https://github.com/lowdefy/lowdefy/commit/42a80549e3c6153ef09ab5d0fd4b31c40a9c92f6))
- **operators:** Update node and web parser and move their tests. ([3647299](https://github.com/lowdefy/lowdefy/commit/364729916a9238a7018adcfc5927e2ea85cab8c5))
- **operators:** Update node and webParser and tests. ([e52a22e](https://github.com/lowdefy/lowdefy/commit/e52a22eb9fbfafab6c2bc0ef2c8915c9f844087c))
- Update server package.json if plugin deps change. ([09f7bca](https://github.com/lowdefy/lowdefy/commit/09f7bca3a29ff186783197692e988cb315ff7483)), closes [#943](https://github.com/lowdefy/lowdefy/issues/943)
- Update types.js and update packages ([b6ffbf6](https://github.com/lowdefy/lowdefy/commit/b6ffbf6001c3aa44c260afe7eba89a24d40a51f8))

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

### Bug Fixes

- Plugin import fixes. ([e1becad](https://github.com/lowdefy/lowdefy/commit/e1becad08704833b2a8f559e8c88bcd7172ea622))

### Features

- **build:** Add build icons.js. ([e3b7eb7](https://github.com/lowdefy/lowdefy/commit/e3b7eb7bf45e3dd237da47a9dfa783cb9e1174e8))

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

### Bug Fixes

- **build:** Fix build default build directory. ([f6efc19](https://github.com/lowdefy/lowdefy/commit/f6efc19f00a78cda46e04762b3ea89f4da1eda25))

### Features

- **blocks-basic:** Add styles export to types.js. ([c4900b4](https://github.com/lowdefy/lowdefy/commit/c4900b496d846f250f7ba92141f3bb69439ec36c))
- **build:** Add styles.less in build. ([d014774](https://github.com/lowdefy/lowdefy/commit/d0147743ecca045858331cbec409059386a35e60))
- **connection-axios-http:** Generate type.js from import. ([d6c1cf7](https://github.com/lowdefy/lowdefy/commit/d6c1cf7767f1cc42e1424325df933f12bab65329))
- **layout:** Export styles.less. ([f898cff](https://github.com/lowdefy/lowdefy/commit/f898cfff5f3d963931b4f9265fa4b6e77866699f))

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

### Bug Fixes

- Fixes for CLI build. ([3e58d59](https://github.com/lowdefy/lowdefy/commit/3e58d599829e1393de52e94e6e1e82f6876231ec))

### Features

- Fetch, install and build @lowdefy/server from CLI. ([7966538](https://github.com/lowdefy/lowdefy/commit/7966538468b4e9ac65003876b30ad1302132f1c3))

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

### Bug Fixes

- **ajv:** Build @lowdefy/ajv with swc and update dep ajv to v8.6.3. ([f231fcb](https://github.com/lowdefy/lowdefy/commit/f231fcb3219d5210f0c7c597323511b706b610dc))
- **api:** add createContext test ([af14e7c](https://github.com/lowdefy/lowdefy/commit/af14e7c4470379df51588fbc3b63090d8c439959))
- **api:** Add request handler tests. ([b827137](https://github.com/lowdefy/lowdefy/commit/b8271376f1d20f2cc2d036aa50f69caa3b6b0c4a))
- **api:** Add tests ([db478c9](https://github.com/lowdefy/lowdefy/commit/db478c970ef2360e512ad5c9e7872440f238a4c3))
- **api:** Fix api context tests. ([8aa2642](https://github.com/lowdefy/lowdefy/commit/8aa264243706ea089377d11302e9d81fc02ef26b))
- **api:** Fix tests. ([7791951](https://github.com/lowdefy/lowdefy/commit/7791951a115704fcba4812ea7068979a44aca798))
- **api:** JSON web token tests and fixes. ([30f7267](https://github.com/lowdefy/lowdefy/commit/30f7267c3e2435647b1b5f0b4b48137d6c3357d6))
- Authorisation flows working. ([5b32ca8](https://github.com/lowdefy/lowdefy/commit/5b32ca86bae8a13fea477d4d7ef19a4c5ad4fdc8))
- **block-dev:** exclude dev files from tests. ([5f81b17](https://github.com/lowdefy/lowdefy/commit/5f81b1762fa66fb98d996d4fda5ee9da7e1b6b57))
- **block-tools:** Move @lowdefy/icons into @lowdefy/block-tools. ([4cc8501](https://github.com/lowdefy/lowdefy/commit/4cc8501bda1e88541f8c8d0cedd97b6d1b08ba34))
- **block-tools:** Update test to not use inline SS for modules. ([f173fb2](https://github.com/lowdefy/lowdefy/commit/f173fb2eac909bcb4528068f3cd203cf44264983))
- **block-tools:** Update tests. ([ea4cc05](https://github.com/lowdefy/lowdefy/commit/ea4cc05c7f72987c699f5341b5196c86222480ef))
- **blockDev:** Fix stubBlockProps test. ([357fd0c](https://github.com/lowdefy/lowdefy/commit/357fd0c162203f81ccbb2ff5bc80f75bb3c0ebac))
- **blockDev:** Include makeCssClass in stubBlockProps. ([33656e6](https://github.com/lowdefy/lowdefy/commit/33656e650cc57ae9d6c76c1ed20de8950c7e468e))
- **blocks-antd:** Add onSearch to Selector and MultipleSelector. ([68ab7ba](https://github.com/lowdefy/lowdefy/commit/68ab7baa2c0084256adbadb2541978970fafe7fb))
- **blocks-antd:** runMockRenderTests working. ([5f74f05](https://github.com/lowdefy/lowdefy/commit/5f74f0500daa0c1e2920f3fdfe2344be0027ecbd))
- **blocks-antd:** Update tests for all blocks. ([ca09c8c](https://github.com/lowdefy/lowdefy/commit/ca09c8c1a5922157d5fe249c11982815b6619297))
- **blocks-antd:** Update validationExamples test. ([bc87d97](https://github.com/lowdefy/lowdefy/commit/bc87d97c283ea8a5a5440800398e8f91bc266149))
- **blocks-basic:** Update tests for blocks basic and new structures. ([5d16247](https://github.com/lowdefy/lowdefy/commit/5d16247c310c0417b68b76f0529afdcf5932d497))
- **blocksAntd:** Add feedback classes to labelLogic. ([75ef33f](https://github.com/lowdefy/lowdefy/commit/75ef33f542af63a64f9a5568b28c4ad7a8cf91cd))
- **blocksAntd:** Comment.datetime can also be a string. ([56e167d](https://github.com/lowdefy/lowdefy/commit/56e167db98949d7a5eb321c8c3b391ee46c75b1c))
- **blocksAntd:** Fix line wrapping for long description in CheckboxSwitch. ([9f75253](https://github.com/lowdefy/lowdefy/commit/9f75253d7a5ed6ad4bc9eb0f93805ad2e8c95eb1))
- **blocksAntd:** Fix margin in Alert when message is none. ([4066869](https://github.com/lowdefy/lowdefy/commit/406686994f24e539e31e13ca126076ec30e80575))
- **blocksAntd:** Icon: move color and fontSize to style. ([b54ecde](https://github.com/lowdefy/lowdefy/commit/b54ecde547b67b9c8b4fbda4b49f7fae07e313ba))
- **blocksAntd:** Refactor block files for next. ([c310d04](https://github.com/lowdefy/lowdefy/commit/c310d04b5302dade159929961f8fb0d056d43820))
- **blocksAntd:** Refactored blocks for Lowdefy Version 4. ([4af10f9](https://github.com/lowdefy/lowdefy/commit/4af10f930df5348acfc920941e82fa84c6c1d7ff))
- **blocksAntd:** Update test snapshots. ([e1ad47f](https://github.com/lowdefy/lowdefy/commit/e1ad47ffe180d7d4d5140bd3e5a63f6494ffd610))
- **blocksAntd:** Updated CheckboxSelector block tests. ([eee5e52](https://github.com/lowdefy/lowdefy/commit/eee5e528d3a443de4d1027eaf16ab09d0813168f))
- **blocksAntd:** Updated RadioSelector block tests. ([c0588c0](https://github.com/lowdefy/lowdefy/commit/c0588c01926831419c398968ba5ca50a2baa0f56))
- **blocksAntd:** Updated RatingSlider block tests. ([e486c83](https://github.com/lowdefy/lowdefy/commit/e486c830fb9e084855108683d3cb2ab8cf605c15))
- **blocksBasic:** Move Anchor from antd to basic. ([b065493](https://github.com/lowdefy/lowdefy/commit/b065493a591b45228c474bb18bde7f0b7fe9e1a9))
- **blocksBasic:** Remove Context block tests. ([8899e6f](https://github.com/lowdefy/lowdefy/commit/8899e6f642181d9345c33edbab09c74d3580a2e0))
- **blocks:** Block test restructuring. ([52ffeec](https://github.com/lowdefy/lowdefy/commit/52ffeec394133bc3a113c078229fb47251c670a0))
- **blocksColorSelectors:** Refactored blocks for Lowdefy Version 4. ([85553d3](https://github.com/lowdefy/lowdefy/commit/85553d36e7573fe33ba00215d89153f1feea0b41))
- **blocksECharts:** Refactored blocks for Lowdefy Version 4. ([cfe2e20](https://github.com/lowdefy/lowdefy/commit/cfe2e20de727f072ad741021166e00cf25b2c440))
- **blocksMarkdown:** Refactored blocks for Lowdefy Version 4. ([e42ba80](https://github.com/lowdefy/lowdefy/commit/e42ba805a198544a521b53397c3a34ec10a41380))
- **blocks:** Refactored blocksBasic blocks for Lowdefy Version 4. ([2ded0f0](https://github.com/lowdefy/lowdefy/commit/2ded0f05b39c933980aa6de7f4434fb5935156b9))
- **blockTools:** Cleanup block tools. ([7ab732c](https://github.com/lowdefy/lowdefy/commit/7ab732c48cf3634eb75e211db1258fe6e211ffed))
- **build:** Fix build if no lowdefy.yaml file is found. ([86f32a1](https://github.com/lowdefy/lowdefy/commit/86f32a18643924cf29d16ddf4c1903a385d6efb5))
- **build:** Fix build tests. ([509d71a](https://github.com/lowdefy/lowdefy/commit/509d71a9b4f21e1094744dc4fa94732d99dfe351))
- **build:** Remove getMeta from context. ([a982fd8](https://github.com/lowdefy/lowdefy/commit/a982fd8fd00d26f14b82e4a56f9dd2ed4c40293f))
- **build:** Remove nested if statements. ([e4771f9](https://github.com/lowdefy/lowdefy/commit/e4771f9e494b4ef1f313782d7b64a9657b0d6a52))
- **build:** Removed check and test for duplicate block id. ([8fe5cdd](https://github.com/lowdefy/lowdefy/commit/8fe5cdd65f60fd4b87c820aa0eb1b9a106ce077f))
- **build:** Update build tests for payload change. ([43c2507](https://github.com/lowdefy/lowdefy/commit/43c2507b95eb9c87ddb6ed63057e7fb8c42ce840))
- **build:** Update duplicate id tests. ([ed2f983](https://github.com/lowdefy/lowdefy/commit/ed2f983841be4c6e6211fd8e5e06c9283e4fcbd2))
- **build:** Updated formatErrorMessage and testSchema tests. ([751814c](https://github.com/lowdefy/lowdefy/commit/751814cec6950dee06dfb2844e952c7a985c691a))
- **build:** Updated formatErrorMessage function to show descriptive error paths. ([5096554](https://github.com/lowdefy/lowdefy/commit/509655409ea81aed398e67e45829d0c8603fc56f))
- Clean up server configuration. ([dea25de](https://github.com/lowdefy/lowdefy/commit/dea25dec2303f19937253a0d9c699b56b28fb82b))
- Cleanup build script. ([ca0b4b0](https://github.com/lowdefy/lowdefy/commit/ca0b4b0d91bb77098d9295f0a071bb05a19e3781))
- **client:** Refactor root components. ([e549883](https://github.com/lowdefy/lowdefy/commit/e5498834519961b1b61ca3c64a1a5fd5af75474e))
- **connection-elasticsearch:** Fix elasticsearch tests after plugin update. ([9cb4097](https://github.com/lowdefy/lowdefy/commit/9cb4097470adc8ed4e08027c2a42c46b2e1ddc6e))
- **connection-mongodb:** Fix mongodb tests. ([f1d11f0](https://github.com/lowdefy/lowdefy/commit/f1d11f05a2c1da4be7f86a8b6fef38c8aeb0e633))
- **deps:** Update dependency @elastic/elasticsearch to v7.15.0. ([788da55](https://github.com/lowdefy/lowdefy/commit/788da55ea39a7cb22919afffd4fd4eb611987dec))
- **deps:** Update dependency @sendgrid/mail to v7.5.0. ([c955a4c](https://github.com/lowdefy/lowdefy/commit/c955a4caa9174f120ff376d7b4bf6dae9d1a06b3))
- **deps:** Update dependency @wojtekmaj/enzyme-adapter-react-17 to v0.6.5. ([3363135](https://github.com/lowdefy/lowdefy/commit/3363135d19bb0683b3db1e8c3e61d33650ede010))
- **deps:** Update dependency axios to v0.23.0. ([f04f720](https://github.com/lowdefy/lowdefy/commit/f04f7208d2e00e2f8d9d2418514ecbe2bbab5cbc))
- **deps:** Update dependency chalk to v4.1.2. ([5a80923](https://github.com/lowdefy/lowdefy/commit/5a8092303ecf1abe93c307396ddd2f2af5a04349))
- **deps:** Update dependency chokidar to v3.5.2. ([ea8300a](https://github.com/lowdefy/lowdefy/commit/ea8300a2958b7cf74185446ba6503a2b15c49dc7))
- **deps:** Update dependency commander to v8.3.0. ([45489e6](https://github.com/lowdefy/lowdefy/commit/45489e68cd37d9d3b5f1dd7464fe6adf68c52b73))
- **deps:** Update dependency dompurify to v2.3.3. ([7c22b15](https://github.com/lowdefy/lowdefy/commit/7c22b1567f1ca4fd7329c8c5adfc0750514bd02d))
- **deps:** Update dependency knex to v0.95.11. ([08d5a57](https://github.com/lowdefy/lowdefy/commit/08d5a57123d77e02483a4780780cd9246ddb27bd))
- **deps:** Update dependency less to v4.1.2. ([96016f5](https://github.com/lowdefy/lowdefy/commit/96016f5d3cb9fb01fcc279e8eefcc8f6fe5b05c4))
- **deps:** Update dependency mssql to v7.2.1. ([c9acf42](https://github.com/lowdefy/lowdefy/commit/c9acf42dc081c282c259afdd7c3d795b3920c682))
- **deps:** Update dependency openid-client to v4.9.1. ([5b28ee4](https://github.com/lowdefy/lowdefy/commit/5b28ee46833d283661e0492f92632531ee3fc14d))
- **deps:** Update dependency ora to v6.0.1. ([25e82f5](https://github.com/lowdefy/lowdefy/commit/25e82f515f80576a08d1548d5041989aeefd2014))
- **deps:** Update dependency pg to v8.7.1. ([cc2e30a](https://github.com/lowdefy/lowdefy/commit/cc2e30a5a8bb4ce3569034b9ee6a3523602cbed2))
- **deps:** Update dependency query-string to v7.0.1. ([48f881f](https://github.com/lowdefy/lowdefy/commit/48f881f653c3cdf35273619b8337f039c520a5f8))
- **deps:** Update dependency reload to v3.2.0. ([101ca3c](https://github.com/lowdefy/lowdefy/commit/101ca3ca6b71c8415463db7b8c2249c058efd618))
- **deps:** Update dependency stripe to v8.184.0. ([d75e396](https://github.com/lowdefy/lowdefy/commit/d75e3965e25508b4d8e9db292514997b9ab30018))
- **deps:** Update dependency yargs to v17.2.1. ([d79be06](https://github.com/lowdefy/lowdefy/commit/d79be06e3d1fe9c82dca4cbd9c53da065ceb711b))
- **deps:** Update fastify dependencies. ([b1b321e](https://github.com/lowdefy/lowdefy/commit/b1b321e67582ebfaa0a594e4769eafe56001a40c))
- **deps:** Update package ajv to v8.8.2. ([2ded889](https://github.com/lowdefy/lowdefy/commit/2ded889ef7970554b4028bfbddbe4c754a49fb40))
- **deps:** Update package axios to v0.24.0. ([ea4f077](https://github.com/lowdefy/lowdefy/commit/ea4f07784f5020eb12c95b3d2885e74044fc3fb9))
- **deps:** Updvate dependency aws-sdk to v2.1013.0. ([15c225c](https://github.com/lowdefy/lowdefy/commit/15c225c69a6e6a8d87a71be80ca5a0d2ff1b74a6))
- **docs:** Document that \_index operator is client side only. ([72c8228](https://github.com/lowdefy/lowdefy/commit/72c82282a3e6bcd3eb2eeaf3c09b395a0f152405))
- Engine test fixes. ([cf752ec](https://github.com/lowdefy/lowdefy/commit/cf752ec72024b678cb19c070a404d1dadb343281))
- **engine:** Add tests for payload change. ([e8a2141](https://github.com/lowdefy/lowdefy/commit/e8a2141812870ec8ae50e1921f05ad2077ac176f))
- ES module and next server fixes. ([83bca45](https://github.com/lowdefy/lowdefy/commit/83bca458e4ba5a5d2f62a23f603b69672bc0418b))
- Fix blocks tests. ([e5dc8aa](https://github.com/lowdefy/lowdefy/commit/e5dc8aa866289e9266e3438fa8be7e13a1d24dff))
- Fix tests ([80c00f4](https://github.com/lowdefy/lowdefy/commit/80c00f4403067493351347ca91cb953586bb97da))
- Fix tests. ([5fd4a45](https://github.com/lowdefy/lowdefy/commit/5fd4a45cab784226bcdef907148a0cc86fe52ea0))
- **graphql:** Fix graphql RequestInput schema ([add2631](https://github.com/lowdefy/lowdefy/commit/add263181ac63484c6a5205bda09eeb9da18b0c3))
- **graphql:** Fix graphql tests fro removed contextId. ([67141dd](https://github.com/lowdefy/lowdefy/commit/67141dd2c1f86b98cca4cdacced3aad2d01e4a77))
- Next server fixes ([d5ab3d9](https://github.com/lowdefy/lowdefy/commit/d5ab3d92f24b09a59e6c20e31a8b01dce9d1056f))
- **operators:** \_index operator is no longer supported in node env. ([ec777ca](https://github.com/lowdefy/lowdefy/commit/ec777ca4b90a9cac8bc82a2b941fff82cdb01824))
- **operators:** Fix \_switch operator tests. ([b28c65e](https://github.com/lowdefy/lowdefy/commit/b28c65e1b51188f1b4ccba3a32371ca8702fc460))
- **operators:** Fix operator tests for payload change. ([dc41f69](https://github.com/lowdefy/lowdefy/commit/dc41f69330b7f935b0220f01f1590a696bac4f1d))
- Remove auth dependencies from api ([a1f72e1](https://github.com/lowdefy/lowdefy/commit/a1f72e1087f1cec4f2313b96ec727457c5e97e6d))
- Remove block metadata from build. ([06a4fba](https://github.com/lowdefy/lowdefy/commit/06a4fba06ce1f15781a12321d34b7f8e346a0af8))
- Remove nested contexts code review fixes. ([ceb266d](https://github.com/lowdefy/lowdefy/commit/ceb266d5e09afcaacceaef0690d76eeaceb8e5ae))
- Remove Root component in server. ([8182775](https://github.com/lowdefy/lowdefy/commit/818277567f5465b72fac61a5ef65d929328d8570))
- Render app using blockIds generated at build. ([4e46145](https://github.com/lowdefy/lowdefy/commit/4e46145d8fdbd4f1c49891202f7182a6bb35e6f7))
- Replace all front end testing with @testing-library/react, jest and other updates. ([22ec295](https://github.com/lowdefy/lowdefy/commit/22ec2954047853096aabcddba7a2c509342f95f2))
- **server:** Move document and window to LowdefyContext component. ([db21b58](https://github.com/lowdefy/lowdefy/commit/db21b58b46202d07ca7ec66c3bf70d8982ebbfeb))
- Test fixes. ([67bf2d4](https://github.com/lowdefy/lowdefy/commit/67bf2d444884232369eea5f9b9db418b4cf3a25b))
- Update all block tests. ([5f0528d](https://github.com/lowdefy/lowdefy/commit/5f0528d938d01bc4d23e3ab9e6335c64896fc10c))
- Update antd from v4.4.2 to v4.16.13. ([dfe5966](https://github.com/lowdefy/lowdefy/commit/dfe5966f7856148472382b1dea7d81fc9082b7c0))
- Update dependency mingo to v4.2.0. ([cbcf3a7](https://github.com/lowdefy/lowdefy/commit/cbcf3a7a8d4b336be9c25a913c00410703f231d5))
- Update to antd@4.17.0-alpha.7 and @ant-design/icons@4.7.0. ([25d9067](https://github.com/lowdefy/lowdefy/commit/25d906799e29aab98361f7a4895b15375afe1959))

### Features

- Add authentication flows ([15e1be9](https://github.com/lowdefy/lowdefy/commit/15e1be90d063ca4e0b315ed8be1641897b694d5c))
- Add default public files to @lowdefy/client ([dcd28f5](https://github.com/lowdefy/lowdefy/commit/dcd28f51c4ef9d73a1afc47cdb377a330a3f01a6))
- Add requests support to @lowdefy/api package ([86533ee](https://github.com/lowdefy/lowdefy/commit/86533ee6a9f93a71c0e66b89924ff737d7e1d47b))
- Add requests to client and server. ([320c4a1](https://github.com/lowdefy/lowdefy/commit/320c4a10a14b14488f13bb3b98bb100c7e6227af))
- **api:** Add api tests and fixes. ([457890b](https://github.com/lowdefy/lowdefy/commit/457890bea65b103e82ee758d96109cc3e5198c54))
- **api:** Add authorization functions. ([a039f41](https://github.com/lowdefy/lowdefy/commit/a039f41526352d11889414f679221da5b185821f))
- **api:** Api package tests and fixes. ([1f4b2f2](https://github.com/lowdefy/lowdefy/commit/1f4b2f29de3489641db5f80e833ecd6682a5a6e0))
- **api:** Init package @lowdefy/api ([cbe7569](https://github.com/lowdefy/lowdefy/commit/cbe75694f1f348e3e89ac38b45ca075f8ece0241))
- **blockDev:** Split dev files from block-tools into block-dev. ([f123730](https://github.com/lowdefy/lowdefy/commit/f123730e241beaa6dbadc8706ae327878354a84f))
- **blocksAntd:** Add align property to CheckboxSelector. ([06d9d31](https://github.com/lowdefy/lowdefy/commit/06d9d31954795d83b01f7d151d2e1d70477056f0))
- **blocksAntd:** Add align, direction and wrap properties to RadioSelector. ([49e20a4](https://github.com/lowdefy/lowdefy/commit/49e20a461935253058a46538aad92f56dd39c36d)), closes [#518](https://github.com/lowdefy/lowdefy/issues/518)
- **blocksAntd:** Add bordered to all inputs where applicable. ([4b7749d](https://github.com/lowdefy/lowdefy/commit/4b7749d554d26b53be6b6321edaabe8d257a709f))
- **blocksAntd:** Add contentStyle and labelStyle properties. also extra content area.. ([67e907c](https://github.com/lowdefy/lowdefy/commit/67e907c824ca316f11a4f27e350c91c2dfde911d))
- **blocksAntd:** Add direction and wrap to CheckboxSelector. ([77380a9](https://github.com/lowdefy/lowdefy/commit/77380a9fcc10c8ea8cac3165545952e97a48e1f4)), closes [#518](https://github.com/lowdefy/lowdefy/issues/518)
- **blocksAntd:** Add HolderOutlined icon. ([c39c387](https://github.com/lowdefy/lowdefy/commit/c39c38752e4a681a1146e44b6638ff8486ff9da9))
- **blocksAntd:** Add onSearch event to AutoComplete. ([672624f](https://github.com/lowdefy/lowdefy/commit/672624faa97892da9c9cb6b92dfba2f4ef0e2f33))
- **blocksAntd:** Added direction, wrap and scroll properties to the CheckboxSelector block. ([b23b483](https://github.com/lowdefy/lowdefy/commit/b23b483f284559ce84fba3b2fe1f6bb65bc17960))
- **blocksAntd:** Added direction, wrap and scroll properties to the RadioSelector block. ([e900a77](https://github.com/lowdefy/lowdefy/commit/e900a772b639db7a06e2d4801b988130b21f71c2))
- **blocksAntd:** Avatar size can now take responsive settings. ([1586723](https://github.com/lowdefy/lowdefy/commit/1586723e906191844121648b703e8d948a3b0e31))
- **blocksAntd:** Badge: add size property. ([bee3718](https://github.com/lowdefy/lowdefy/commit/bee3718d860127bf97e5798c3f35776bc2487741))
- **blocksAntd:** ConfirmModal: add modalStyle, closable and bodyStyle properties. ([62ca4a4](https://github.com/lowdefy/lowdefy/commit/62ca4a4817f52178a589ba32da834efc60ca8cb2))
- **blocksAntd:** Convert Alert to container and add action content area. ([49c6baa](https://github.com/lowdefy/lowdefy/commit/49c6baabeedd4ed5aaaf14f1d7b4ae5d2545d6cf))
- **blocksAntd:** Drawer: Add extra content area and contentWrapperStyle property. ([9273fac](https://github.com/lowdefy/lowdefy/commit/9273facac41e5ee6341c80e698f4367b7d8686f3))
- **blocksAntd:** Menu: add expandIcon property. ([4f4b8be](https://github.com/lowdefy/lowdefy/commit/4f4b8bef9f11dd9c1da36440d9be42e5dd94b951))
- **blocksAntd:** Menu: Add MenuDivider link type. ([b1fbaee](https://github.com/lowdefy/lowdefy/commit/b1fbaeefb9792795e95a1ed0e74148f8546c6f8b))
- **blocksAntd:** MultipleSelector: Add bordered property. ([4632c76](https://github.com/lowdefy/lowdefy/commit/4632c76c84fa61943eeaa7ff2676a571417adc07))
- **blocksAntd:** NumberInput: Add bordered, controls, formatter, keyboard properties. ([72858e5](https://github.com/lowdefy/lowdefy/commit/72858e59cd2ddbbae4bb55133971d193441a66a4))
- **blocksAntd:** Paragraph: Add italic property. ([2a6bb8c](https://github.com/lowdefy/lowdefy/commit/2a6bb8c5858cc8461b5afc39cbbc06c78930d2cf))
- **blocksAntd:** ParagraphInput: add italic and type: success properties. ([3539992](https://github.com/lowdefy/lowdefy/commit/353999273ebb8a3f48e9e1488428e42db5af5251))
- **blocksAntd:** PasswordInput: add bordered and visibilityToggle properties. ([3d26bbe](https://github.com/lowdefy/lowdefy/commit/3d26bbee8cd286012b15abde48ba352ad12e6991))
- **blocksAntd:** Selector: Add bordered property. ([a748b24](https://github.com/lowdefy/lowdefy/commit/a748b244421c9fafdd1399f43e092b0d0a234e0f))
- **blocksAntd:** Skeleton add block property to button sekeleton. ([2ba7ba1](https://github.com/lowdefy/lowdefy/commit/2ba7ba1486e9772df3285146be64530cc7ed9ab7))
- **blocksAntd:** Statistic: Add loading property. ([4193621](https://github.com/lowdefy/lowdefy/commit/419362131b706dc059fb985ededd170d0b857a19))
- **blocksAntd:** TextArea: add bordered, maxLength and showCount properties. ([f7b2b35](https://github.com/lowdefy/lowdefy/commit/f7b2b3560ed7544e5a1ac7b6ddb15ece38df71e6))
- **blocksAntd:** TextArea: Add size property. ([b87248b](https://github.com/lowdefy/lowdefy/commit/b87248b2cad8d4974659dddcf59c3de0747ec7a7))
- **blocksAntd:** TextInput: add bordered and maxLength properties. ([7790677](https://github.com/lowdefy/lowdefy/commit/7790677b5554ee7c20ddf16315831c1c283f88f7))
- **blocksAntd:** Title: add level 5 and italic properties. ([eecc837](https://github.com/lowdefy/lowdefy/commit/eecc837b6579745e2b15a69a2658941fd189e9c4))
- **blocksAntd:** TitleInput: add level 5 and italic properties. ([af68201](https://github.com/lowdefy/lowdefy/commit/af68201cdc9d2c76d3d768934b4b3192f008d534))
- **blocks:** Convert all context category blocks to container. ([6bc03c8](https://github.com/lowdefy/lowdefy/commit/6bc03c86b80a3506c2b85076626ae15a401bcdfc))
- **blocksLoaders:** Split loading blocks into separte blocks package, closes [#379](https://github.com/lowdefy/lowdefy/issues/379) ([409b1fd](https://github.com/lowdefy/lowdefy/commit/409b1fd421e15e7d3eead2b46979e7026c71da50))
- **blockTools:** Update to @emotion/css, optimize makeCssClass standarise jest settings. ([947defa](https://github.com/lowdefy/lowdefy/commit/947defa3d8934e061933b1e218b79f2f97456054))
- **blockTools:** Update useDynamicScript. ([cd82729](https://github.com/lowdefy/lowdefy/commit/cd82729c5d700c298576aa8fe537b7699067dcf3))
- Build html files for each page, and serve from api ([3f53d8b](https://github.com/lowdefy/lowdefy/commit/3f53d8b20f89b2179ffe18a510e8d5415de2be39))
- **build:** Add generateDefaultTypes script. ([18a4863](https://github.com/lowdefy/lowdefy/commit/18a486384d315d661e957e4d23c4efbae47a3ec7))
- **build:** Added createCheckDuplicateId test. ([414eaa1](https://github.com/lowdefy/lowdefy/commit/414eaa15c152a4b1261a5c7a34d3c423279018d3))
- **build:** Build now throws on duplicate ids. ([45fd393](https://github.com/lowdefy/lowdefy/commit/45fd393c4e605964ec8daeb8c8260945952751ab)), closes [#529](https://github.com/lowdefy/lowdefy/issues/529)
- **build:** Count types during build. ([6550f76](https://github.com/lowdefy/lowdefy/commit/6550f76ec0f1e2ce94300911eb605551c9a8738d))
- **build:** Remove support for nested contexts on a page. ([b003b76](https://github.com/lowdefy/lowdefy/commit/b003b76182ad8b8ba4e7f895247ace4881bce230))
- **build:** Write plugin imports and types.json during build. ([14247ea](https://github.com/lowdefy/lowdefy/commit/14247eab075cea1ffde8e84f134b0f3b66920cbe))
- Convert connection elasticsearch to plugin structure. ([a277fd0](https://github.com/lowdefy/lowdefy/commit/a277fd0f6b80f39ee21e4673e26c7797afc8ff91))
- Convert knex, sendgrid and stripe connections to plugin structure. ([d0e751a](https://github.com/lowdefy/lowdefy/commit/d0e751af47b6f04ab9ace2256268f96116d8aaa8))
- **engine:** Remove support for nested contexts. ([612f783](https://github.com/lowdefy/lowdefy/commit/612f783a0054a05b16ac5424c9052a6af0b8fbff))
- Fixes fro requests in next server ([e341d8d](https://github.com/lowdefy/lowdefy/commit/e341d8ded222902ce07ea1ea1d18940ac000c4da))
- Generate unique block ids at build. ([1503970](https://github.com/lowdefy/lowdefy/commit/1503970896088eb0d6988fbe657e66e477f62c8f)), closes [#920](https://github.com/lowdefy/lowdefy/issues/920)
- **graphql:** Remove support for nested contexts on a page. ([36cf2cf](https://github.com/lowdefy/lowdefy/commit/36cf2cf4f8f90b0467dc58a541addd5055335498))
- **icons:** Create and use @lowdefy/icons, closes [#948](https://github.com/lowdefy/lowdefy/issues/948) ([edcda84](https://github.com/lowdefy/lowdefy/commit/edcda844de17c7cac6ecd4f8916d7908dc547afc))
- Init @lowdefy/client package ([909cef7](https://github.com/lowdefy/lowdefy/commit/909cef766d8e48634b6cc0a048f71bd82565cbf4))
- Init @lowdefy/connection-aws package. ([6b008bf](https://github.com/lowdefy/lowdefy/commit/6b008bf138614bcab9a2d10fa289ae67b42fe5d5))
- Init @lowdefy/connection-elasticsearch package. ([b6fe67f](https://github.com/lowdefy/lowdefy/commit/b6fe67ffe19b1489df85d086a32504888581907b))
- Init @lowdefy/connection-google-sheets package. ([4ffa94f](https://github.com/lowdefy/lowdefy/commit/4ffa94f8b7a3dc6b6a8544e6775e71bea7b757a3))
- Init @lowdefy/connection-knex package ([0a25b31](https://github.com/lowdefy/lowdefy/commit/0a25b31dd36c24ab02468bc2e7ba686c40eadb48))
- Init @lowdefy/connection-mongodb package ([118a29c](https://github.com/lowdefy/lowdefy/commit/118a29c5f52988ea7a7944c7fe726d4924a3f57d))
- Init @lowdefy/connection-sendgrid package. ([2befa24](https://github.com/lowdefy/lowdefy/commit/2befa248b331ab3962b706d1d2bc3d80d05ce979))
- Init @lowdefy/connection-stripe package. ([cf3adb0](https://github.com/lowdefy/lowdefy/commit/cf3adb00a7a2a98ce2c6afd66a896cf689745a09))
- Init server using next. ([bfe749f](https://github.com/lowdefy/lowdefy/commit/bfe749f442e5cb976d6c186d57efd5c94287afdd))
- Make @lowdefy/build a dev dependency of server. ([fa97eb6](https://github.com/lowdefy/lowdefy/commit/fa97eb6a34ae0ea08ae341959c461d5be4f4ba49))
- Mount home page on the home route if configured. ([ff23ea8](https://github.com/lowdefy/lowdefy/commit/ff23ea82cf8399ff012ca07a58520cda1b5853ac))
- Next server fixes. ([9e6518a](https://github.com/lowdefy/lowdefy/commit/9e6518a89e95a894b2c680146e0de15aa6f3513e))
- Next server rendering blocks ([e625e07](https://github.com/lowdefy/lowdefy/commit/e625e07a29b5ae3f09f74c629f35fe52ce73dace))
- **operators:** Convert package @lowdefy/operators to es modules. ([eba25a7](https://github.com/lowdefy/lowdefy/commit/eba25a7d165679318a2174a98f130a07981c941e))
- **operators:** Remove ability to get from another context. ([1abc542](https://github.com/lowdefy/lowdefy/commit/1abc5426fb84fc3d24369be3907b25dc17837ab7))
- Pass components to blocks in server, setup Icon. ([7db2640](https://github.com/lowdefy/lowdefy/commit/7db2640974dd1f77ef42be1b5ba7e4b348da24f6))
- Remove @lowdefy/renderer package ([c584778](https://github.com/lowdefy/lowdefy/commit/c58477852d36f101dd38a0e48143b4a483273ee2))
- Render Lowdefy blocks in client package. ([c24bcf1](https://github.com/lowdefy/lowdefy/commit/c24bcf193123bf1b09b886160df4dafd9298d750))
- **render:** Remove support for nested contexts on a page. ([09d63cf](https://github.com/lowdefy/lowdefy/commit/09d63cfdcc17a9b031a2572b6bf053bfdf0cb0eb)), closes [#884](https://github.com/lowdefy/lowdefy/issues/884)
- Replace server side state with payload and \_payload operator. ([1f928d9](https://github.com/lowdefy/lowdefy/commit/1f928d93db4cbe886d322a1a3998a817d769485f))
- Requests working on next server ([8d6abe2](https://github.com/lowdefy/lowdefy/commit/8d6abe27f967be6c11d1f4c29e8af73c4734dd68))
- Restructure plugin files. ([f651ed7](https://github.com/lowdefy/lowdefy/commit/f651ed7639181fb0a3db91706cb1c13950bfe654))
- Root config and link working on next server. ([cf2562b](https://github.com/lowdefy/lowdefy/commit/cf2562b088075290ddf3c354624c3c5c6d89ecf9))
- **server:** Add auth routes to server. ([4a97f4c](https://github.com/lowdefy/lowdefy/commit/4a97f4c3be64fbb0cc5e8625bb35cf34217e0e89))
- **server:** Add mount events and simplify loading states. ([104642d](https://github.com/lowdefy/lowdefy/commit/104642dc58d4c221cace0c32a3cff67f8e78d527))
- **server:** Convert server to fastify. ([0d2c1c3](https://github.com/lowdefy/lowdefy/commit/0d2c1c34d969fab5049fb501f027bea60bce54ed))
- Update @lowdefy/connection-axios-http package structure. ([a005de6](https://github.com/lowdefy/lowdefy/commit/a005de6e981e8cec3bf2c8ca0caa411f199d07c5))
- Update aws and axios packages to use new plugin structure. ([f20cfef](https://github.com/lowdefy/lowdefy/commit/f20cfef49d696482ad1678b8dda4be8c85c6b55c))
- Update google sheets and mongodb connections to plugin structure. ([53278a3](https://github.com/lowdefy/lowdefy/commit/53278a31289a398ea2b09cce8b7ec39b5108548f))
- Use logger in request api call. ([83b885b](https://github.com/lowdefy/lowdefy/commit/83b885bc415e6e3bc7e67db6efc5f04f6f70db6e))

### BREAKING CHANGES

- **render:** Multiple contexts on a page are no longer supported. Context category blocks no longer exist, and the first block on a page no longer needs to be of category context.
- **operators:** Getter operators can no longer get from another context.
- **operators:** The \_index operator is no longer supported in node env.
- The \_event, \_global, \_input, \_state, and \_url_query operators are no longer evaluated in connections or requests.

## [3.23.2](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v3.23.2) (2021-11-29)

## Changes

### Blocks

- Fix an issue where the `Selector` and `MultipleSelector` blocks were not handling bounced `onSearch` events correctly and leaving the loading state early. Closes #968.

## Commits

### Bug Fixes

- **blocksAntd:** Added deboucing condition to Selector and MultipleSelector. ([ce1d3e4](https://github.com/lowdefy/lowdefy/commit/ce1d3e45d5e3add137a97c17461fcf57159dc3e2))

## [3.23.1](https://github.com/lowdefy/lowdefy/compare/v3.23.0...v3.23.1) (2021-11-20)

### Fixes

- Release to fix Docker builds.

# [3.23.0](https://github.com/lowdefy/lowdefy/compare/v3.23.0-alpha.0...v3.23.0) (2021-11-19)

## Changes

### Blocks

- Added onSearch event to `MultipleSelector` and `Selector`.

### Build

- Better error messages on build.

### Operators

- Added `_switch` operator.

### General

- Added experimental feature `config.experimental_initPageId`.
- Added `auth.jwt.loginStateExpiresIn` parameter to configure OpenID connect state token expiry.

## Commits

### Bug Fixes

- **blocksAntd:** Update test snapshots for Selector and MultipleSelector. ([67202c4](https://github.com/lowdefy/lowdefy/commit/67202c452e2187d6c342cd1e5487c8d28b050004))
- **docs:** Included onSearch event example in MultipleSelector and Selector docs. ([0e53cb8](https://github.com/lowdefy/lowdefy/commit/0e53cb8f93ed49e0122ac038113d7378f67501f7))
- Updated MultipleSelector block to include onSearch event. ([0339e63](https://github.com/lowdefy/lowdefy/commit/0339e63ab6ce3fb1c8c95d203e341cbec1eb4660))
- **blocksAntd:** Updated Selector block to include onSearch event. ([5e9ec14](https://github.com/lowdefy/lowdefy/commit/5e9ec1470d9920b8340247ac1ff8d9a681798f1d))
- **docs:** Fix \_ref resolver function example. ([0903094](https://github.com/lowdefy/lowdefy/commit/0903094ce531f4d8ab7849deb91ab3d6b7e5fd82))

### Features

- **build:** Better error messages on build. ([9934d07](https://github.com/lowdefy/lowdefy/commit/9934d07430aef93d4f992c048b3f7101b4934217))

# [3.23.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0...v3.23.0-alpha.0) (2021-11-09)

### Bug Fixes

- Add \_switch operator to docs. ([c5c6f0c](https://github.com/lowdefy/lowdefy/commit/c5c6f0c9a5b0dfc89e09835d3ab940195a077504))
- Support .yml in lowdefy.yaml file. ([0f7cc2a](https://github.com/lowdefy/lowdefy/commit/0f7cc2a7612a5ad9a8164d5a5437dde5c6d7da49)), closes [#902](https://github.com/lowdefy/lowdefy/issues/902)
- **docs:** Add avatar and links to blog template. ([d855599](https://github.com/lowdefy/lowdefy/commit/d855599398cae041933dd8b11aaf77648f87d4c2))
- **docs:** Fix the iframe videos in the docs. ([c4a957a](https://github.com/lowdefy/lowdefy/commit/c4a957a12ea5adf018b373d8da8c5116e064205f))
- improvements on blog template. ([30e2291](https://github.com/lowdefy/lowdefy/commit/30e22917fed9932e43cde942532654aa4a6aeac6))
- **docs:** Add how to generate CSVs. ([2cc8e45](https://github.com/lowdefy/lowdefy/commit/2cc8e45b165aa755dceb9e40525f8a0511fb3485))
- **docs:** Add how to generate pdfs. ([7b35550](https://github.com/lowdefy/lowdefy/commit/7b35550fa944995be8f8a9d0e809971cabcf12af))
- **operators:** Added tests for switch operator to Node and Web Parsers. ([249ab6b](https://github.com/lowdefy/lowdefy/commit/249ab6bb475bb0d945e48d4f5b90d2308fd00e16))
- **operators:** Added tests for switch operator. ([ce31fa3](https://github.com/lowdefy/lowdefy/commit/ce31fa30c05023f7a15c944abfc93a7ecb9f6b56))
- **operators:** Updated switch operator to for... ...of syntax. ([cdbd0e0](https://github.com/lowdefy/lowdefy/commit/cdbd0e0d229933d6b0e497f90cf755ccd04b89c9))

### Features

- **docs:** Add how to generate csv. ([3257f51](https://github.com/lowdefy/lowdefy/commit/3257f514b95f7cafb8ac30998194e7ae0a327862))
- **docs:** Add videos to how tos. ([57c7779](https://github.com/lowdefy/lowdefy/commit/57c77798f0356c606cf90bfd36a4f63ab8d0ff36))
- Add generate pdf how to. ([5bde460](https://github.com/lowdefy/lowdefy/commit/5bde460934e2dc94d677af5f287e3c85c0ff4c34))
- **docs:** Added switch operator documentation. ([7c42c78](https://github.com/lowdefy/lowdefy/commit/7c42c7882422ea89332b32bcef985b5bc5059ec8))
- **operators:** Added switch operator. ([436170c](https://github.com/lowdefy/lowdefy/commit/436170c2ec88e6a8ddbd5a34c791cd7eacc5f72b))

# [3.22.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.1...v3.22.0) (2021-09-27)

## Changes

### Blocks

- Added new blocks `PasswordInput` and `CheckboxSwitch`.
- Added an `onClick` event to the `Card` block.
- Fixed the text copied to the clipboard when the Copy button is clicked in the `Paragraph` and `Title` blocks.
- Falsy values like `0`, `false`, and `null` are now rendered correctly in blocks that render HTML.

### Build

- Fixed a bug where the `_var` operator did not work with falsy values for the `default` property.

### CLI

- The renderer served from blocks server url is now used if a blocks server url configured.

### Connections

- Added Stripe connection.

### Documentation

- Fixed AxiosHttp connection type spelling in docs
- Added `\_get` operator switch example.
- Added `_array.reduce` examples.
- Updated CLI npm install docs.
- Changed npx commands to use specific CLI versions for docker deployments.
- Added readme to CLI package.
- Fixed `MultipleSelector` block events documentation.
- Fixed `Title` block `copyable` and `ellipsis` properties documentation.

## Commits

### Bug Fixes

- **blocksAntd:** Fix selector option labels and filter function. ([38445a5](https://github.com/lowdefy/lowdefy/commit/38445a58b626287868ad838d3b9885dccb7c720d))
- **cli:** Use renderer served from blocks server url if configured. ([69d14b4](https://github.com/lowdefy/lowdefy/commit/69d14b4a862827beac955a5039df225af689f297)), closes [#840](https://github.com/lowdefy/lowdefy/issues/840)
- **docs:** Fix AxiosHttp connection type spelling in docs. ([d9b53a0](https://github.com/lowdefy/lowdefy/commit/d9b53a034111bc65813d81c036376d05274ff6c7))

### Features

- Add `_array.reduce` examples. ([c9a6b50](https://github.com/lowdefy/lowdefy/commit/c9a6b50017c05774654388244b06076646449ce9))

# [3.22.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.0...v3.22.0-alpha.1) (2021-09-20)

### Bug Fixes

- **blocksAntd:** Add tests for CheckboxSwitch. ([089150e](https://github.com/lowdefy/lowdefy/commit/089150eacc67e4f27de5f763ad3656d52da40cad))
- **blocksAntd:** Added CheckboxSwitch tests. ([db8c05b](https://github.com/lowdefy/lowdefy/commit/db8c05b0ef546c460f41ab6e7e52de13eb54ff4b))
- **blocksAntd:** Fix CheckboxSwitch color property. ([d2ea3c6](https://github.com/lowdefy/lowdefy/commit/d2ea3c6a7f2d9f13e8a766c76e49a1b3a540d1d9))
- **blocksAntd:** Fix MultipleSelector schema and docs. ([41d25a1](https://github.com/lowdefy/lowdefy/commit/41d25a1e60f403a30824a00626605da37fc5bd3a))
- **blocksAntd:** Fix typo in Paragraph input copyable text property. ([b92621a](https://github.com/lowdefy/lowdefy/commit/b92621a8bae7be6e4d48165b8c54176d2403c592))
- **blocksAntd:** Paragraph and Title blocks copyable error fixed. ([483013d](https://github.com/lowdefy/lowdefy/commit/483013d1715cb97d08ed2f9475606c5b074a6ad3))
- **blocksAntd:** Updated CheckboxSwitch test snapshots. ([025a158](https://github.com/lowdefy/lowdefy/commit/025a1583e902b6edcb94c89ad272761eabd420fe))
- **blocksAntd:** Use updated renderHtml helper function ([5e3de6f](https://github.com/lowdefy/lowdefy/commit/5e3de6f5caa74e549b7f518895708b01a9191ee6)), closes [#820](https://github.com/lowdefy/lowdefy/issues/820)
- **blocksAntd:** Use updated renderHtml in selector blocks ([0da3bd1](https://github.com/lowdefy/lowdefy/commit/0da3bd19512cb0452ac7c559dce2e9ae499288de))
- **blocksBasic:** Handle none type values in DangerousHtml block ([a765be4](https://github.com/lowdefy/lowdefy/commit/a765be4395c315f90b31680d3a914e8ac6f2a5ae))
- **blocksBasic:** Use renamed HtmlComponent in Html block (was RenderHtml) ([cf85d6c](https://github.com/lowdefy/lowdefy/commit/cf85d6ce38ce1fd715d4ae42078b002cc5b5b82e))
- **blockTools:** Add renderHtml helper function. ([b0c35f7](https://github.com/lowdefy/lowdefy/commit/b0c35f7341630c6ab7fb2470d3a3ca1bce1b1f0c))
- **blockTools:** Handle falsey values better in RenderHtml component ([4363803](https://github.com/lowdefy/lowdefy/commit/43638035d038e5b4993a2709cf657ae60d10e8be))
- **build:** Updated meta location tests to include CheckboxSwitch. ([905f47e](https://github.com/lowdefy/lowdefy/commit/905f47edd3ffa252c688d5959d69320a7a42c7bd))
- **build:** Updated meta locations to include CheckboxSwitch block. ([cd2ab8c](https://github.com/lowdefy/lowdefy/commit/cd2ab8c3a87e76d0b61284c60f5f3cfcad98c24f))
- **cli:** Add readme to CLI package. ([cf5c406](https://github.com/lowdefy/lowdefy/commit/cf5c406da6d0c1f53e23d0a1d2b802c89f29db44))
- **deps:** Update dependency axios to v0.21.4 ([81cd2b6](https://github.com/lowdefy/lowdefy/commit/81cd2b6e0ae3dc377b9cee6e3c801c47ddca2f08))
- **docs:** Added CheckboxSwitch examples and CheckboxSelector note. ([9cf56bf](https://github.com/lowdefy/lowdefy/commit/9cf56bfbaa5c7a75c55d24d2f965ec351c1672e0))
- **docs:** Added copyable and ellipsis config to Title block. ([9f8632e](https://github.com/lowdefy/lowdefy/commit/9f8632ec577196ea45471470a9dd13d3dbc09446))
- **docs:** Change npx commands to specific versions for deployments. ([f2c380b](https://github.com/lowdefy/lowdefy/commit/f2c380b07a78defff79281d5c07c61a718bfe750))
- **docs:** Convert CLI commands to npx commands. ([c9cd643](https://github.com/lowdefy/lowdefy/commit/c9cd643f3809fdc0cde7ba47e17e392b3236c17b))
- **docs:** Update CLI npm install docs. ([98a8b71](https://github.com/lowdefy/lowdefy/commit/98a8b71ff2ef961ccfcb8b94e115b4162881dd38))

### Features

- **blocksAntd:** Added CheckboxSwitch demo example. ([7187849](https://github.com/lowdefy/lowdefy/commit/718784920d6e5daa69d30601cd88e7fadd94c5d4))
- **blocksAntd:** CheckboxSwitch block has been added. ([838f5ea](https://github.com/lowdefy/lowdefy/commit/838f5ea8852cff9f193e3e0a3dfb16b9c7f1da9e))
- **docs:** Add \_get operator switch example. ([b727b9e](https://github.com/lowdefy/lowdefy/commit/b727b9edd0f37d3d10d5add32cbd9411fa4b6f98))
- **docs:** Added CheckboxSwitch docs. ([81752aa](https://github.com/lowdefy/lowdefy/commit/81752aa927f1d6050a290440ca15a87c05f3ea51))

# [3.22.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.2...v3.22.0-alpha.0) (2021-09-08)

### Bug Fixes

- **blocksAntd:** Updated Password Input tests. ([7f32230](https://github.com/lowdefy/lowdefy/commit/7f322300b7888bc3de51d36483f06a1f68d5d74e))
- **build:** Updated meta locations tests. ([9e20ace](https://github.com/lowdefy/lowdefy/commit/9e20acebaac9ae01fd3974469bddede0e651da19))

### Features

- **blocksAntd:** Card block now has an onClick event. ([4263f6b](https://github.com/lowdefy/lowdefy/commit/4263f6b8764bb147e301c3dbba0ac4986959aad8))
- **blocksAntd:** Password Input block has been added. ([9d99ef8](https://github.com/lowdefy/lowdefy/commit/9d99ef82a930adb93b022c42ef765cf8a5022c70))
- **build:** Added PasswordInput meta location. ([66abcdd](https://github.com/lowdefy/lowdefy/commit/66abcddafc7d8b1950e96a137d0d336ccf3e145b))
- **docs:** Add Stripe documentation. ([ed963ec](https://github.com/lowdefy/lowdefy/commit/ed963ec823ef19e88ed8320d71b83a7eef2e6cfe))
- **docs:** Added Password Input block docs. ([ee8bda4](https://github.com/lowdefy/lowdefy/commit/ee8bda4a5bd6248c03433a720652d72c3b9ddbae))
- **graphql:** Add Stripe connection. ([e676258](https://github.com/lowdefy/lowdefy/commit/e676258688a61b93da7267272903d02cdbb3edcb))

## [3.21.2](https://github.com/lowdefy/lowdefy/compare/v3.21.2-alpha.0...v3.21.2) (2021-08-31)

## Changes

#### Blocks

- Fix undefined Tooltip title showing empty tooltip.

#### Build

- Add async option to actions schema

#### Connections

- Fix MongoDB in AWS Lambda by downgrading to the LTS version (3.6.12) of the mongodb driver. MongoDB connections were throwing a `right-hand side of instanceof is not an object` error.

## Commits

### Bug Fixes

- Downgrade mongodb driver to LTS version 3.6.12. ([24f94f6](https://github.com/lowdefy/lowdefy/commit/24f94f644256cfc4f1b09c3122f2525c58f1502c))
- **blocksAntd:** Fix blocks tooltip tests. ([b869fb0](https://github.com/lowdefy/lowdefy/commit/b869fb0f3c352ca6111b2974c719de9de76e8d71))
- **blocksAntd:** Fix undefined Tooltip title showing empty tooltip. ([358e423](https://github.com/lowdefy/lowdefy/commit/358e423bf10d35fab904267225c336749bfd4232))
- **build:** Add async to actions schema. ([1276422](https://github.com/lowdefy/lowdefy/commit/127642294ac962ac215303612e16455e395860d4))
- **deps:** Update dependency mongodb to v4.1.1. ([96aa9a6](https://github.com/lowdefy/lowdefy/commit/96aa9a65cd7a567eef493e52d17684005e34b2a1))

## [3.21.2-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.1...v3.21.2-alpha.0) (2021-08-31)

### Bug Fixes

- Downgrade mongodb driver to LTS version 3.6.12. ([24f94f6](https://github.com/lowdefy/lowdefy/commit/24f94f644256cfc4f1b09c3122f2525c58f1502c))
- **blocksAntd:** Fix blocks tooltip tests. ([b869fb0](https://github.com/lowdefy/lowdefy/commit/b869fb0f3c352ca6111b2974c719de9de76e8d71))
- **blocksAntd:** Fix undefined Tooltip title showing empty tooltip. ([358e423](https://github.com/lowdefy/lowdefy/commit/358e423bf10d35fab904267225c336749bfd4232))
- **build:** Add async to actions schema. ([1276422](https://github.com/lowdefy/lowdefy/commit/127642294ac962ac215303612e16455e395860d4))
- **deps:** Update dependency mongodb to v4.1.1. ([96aa9a6](https://github.com/lowdefy/lowdefy/commit/96aa9a65cd7a567eef493e52d17684005e34b2a1))

## [3.21.1](https://github.com/lowdefy/lowdefy/compare/v3.21.0...v3.21.1) (2021-08-26)

### Bug Fixes

- **blocksAntd:** Fix Alert padding. ([9fb9686](https://github.com/lowdefy/lowdefy/commit/9fb9686cd2bfc9ed5028a44a24146d8c587a8ca2))
- **docs:** Add missing hash docs. ([2520555](https://github.com/lowdefy/lowdefy/commit/2520555212b699bf58d9a01b5db996cb2f5b44cb))
- **docs:** Add responsive layout docs and video. ([5c31dac](https://github.com/lowdefy/lowdefy/commit/5c31dacda32ec8688dcf6605756c6a1262867adf))
- **docs:** Update node server docs. ([bb64d3e](https://github.com/lowdefy/lowdefy/commit/bb64d3e850b0c60a5129babbb5b144a577d8635d))
- **renderer:** Fix loading skeletons, closes [#798](https://github.com/lowdefy/lowdefy/issues/798) ([e4dd10e](https://github.com/lowdefy/lowdefy/commit/e4dd10e4b35e6fc957abe955d4c1a5b6767ecc66))
- **docs:** Added responsive setup to Layout Concepts. ([0635433](https://github.com/lowdefy/lowdefy/commit/0635433df47ff1fd1fe067231ea0a9ff4b3f652e))

# [3.21.0](https://github.com/lowdefy/lowdefy/compare/v3.20.4...v3.21.0) (2021-08-25)

## Changes

#### Actions

- Add onMount and onMountAsync actions for all blocks.
- Add debounce to the build schema.

#### Blocks

- Divider not to render empty title.
- RenderHtml to return span by default.

#### Renderer

- Refactor renderer to work with `props.children` instead of a render function.

#### Connections

- Add https agent options to AxiosHttp connection.

#### Docs

- Add basic full example for AxiosHttp.

#### Operators

- Add `_hash` operator.
- Add \_uuid v1, v3, v4, and v5 options.

#### Servers

- Fix replaceAll not a function.

## Commits

### Bug Fixes

- **blocksAntd:** Divider not to render empty title, closes [#790](https://github.com/lowdefy/lowdefy/issues/790) ([790fb89](https://github.com/lowdefy/lowdefy/commit/790fb89522538baccb8617d929dc7e3bcbe2e7fb))
- **blocksBasic:** Html test change to new RenderHtml. ([e43617a](https://github.com/lowdefy/lowdefy/commit/e43617a47a04b1e7d9297379207d6455bf66a453))
- **blocksBasic:** Test change to new RenderHtml. ([ee9e3f0](https://github.com/lowdefy/lowdefy/commit/ee9e3f0d6150fdcd5ea42d0cfc1c0b6be8cc43a9))
- **blocksColorSelectors:** Update tests. ([dcbbf0b](https://github.com/lowdefy/lowdefy/commit/dcbbf0b25db1a88d19f4f7785a60d5e56d7355d8))
- **blockTools:** RenderHtml to only update ref after render. ([9351255](https://github.com/lowdefy/lowdefy/commit/9351255d3a05d3cbfb0f1241b714feb8960878df))
- **blockTools:** RenderHtml to return span by default, closes [#775](https://github.com/lowdefy/lowdefy/issues/775) [#777](https://github.com/lowdefy/lowdefy/issues/777) ([abbd823](https://github.com/lowdefy/lowdefy/commit/abbd8237174ba3565d5af149c846ca99ada9d06b))
- **build:** Add debounce to the build schema. ([2ea31b1](https://github.com/lowdefy/lowdefy/commit/2ea31b1f3e770a1edbcdefa790908f9df7c04997))
- **docs:** Add basic full example for AxiosHttp. ([1e689d2](https://github.com/lowdefy/lowdefy/commit/1e689d2cf27d9d94c1202bd4f716369b7aea8313))
- **docs:** Reformat v3 and v5 uuid argument definitions. ([98cd626](https://github.com/lowdefy/lowdefy/commit/98cd626550734313fb0cd3ab1206a13d258064ca))
- **docs:** Update \_uuid docs. ([07178f1](https://github.com/lowdefy/lowdefy/commit/07178f1bd59d5fb52f94bcfd08f860026aaeb83d))
- **docs:** Updated docs to remove legacy v1, v4 uuid operators. ([8544dc9](https://github.com/lowdefy/lowdefy/commit/8544dc9e69bce7345099508bfec3042b5e8997bd))
- **docs:** Updated documented v3, v5 uuid function definitions. ([bd0e777](https://github.com/lowdefy/lowdefy/commit/bd0e777c9744e668d7bf25e5aeb2b293e6337464))
- **operators:** Remove array param type from v3, v5 uuid operator. ([5141fdf](https://github.com/lowdefy/lowdefy/commit/5141fdff7f1d60ded07e89a659762d881e7fc4f7))
- **operators:** Updated tests to remove legacy v1, v4 uuid operators. ([f43a054](https://github.com/lowdefy/lowdefy/commit/f43a054d2c7dcff219936cebfe8ad69810dc362a))
- **renderer:** Add crypto build fallback. ([1f74ca7](https://github.com/lowdefy/lowdefy/commit/1f74ca7674f48241060ebcb4030378f279431376))
- **server:** replaceAll not a function, closes [#789](https://github.com/lowdefy/lowdefy/issues/789) ([055a2ac](https://github.com/lowdefy/lowdefy/commit/055a2ac4bad52402ebb200ebff02dea183af56e2))
- Add array and object param types to v3 and v5 uuid methods. ([0a551e9](https://github.com/lowdefy/lowdefy/commit/0a551e9d9303c9f4e7a15e82b439ec6291c49187))

### Features

- **docs:** Add onMount and onMountAsync docs. ([a3c698d](https://github.com/lowdefy/lowdefy/commit/a3c698dde629b475a8d1858613f85a67c4ec13f6))
- **graphql:** Add https agent options to AxiosHttp connection. ([df94e01](https://github.com/lowdefy/lowdefy/commit/df94e0191bf5dfbc539a3703d2090331ef810c24)), closes [#794](https://github.com/lowdefy/lowdefy/issues/794)
- **operators:** Add \_hash operator. ([0d3244a](https://github.com/lowdefy/lowdefy/commit/0d3244af5b13633c640bc471ed72cb7df035b415))
- **operators:** Add \_uuid v1, v2, v3, v4, and v5 options. ([3f2fc75](https://github.com/lowdefy/lowdefy/commit/3f2fc757224ec4a766b138d45ebcc68d47c56463))
- **operators:** Add array param type from v3, v5 uuid operator. ([764051b](https://github.com/lowdefy/lowdefy/commit/764051b950864dbe59de50930383caede966e1be))
- **renderer:** Refactoring renderer and implementing onMount and onMountAsyc, closes [#778](https://github.com/lowdefy/lowdefy/issues/778) ([101d23a](https://github.com/lowdefy/lowdefy/commit/101d23a3f9f495549553ddecbd5420867e9023db))
- Add support for v1, v3, v4 and v5 to the \_uuid operator. ([c9ef4b9](https://github.com/lowdefy/lowdefy/commit/c9ef4b93fadf3dfa9b01ffb43fbd0375706bcb25))
- **operators:** Add RIPEMD-160 algorithm. ([3e07218](https://github.com/lowdefy/lowdefy/commit/3e07218df07737fce28de4525f8d1fc69702e729))
- **operators:** Add uuid to client, closes [#783](https://github.com/lowdefy/lowdefy/issues/783) ([6dc8d28](https://github.com/lowdefy/lowdefy/commit/6dc8d28608f18317986f21613af59a513d84cef8))

## [3.20.4](https://github.com/lowdefy/lowdefy/compare/v3.20.3...v3.20.4) (2021-08-21)

### Bug Fixes

- **blocksAntd:** Fix Card block title area. ([475aef6](https://github.com/lowdefy/lowdefy/commit/475aef6a817068ee6734cba32b8b684c459e2a7c))
- **blocksAntd:** Fix Card title if no title is specified. ([60074f9](https://github.com/lowdefy/lowdefy/commit/60074f991d5893929cbf21fabe4b428e7eb4dc43))
- **blocksAntd:** Update Card block snapshot tests. ([4c67f41](https://github.com/lowdefy/lowdefy/commit/4c67f41f4299c107257efa1f7a34bc163f78c88f))
- **blocksAntd:** Update schema for Descriptions. ([50bf48c](https://github.com/lowdefy/lowdefy/commit/50bf48c6606ad327c989b34d58f0404406cbf2a3))
- **build:** Fix user specified type locations. ([0456b00](https://github.com/lowdefy/lowdefy/commit/0456b0073dc13d743ba962d81488088c3794d3da))

## [3.20.3](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.3) (2021-08-20)

### Bug Fixes

- **server-netlify:** Initialise basePath in Netlify server. ([8085b4a](https://github.com/lowdefy/lowdefy/commit/8085b4abef3a3f5a9a93cb37a5270d2ca0969ac0))

## [3.20.2](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.2) (2021-08-20)

### Bug Fixes

- **build:** Cache readFile and getMeta promises. ([d1fd3da](https://github.com/lowdefy/lowdefy/commit/d1fd3daa90716e98e3a06022e743df9a3fdd58d0))
- **cli:** Initialise basePath in CLI dev server. ([3c2093a](https://github.com/lowdefy/lowdefy/commit/3c2093a6bd85e969c0f3cccfc213c9ebccdd7144))
- **docs:** Remove console log. ([41bc269](https://github.com/lowdefy/lowdefy/commit/41bc269d67c1d7d258ef5705fe845921068d3de1))

## [3.20.1](https://github.com/lowdefy/lowdefy/compare/v3.20.0...v3.20.1) (2021-08-20)

### Bug Fixes

- **build:** Fix unevaluated being passed to \_ref transformer. ([537a776](https://github.com/lowdefy/lowdefy/commit/537a77651220d7ffab117572c40ff790e296af56))

# [3.20.0](https://github.com/lowdefy/lowdefy/compare/v3.19.0...v3.20.0) (2021-08-20)

## Changes

#### Actions

- A `debounce` option has been added to events.
- An `async` option has been added to actions so that they are not awaited in the action chain.
- A new `ResetValidation` action has been added.
- A new `Throw` action has been added.
- A `back` option has been added to the `Link` action.
- The Lowdefy action functions can now be used inside the `JsAction` action.
- The `Validate` action can now take a list of regular expressions to match blocks to validate.
- Only blocks that have been validated now show the validation result.

#### Blocks

- The `List` block now has `direction`, `wrap`, and `scroll` properties.

- HTML is now supported in block properties that used to only take strings. The following blocks now have support for HTML properties:

  - `Alert`
  - `AutoComplete`
  - `Button`
  - `ButtonSelector`
  - `Card`
  - `CheckboxSelector`
  - `CircleColorSelector`
  - `Collapse`
  - `ColorSelector`
  - `CompactColorSelector`
  - `ConfirmModal`
  - `Descriptions`
  - `Divider`
  - `GithubColorSelector`
  - `Label`
  - `Message`
  - `Modal`
  - `MultipleSelector`
  - `Notification`
  - `Paragraph`
  - `RadioSelector`
  - `Result`
  - `Selector`
  - `SliderColorSelector`
  - `Statistic`
  - `SwatchesColorSelector`
  - `Title`
  - `Tooltip`
  - `TwitterColorSelector`

- The `showTotal` property in the `Pagination` block can now be a string or function.
- If the `onClose` event fails in the `ConfirmModal`, `Drawer`, and `Modal` blocks, the block no longer closes.
- The `ParagraphInput` and `TitleInput` blocks now render non-truthy values.

#### CLI and build

- The `_ref` operator can now specify a resolver function that overrides the default reading of configuration files from the file system.
- A default `_ref` resolver function can be specified for an app.
- The CLI can now be configured from the `lowdefy.yaml` file.
- The `dev` command now has `watch` and `watchIgnore` options to control which files are watched for rebuilds.
- The blocks server URL is now configurable.
- The `dev` server no longer exits if the initial build fails.

#### Connections

- The following Elasticsearch requests have been added:
  - `ElasticsearchDelete`
  - `ElasticsearchDeleteByQuery`
  - `ElasticsearchIndex`
  - `ElasticsearchUpdate`
  - `ElasticsearchUpdateByQuery`
- Read and write checking for Elasticsearch has been added.
- The `mongodb` driver has been updated to 4.1.0, and now supports different options.
- Connection options are now passed to the `MongoDBCollection` connection.

#### Docs

- The `AxiosHttp` examples have been fixed.
- The Netlify deployment steps have been updated.

#### Operators

- The `_location` operator now returns the `basePath`, `homePageId`, and `pageId`.
- The `_number` operator has been added.

#### Servers

- The server `basePath` is now configurable.
- A Node.js production server has been added.

## Commits

### Bug Fixes

- **blocks-antd:** Fix Descriptions block items schema ([525e8eb](https://github.com/lowdefy/lowdefy/commit/525e8eb8e3927e21e7b886cde0712ccb6d4c5b03))
- **blocks-antd:** Update snapshot tests for basePath ([5add1a7](https://github.com/lowdefy/lowdefy/commit/5add1a72a3bc341761be7aee0626b9e29a5ded67))
- **blocksAntd:** Add additional properties to Descriptions and use RenderHtml. ([dfc468d](https://github.com/lowdefy/lowdefy/commit/dfc468d1fef7b9aebb611c82ff19285260bc5d7e))
- **blocksAntd:** Add blocks display type to Descriptions schema. ([bd78efc](https://github.com/lowdefy/lowdefy/commit/bd78efc0deb0702fb91bafd154f4aa64662d4f85))
- **blocksAntd:** Add option to define `showTotal` as a string or function. ([9ac3fc9](https://github.com/lowdefy/lowdefy/commit/9ac3fc9711df889a1d58d83a68ed2e6baf8f0946))
- **blocksAntd:** Added string output for ParagraphInput and TitleInput. ([5735bbf](https://github.com/lowdefy/lowdefy/commit/5735bbf1a51f9ea263797e62e69958cb9cfd5b3c))
- **blocksAntd:** Do not close modals and drawer if event is bounced. ([33814b0](https://github.com/lowdefy/lowdefy/commit/33814b04fd70bad08cdca50f40ee8b05f13de9e6))
- **blocksAntd:** Use relative paths with Link. ([f43762f](https://github.com/lowdefy/lowdefy/commit/f43762fc9eccd1876b0f240f3ea1ac64373238a3))
- **blocksBasic:** Add row-reverse, column-reverse options to List direction. ([5926be6](https://github.com/lowdefy/lowdefy/commit/5926be6da45aff20a1743d8871b8c1dd1ff5d4e9))
- **blocksBasic:** Refactor to use RenderHtml. ([8e8ff8d](https://github.com/lowdefy/lowdefy/commit/8e8ff8daea67cff2637a4b83d7c0582fc3fc77d6))
- **blocksBasic:** Updated List schema and snapshots. ([7319fe7](https://github.com/lowdefy/lowdefy/commit/7319fe793b65a681971d63f9dfc2214180d5621a))
- **blocksBasic:** Updated List schema. ([006b3b7](https://github.com/lowdefy/lowdefy/commit/006b3b75d89517297c53ca2408c88eb46fe352bb))
- **blockTools:** Add RenderHtml to blockTools. ([7662de1](https://github.com/lowdefy/lowdefy/commit/7662de1d1bf19b781cefcb2425e6b66f14e146ef))
- **blockTools:** RenderHtml should default to display-inline block. ([dcaf615](https://github.com/lowdefy/lowdefy/commit/dcaf61575c09a9f253f1197826ff4ea60bdcd685))
- **build:** Add tests for readConfigFile. ([809f09a](https://github.com/lowdefy/lowdefy/commit/809f09a51fb46d94c54a35042cd0fb6c58f11fbd))
- **build:** Add writeBuildArtifact test. ([350f25f](https://github.com/lowdefy/lowdefy/commit/350f25faf8171c3ed42a738b39333d289cb1dee8))
- **build:** Fix getMeta memoisation ([7f824b0](https://github.com/lowdefy/lowdefy/commit/7f824b0553358c695c64ffe0fcbf38ca04a075c3))
- **build:** Fix getMeta memoised return. ([a939bd5](https://github.com/lowdefy/lowdefy/commit/a939bd5b3fd68c557e38848993551dff19b5622e))
- **build:** Fix getMeta return value after dataloader has been removed. ([993d398](https://github.com/lowdefy/lowdefy/commit/993d3988be32e46e93619ed2edc5a6380f726510))
- **build:** Refactor build refs. ([dbb7c88](https://github.com/lowdefy/lowdefy/commit/dbb7c88f44719277b2583c3b11a2cd150be841d1))
- **build:** refactor buildRefs function. ([b66cc5a](https://github.com/lowdefy/lowdefy/commit/b66cc5a38db08666a8edc0312045c2b8ea20f66e))
- **build:** Refactor buildRefs. ([8d43e00](https://github.com/lowdefy/lowdefy/commit/8d43e004e52384c143524645f36544d4795affe9))
- **build:** Refactor reading of config files. ([d1591a2](https://github.com/lowdefy/lowdefy/commit/d1591a2a0578a4bda230e35e86fcbd1d4e5dcffa))
- **build:** Refactor writing of build artifact files. ([7162760](https://github.com/lowdefy/lowdefy/commit/7162760b18b62c9b5f25ea1ff024c1c1724132df))
- **build:** Remove dataloader dependency ([4c64bd7](https://github.com/lowdefy/lowdefy/commit/4c64bd7ce290ba7881d6deda3097d0b9fb765203))
- **build:** remove metaloader to remove dataloader dependency ([f6f35a9](https://github.com/lowdefy/lowdefy/commit/f6f35a91342a771a644a350378ef52ab9d80c05d))
- **build:** Remove unsupported eval property on \_ref. ([808f619](https://github.com/lowdefy/lowdefy/commit/808f619d19c6b450133861913ee56e69f783fbc0))
- **build:** Remove unused tests. ([f2db270](https://github.com/lowdefy/lowdefy/commit/f2db270a223e290a58fcd4e2225365692d83e097))
- **build:** Standarise buildPages function signatures. ([65c7e8b](https://github.com/lowdefy/lowdefy/commit/65c7e8ba9b39609c992878d84968a2cbc60b4a16))
- **build:** Test memoisation in getMeta. ([c1f887e](https://github.com/lowdefy/lowdefy/commit/c1f887e4ff3da0122d3d7b5566a1f64f7a6dc0e1))
- **cli:** Do not exit dev server if the initial build fails ([41653f8](https://github.com/lowdefy/lowdefy/commit/41653f827ad25d56a1cd189dcb551f7ca4db6ef9)), closes [#711](https://github.com/lowdefy/lowdefy/issues/711)
- **cli:** Fix print tests in CI. ([6be137d](https://github.com/lowdefy/lowdefy/commit/6be137d45a6bfaf9a6c3a3254a7b5917893c4f6a))
- **docs:** Add more examples to Throw. ([8ef4bb3](https://github.com/lowdefy/lowdefy/commit/8ef4bb3349e2edf3d95ab5c7bb70fa34f70c318e))
- **docs:** Docs typo fixes. ([df5770d](https://github.com/lowdefy/lowdefy/commit/df5770d13b9ae539df7af09bf1f28a00dcd8b834))
- **docs:** Fix AxiosHttp examples, closes [#686](https://github.com/lowdefy/lowdefy/issues/686) ([1fc3329](https://github.com/lowdefy/lowdefy/commit/1fc33295f07a215f12b229557468cb49159addcc))
- **docs:** Fix custom blocks basePath typo. ([eaee5aa](https://github.com/lowdefy/lowdefy/commit/eaee5aa4bf6c745de08892ac99ecccec3137f66e))
- **docs:** Fix mongodb examples in docs. ([cde85b7](https://github.com/lowdefy/lowdefy/commit/cde85b7fb81b4a02e631ca4381c8212e581b7fd9))
- **docs:** Fix sentences on Validation docs. ([d5a5b7f](https://github.com/lowdefy/lowdefy/commit/d5a5b7f8e5ad818c19ecb75c6d40eb2d714042cc))
- **docs:** Remove documentation for eval option on \_ref. ([baf1090](https://github.com/lowdefy/lowdefy/commit/baf1090be7774d427be476411cca9167d28382c7))
- **docs:** Remove local types. ([282380a](https://github.com/lowdefy/lowdefy/commit/282380a75d83eb66464ebd0fb4fda44c53b7d2bd))
- **docs:** Sort endpoints alphabetically ([26ca2b7](https://github.com/lowdefy/lowdefy/commit/26ca2b7b2b107bdcb7c6fd1c5859e1bf89cbd3fe))
- **docs:** Update Netlify deployment steps ([071d402](https://github.com/lowdefy/lowdefy/commit/071d402dfbd06c6cf28b4d58388e2910adae43a4))
- **engine:** Add tests for Blocks.validate. ([0a0a66a](https://github.com/lowdefy/lowdefy/commit/0a0a66aa7639db6fcded6aa5a4937c2b96e6e7c8))
- **engine:** Catch CallMethod method not defined error and add tests for CallMethod. ([96f9cb1](https://github.com/lowdefy/lowdefy/commit/96f9cb1d65c80727a27703497a9c25cf694de11d))
- **engine:** Fixes to event debouncing and tests. ([89266f2](https://github.com/lowdefy/lowdefy/commit/89266f2dbdf860434c94811613a07a385afdc78d))
- **engine:** Refactor Validate to work with getBlockMatcher. ([8c9de14](https://github.com/lowdefy/lowdefy/commit/8c9de14c3f26a64adf2a5dbb93b86105978c62d4))
- **engine:** Remove showValidationErrors from context. ([24e0bbc](https://github.com/lowdefy/lowdefy/commit/24e0bbc3a849a8d3cc2b4b3313a3530dd0369b03))
- **engine:** Update action tests to include debounce. ([b21c440](https://github.com/lowdefy/lowdefy/commit/b21c440eb0144bb5d53a2d3320bc8637de300c90))
- **engine:** Update events test for undefined event. ([05bc928](https://github.com/lowdefy/lowdefy/commit/05bc928e45d07fba5b6a27e505cd3c1128b4216b))
- **operators:** Fix homePageId typo and update tests. ([6bfa83a](https://github.com/lowdefy/lowdefy/commit/6bfa83a68c355858ab8ade2d3a2e8a8df45bb6dc))
- Add \_number operator. ([1ca3966](https://github.com/lowdefy/lowdefy/commit/1ca3966495f96da9a66fa912a70703748c10d197))
- Enable read/write checking for Elasticsearch ([9d13c32](https://github.com/lowdefy/lowdefy/commit/9d13c326eeb8e90d4880aa472a16c72bc71001fb))
- Fix \_number operator tests. ([3b36a53](https://github.com/lowdefy/lowdefy/commit/3b36a53e42f0996c7ba6d5e2e19436c438a08ffe))
- Fix Docker server docs ([5171320](https://github.com/lowdefy/lowdefy/commit/517132043f18dce96729252c2aaac90e204df5d7))
- Fixes for configurable basePath. ([63955bb](https://github.com/lowdefy/lowdefy/commit/63955bbd1131da3b27b537d4e0d72dc943119287))

### Features

- **blocksAntd:** Add support for html on all input Label title and extra. ([59979c7](https://github.com/lowdefy/lowdefy/commit/59979c7ed2afd9ffadb97f06d59fca323a1ac589))
- **blocksAntd:** Add support for html to Descriptions and refactor. ([6261355](https://github.com/lowdefy/lowdefy/commit/6261355f313a4d240407373c34c80608b4c1efd3))
- **blocksAntd:** Added onclose action chain error detection to ConfirmModal, Drawer, Modal. ([66e0692](https://github.com/lowdefy/lowdefy/commit/66e0692d9c9dc8a25be9115d2522e4cb77075c50))
- **blocksAntd:** options labels to support html. ([3533a96](https://github.com/lowdefy/lowdefy/commit/3533a96cb2031ba83932135a2d72fb554d9b9c12))
- **blocksAntd:** Selector option.label can be html. ([9200e34](https://github.com/lowdefy/lowdefy/commit/9200e3461ccb719f40578e9f2c15de12fe3c7053))
- **blocksBasic:** Added list direction, wrapping and scrolling. ([aba280a](https://github.com/lowdefy/lowdefy/commit/aba280a4f3768c462bff65c8726939a8e6b9cec9))
- **build:** Add support for app default ref resolver function. ([b23e8c9](https://github.com/lowdefy/lowdefy/commit/b23e8c967ec1c48664a9aef954a0b53497af28d2))
- **build:** Add support for resolver functions in \_ref operator. ([aa7fddc](https://github.com/lowdefy/lowdefy/commit/aa7fddcfc20b3689400bd69d9b865f9306e6991f))
- **cli:** Add option to configure cli from the lowdefy.yaml file ([e4f62d0](https://github.com/lowdefy/lowdefy/commit/e4f62d0cf4784ec1ffb872f876469fc6beea0efd))
- **cli:** Add watch and watchIgnore options to dev command ([9eaf3e8](https://github.com/lowdefy/lowdefy/commit/9eaf3e8adb39eca7e7c7a9c8fe131776960002c8))
- **docs:** Add event debounce. ([e4c5db4](https://github.com/lowdefy/lowdefy/commit/e4c5db4abdf63fc27719bf72890393f33004ef43))
- **docs:** Add ResetValidation docs. ([289c762](https://github.com/lowdefy/lowdefy/commit/289c762696cdf35f28a53d8d7ce1c340f8ca3b9f))
- **docs:** Document \_ref resolver functions. ([446b383](https://github.com/lowdefy/lowdefy/commit/446b3833a9c3c861db609319ed11e1b14222327e))
- **docs:** Document basePath setting. ([aa9601c](https://github.com/lowdefy/lowdefy/commit/aa9601c84935c60ec36c9bf752e94fe75a8b8505))
- **docs:** Update docs for new Validation. ([a91a7c7](https://github.com/lowdefy/lowdefy/commit/a91a7c77e93f6ab20fd520b9aa9bd75ecbf9650d))
- **engine:** Add async option to actions ([81036db](https://github.com/lowdefy/lowdefy/commit/81036db446ae64cd023fe198360fa9506e818ca0))
- **engine:** Add async tests and update docs. ([fd967b9](https://github.com/lowdefy/lowdefy/commit/fd967b929b4ab57a787b1e052c74334dfc54e87b))
- **engine:** Add debounce option to events. ([003cb0b](https://github.com/lowdefy/lowdefy/commit/003cb0b1ec13a246aa4848f2c5020a937b97ac3d))
- **engine:** Add ResetValidation action. ([01237e3](https://github.com/lowdefy/lowdefy/commit/01237e3340b3547ae88cc7248eed7daa1ac5e4c5))
- **engine:** Add tests for events debounce. ([2ff29cb](https://github.com/lowdefy/lowdefy/commit/2ff29cb772bc940bb59dc976c31d473771c8da97))
- **engine:** Add Throw action. ([d2a23f0](https://github.com/lowdefy/lowdefy/commit/d2a23f0022aca6d9f0e330ef3652ad2a8f8364b7))
- **engine:** Document Lowdefy action functions in JsAction. ([7634145](https://github.com/lowdefy/lowdefy/commit/7634145286cdb8483bbcd151343bbcb6d5a0a65f))
- **engine:** showValidation on block level and params.regex for Validate. ([6824b07](https://github.com/lowdefy/lowdefy/commit/6824b07127f86ed19d0239ba903f88ddb4287932))
- **graphql:** Updated mongo client to include connection options and documented command options. ([57127ee](https://github.com/lowdefy/lowdefy/commit/57127ee9240ae1e20fae109e4928048e232b9935))
- **graphql:** Updated mongodb to 4.1.0 and documented MongoDBAggregation options. ([3fefe99](https://github.com/lowdefy/lowdefy/commit/3fefe9974362485d752a9de1c940d5e3f44932ea))
- **operators:** Add basePath to \_location. ([eb95c8a](https://github.com/lowdefy/lowdefy/commit/eb95c8a64b2b7698f006750cd3639ee71dbbf4a9))
- **operators:** Add pageId and homePageId to \_location. ([00842d4](https://github.com/lowdefy/lowdefy/commit/00842d48153fc2b49ac6bd6cd88d73c3cce0c178))
- Ability to use html in ConfirmModal, Divider, Message, Modal. ([ec69fb7](https://github.com/lowdefy/lowdefy/commit/ec69fb7ed8759c2d84302da87b25ece52c2988e2))
- Add back option to link. ([b6cf705](https://github.com/lowdefy/lowdefy/commit/b6cf705d5c7e0b54a3c22d7a33116fc30dc9e191)), closes [#728](https://github.com/lowdefy/lowdefy/issues/728)
- add ElasticsearchDelete request. ([9f1fc34](https://github.com/lowdefy/lowdefy/commit/9f1fc347d60b5f2877d7331007359ff5746c735b))
- Add ElasticsearchDeleteByQuery request. ([a370e9e](https://github.com/lowdefy/lowdefy/commit/a370e9e7c615bac4341f26f7bafb2abd5dc707a7))
- add ElasticsearchIndex request. ([08de720](https://github.com/lowdefy/lowdefy/commit/08de720351c62d5211d94d145105e76e5dd55f5c))
- Add ElasticsearchUpdate request. ([a23a7be](https://github.com/lowdefy/lowdefy/commit/a23a7be1632f60beef162dc726168b51f185508e))
- Add ElasticsearchUpdateByQuery request. ([3cc30ca](https://github.com/lowdefy/lowdefy/commit/3cc30ca4a893e486c487fc6c1c3ca18042ce68d7))
- Add Lowdefy actions to JsAction ([7af4442](https://github.com/lowdefy/lowdefy/commit/7af4442c6f2314ffbf927a413c15649425a93b59))
- Added ability to use html in Alert, Descriptions and Notification. ([efa61bd](https://github.com/lowdefy/lowdefy/commit/efa61bd7a08172938a56025b68ca15f08195a088))
- Added ability to use html in Button, Card and Collapse. ([6d4d696](https://github.com/lowdefy/lowdefy/commit/6d4d696ce35c327c22e014929e363aa8cc5c5954))
- Added ability to use html in Paragraph, Result and Statistic. ([483eee6](https://github.com/lowdefy/lowdefy/commit/483eee6eecacffe90f76221e5cb62ddaa07e2649))
- Added ability to use html in Title and Tooltip. ([9329d24](https://github.com/lowdefy/lowdefy/commit/9329d2487edda363a633eb4081914dd8fb7a1c9c))
- Document node server. ([20dfb7d](https://github.com/lowdefy/lowdefy/commit/20dfb7db70868a0b2006f4f004736562acc480dc))
- Initialise @lowdefy/server-node package ([17c27f7](https://github.com/lowdefy/lowdefy/commit/17c27f7f49ca8df85e609760c0c2c3fea73f4a62))
- Make blocks server URL configurable. ([65c9fe7](https://github.com/lowdefy/lowdefy/commit/65c9fe79b254bf5a20b87e0a2ec4fdcd1ecd5427)), closes [#670](https://github.com/lowdefy/lowdefy/issues/670)
- Make server basepath configurable ([3981f8c](https://github.com/lowdefy/lowdefy/commit/3981f8c60b9a2e6f5429a5fba499c65c16ccf30f))
- Update Elasticsearch docs ([8feb78b](https://github.com/lowdefy/lowdefy/commit/8feb78b3cc168da818b156349d389c66ae8ddef3))
- Updated antd blocks fields .json that support html. ([c9ae5e7](https://github.com/lowdefy/lowdefy/commit/c9ae5e745fe2010337228a6d6f75ca5903f0c0b0))

# [3.19.0](https://github.com/lowdefy/lowdefy/compare/v3.18.1...v3.19.0) (2021-07-26)

## Changes

### Features

- Adds support for Elasticsearch.
- Adds the `_change_case` operator.

### Fixes

- Increases the server bodyParserConfig limit to 5mb. This is to mitigate errors where the payload is too large if their is a lot of data in state or global. This issue will be resolved in the next major version by [#641](https://github.com/lowdefy/lowdefy/issues/641).
- Changes the default value of the `Selector` `showSearch` property to true.
- The default value returned by the `_request` operator if values are not found is now `null`, like other getter operators.

### Contributions

- Thanks [Moritz Friedrich (Radiergummi)](https://github.com/Radiergummi) for contributing the Elasticsearch connection.

## Commits

### Bug Fixes

- **blocksAntd:** Update Selector test snapshots. ([417e802](https://github.com/lowdefy/lowdefy/commit/417e802a89a9311578dad467c4580c502ec2c7c4))
- **docs:** Comment fixes on \_change_case operator ([b2a30e7](https://github.com/lowdefy/lowdefy/commit/b2a30e713661d687705bb5e02289e8b35402a0b9))
- **operators:** Fix regex in \_change_case operator. ([e4d577f](https://github.com/lowdefy/lowdefy/commit/e4d577f856e2bc96598ffc715170417855c8ad25))
- Increase bodyParserConfig limit to 5mb. ([fc688a2](https://github.com/lowdefy/lowdefy/commit/fc688a237f27eb52f94425bf59bce0be7af92be1))
- **graphql:** Throw correct request configuration error messge. ([5443154](https://github.com/lowdefy/lowdefy/commit/5443154e201b06e8034c374dfc58ea254f19c871))
- **operators:** \_request getter default value should be null. ([755527f](https://github.com/lowdefy/lowdefy/commit/755527fe88cf45a00ab8ade8353f507c8c7918d8))
- **operators:** Comments fixes and catch nested objects ([deb8fd5](https://github.com/lowdefy/lowdefy/commit/deb8fd51d6b69ab4f22999a8639c4c3c94620f93))
- **operators:** Update tests with comments fixes and catch nested objects ([b6d63bb](https://github.com/lowdefy/lowdefy/commit/b6d63bb80dca1c1c8eb516b809d573c713734835))

### Features

- Update Elasticsearch docs. ([7b883e1](https://github.com/lowdefy/lowdefy/commit/7b883e123e9f8ebc6423ceafe8e2ad03ee20a761))
- **blocks-antd:** Make Selector showSearch default true. ([6bf511a](https://github.com/lowdefy/lowdefy/commit/6bf511ab53ffc33676038a24f900aa0a5f30a0b6))
- **docs:** Add \_change_case operator docs. ([f57d7eb](https://github.com/lowdefy/lowdefy/commit/f57d7ebc8040ba42f4e85977e9a82ef50a28effb))
- **graphql:** Change ElasticsearchSearch request and response schema. ([efd70a3](https://github.com/lowdefy/lowdefy/commit/efd70a3804925ed024dea0ae3f33625fef37309e))
- **operators:** Add \_change_case operator ([e617c31](https://github.com/lowdefy/lowdefy/commit/e617c31228f9538b0c5df8e0fd9f1fbc09c4697f))
- **operators:** Add \_change_case tests ([87bf687](https://github.com/lowdefy/lowdefy/commit/87bf68757285d87c4d57a42e25929bfbb206134f))

# [3.18.1](https://github.com/lowdefy/lowdefy/compare/v3.18.0...v3.18.1) (2021-06-30)

## Changes

### Fixes

- Fix S3UploadButton block.
- Evaluate actions with error messages #663.
- Replace 'Action unsuccessful' error message with message provided by Error.
- Serializer to maintain Errors #664.
- Fix \_location.

## Commits

### Bug Fixes

- **blocksAntd:** Fix S3UploadButton block to new responses schema. ([37a15bf](https://github.com/lowdefy/lowdefy/commit/37a15bf6c56519565ef1b62e38dc021eeea71262))
- **blocksAntd:** Update snapshots. ([43b23f4](https://github.com/lowdefy/lowdefy/commit/43b23f484fd6a00a3029fa9fe6389f6a7f796097))
- **docs:** Fix typo in mql example. ([22ca375](https://github.com/lowdefy/lowdefy/commit/22ca375a8eaa54f193f06614ddbdc049989a1d2c))
- **engine:** Evaluate action error messages after error. closes [#663](https://github.com/lowdefy/lowdefy/issues/663) ([514fd14](https://github.com/lowdefy/lowdefy/commit/514fd14ce234d19bf2661a55be328e992102b546))
- **engine:** Remove error.lowdefyMessage. ([9f8590f](https://github.com/lowdefy/lowdefy/commit/9f8590f0d7a18a77a49235c0bc24798120062c66))
- **engine:** Responses for actions and tests using \_actions in messages. ([38cf7ef](https://github.com/lowdefy/lowdefy/commit/38cf7ef35843ad8494fa2a9829b9ddbed33f0ca6))
- **engine:** Up test covarage in Wait. ([a40ad4f](https://github.com/lowdefy/lowdefy/commit/a40ad4f7246c7ed0584fd3747f7a21e31832af96))
- **helpers:** Serializer to maintain error. closes [#664](https://github.com/lowdefy/lowdefy/issues/664) ([bfbdf58](https://github.com/lowdefy/lowdefy/commit/bfbdf585ab65ec108fa90750242a39eaf0c4be63))
- **operators:** Do not copy window.location in \_location. ([61f6215](https://github.com/lowdefy/lowdefy/commit/61f6215ee31a99ac5bbaf81c4ff7120ba5f51eda))
- **shell:** Add dev build option to serve renderer from localhost. ([3f3840d](https://github.com/lowdefy/lowdefy/commit/3f3840d70a1d8276a4b31f99d79f7502429b9be7))

# [3.18.0](https://github.com/lowdefy/lowdefy/compare/v3.17.2...v3.18.0) (2021-06-17)

## Changes

### Feature

- Add a new `Wait` action, #625.
- Add supported for dot notation in the \_request operator, #646

### Fixes

- Fix 404 page build issue, closes #647.
- Improve build error messages for missing ids.
- Throw an error if request id contains a period.
- Fix Dockerfiles in docs.
- Reconnect docsearch after page change.

## Commits

### Bug Fixes

- **build:** default 404 page should be copied in build. ([8e0d8ca](https://github.com/lowdefy/lowdefy/commit/8e0d8ca160193728bc14f5dbc43d411a77835ed4)), closes [#647](https://github.com/lowdefy/lowdefy/issues/647)
- **build:** Improve build error messages for missing ids. ([ecd2488](https://github.com/lowdefy/lowdefy/commit/ecd2488ff4a71eee4732cc213eee2308b682410a))
- **build:** Improve error message. ([258d4ad](https://github.com/lowdefy/lowdefy/commit/258d4adc299922b16058c8ba82e937944154d089))
- **build:** Throw an error if request id contains a period. ([933e4fa](https://github.com/lowdefy/lowdefy/commit/933e4fa35a0f5f481c1d426682eca560c51210e6))
- **docs:** Fix Dockerfiles in docs ([4f53889](https://github.com/lowdefy/lowdefy/commit/4f538899fa977f7f6ff9012f0ef8b889f3c5b661))
- **docs:** Reconnect docsearch after page change. ([48c26e8](https://github.com/lowdefy/lowdefy/commit/48c26e8236569eb28816a230d2984570698f7615))

### Features

- **docs:** Add algolia docsearch. ([e3c6de7](https://github.com/lowdefy/lowdefy/commit/e3c6de76e22c0e42b6ccb98a58f8efe472e4fc4d))
- **engine:** Add wait operator. ([40ead25](https://github.com/lowdefy/lowdefy/commit/40ead255054a731cc70e7bee31c61d2d20ef0caf)), closes [#625](https://github.com/lowdefy/lowdefy/issues/625)
- **operators:** Add support for dot notation in \_request operator. ([6ffaf46](https://github.com/lowdefy/lowdefy/commit/6ffaf4690227b5a9be47b4815c78d7dd15420238))

## [3.17.2](https://github.com/lowdefy/lowdefy/compare/v3.17.1...v3.17.2) (2021-06-11)

## Changes

### Fixes

- Fix Netlify deploys.

## Commits

### Bug Fixes

- **server-netlify:** Fix Netlify build configuration path. ([e2ddc11](https://github.com/lowdefy/lowdefy/commit/e2ddc11ad5c692ca1069915a53b61b50244ce28c))

## [3.17.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0...v3.17.1) (2021-06-11)

## Changes

### Fixes

- Fix Netlify deploys.

## Commits

### Bug Fixes

- **server-netlify:** Fix Netlify server express GraphQL path. ([f3959ad](https://github.com/lowdefy/lowdefy/commit/f3959adfe191198fbe958ecb2a14da61a8c26764))

# [3.17.0](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.3...v3.17.0) (2021-06-11)

## Changes

### Breaking

- Remove support for depreciate `_js.function` and `_js.evaluate` operators.

### Features

- Add support for deploying with Docker. See more at [https://docs.lowdefy.com/docker](https://docs.lowdefy.com/docker).
- Add support for deploying with AWS Lambda. See more at [https://docs.lowdefy.com/aws-lambda](https://docs.lowdefy.com/aws-lambda).
- Add try-catch error handling to events, closes [#608].
- Add forceSubMenuRender property to menus in `Menu`, `PageHeaderMenu`, and `PageSiderMenu` blocks.
- Add `_location` window location operator.
- Add links to previous Lowdefy versions in docs.
- Add a default 404 page if no 404 page is defined, closes [#280].

### Fixes

- The CLI init starter app docs button now opens in a new tab.
- Fix AxiosHttp baseUrl typo in docs, closes [#607]

## Commits

### Bug Fixes

- **docs:** Add lowdefy version in dockerfile warnings ([1672f24](https://github.com/lowdefy/lowdefy/commit/1672f241c67f64129c3e6138efa1830716b445e3))
- **docs:** Fix aws lambda docs. ([7136663](https://github.com/lowdefy/lowdefy/commit/7136663ae482e3f5a3b9bd775118264f707b1fd5))
- **docs:** Fix type in MongoDB docs. ([07de3e9](https://github.com/lowdefy/lowdefy/commit/07de3e94a5f54095c8a0c08d919a5ee39655d188))
- **shell:** Fix gqlUri in shell app. ([3da4851](https://github.com/lowdefy/lowdefy/commit/3da4851718134a080e1d8daf245bd7d3e26069ec))

### Features

- **docs:** Add docs for Docker and AWS Lambda deployment ([e57fa03](https://github.com/lowdefy/lowdefy/commit/e57fa0309eeddaa815b1a96f9f5c0cc6381b4323))

# [3.17.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.2...v3.17.0-alpha.3) (2021-06-09)

### Bug Fixes

- **cli:** Open docs link in new tab. ([2da64c2](https://github.com/lowdefy/lowdefy/commit/2da64c2d8d0c9d58456c5c8df4a82836e7a623bf))
- **servers:** .babelrc file should not be in .dockerignore ([994c13f](https://github.com/lowdefy/lowdefy/commit/994c13f97459c8d9986213b1a73dca6068d5cb48))

# [3.17.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.1...v3.17.0-alpha.2) (2021-06-09)

### Bug Fixes

- Do not tag prereleases with latest tag on npm ([106aef7](https://github.com/lowdefy/lowdefy/commit/106aef7a9eab9c53af8a77ac5f2f3523eba679cb))
- **docs:** Restore docs to previous stable version ([ce1aac0](https://github.com/lowdefy/lowdefy/commit/ce1aac0ff428db74b1d00499100acfbfa47f9e52))
- Fix lerna npm publish on release action. ([9469148](https://github.com/lowdefy/lowdefy/commit/9469148d094470d0f9d62d16ec2fc36075d83020))
- Test npm lerna publish ([92f4b88](https://github.com/lowdefy/lowdefy/commit/92f4b88e2f860e3d500367c825bfe22f689f1f60))

# [3.17.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.0...v3.17.0-alpha.1) (2021-06-09)

### Bug Fixes

- Fix npm publish comand in publish action. ([24cc119](https://github.com/lowdefy/lowdefy/commit/24cc1196c704e2f408bdbe2c8d7e37ce7ff5b87f))

# [3.17.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.16.5...v3.17.0-alpha.0) (2021-06-09)

### Bug Fixes

- Add publish environment to publish workflow ([b65211a](https://github.com/lowdefy/lowdefy/commit/b65211a3755b1a7a5ced5b0d3ea437a0c5aa7efd))
- Fix release workflow file. ([028ecf0](https://github.com/lowdefy/lowdefy/commit/028ecf0868461fc1c63f7de22c387a3260ae9579))
- remove linux/arm/v7 docker platform. ([c78d72e](https://github.com/lowdefy/lowdefy/commit/c78d72ed0be76e3c7c63a411b87cf43a87332dda))
- Remove yarn cache clean from docker builds. ([e5d8d9d](https://github.com/lowdefy/lowdefy/commit/e5d8d9da4d7d5f4979d036c2207741da4e0f034b))
- **blocksAntd:** Add forceSubMenuRender property to menu. ([3f85e6e](https://github.com/lowdefy/lowdefy/commit/3f85e6e6de12e6c7210c8e8daf5a22d022bb69c7))
- **blocksAntd:** Include menu tests for working renders. ([b8fa4d0](https://github.com/lowdefy/lowdefy/commit/b8fa4d090c3ae25502e48a965a4538ebe84a4173))
- **blocksAntd:** Skip menu render test. ([5a321ec](https://github.com/lowdefy/lowdefy/commit/5a321ec7d3bf2a3b4580abbce94601c389e9d32b))
- **build:** Handle try catch options in actions schema. ([7e05b0e](https://github.com/lowdefy/lowdefy/commit/7e05b0eb75a92613507731e1cbceb71433d86e71))
- **docs:** Add \_location operator. ([038977a](https://github.com/lowdefy/lowdefy/commit/038977aac5dcc18fb1a9f18266ee80be6bb1970e))
- **docs:** Add forceSubMenuRender to menu. ([a4b7abc](https://github.com/lowdefy/lowdefy/commit/a4b7abc76bcd9a92f509ff02bd86ed90234af423))
- **docs:** Add lowdefy versions to docs. ([5ff0e16](https://github.com/lowdefy/lowdefy/commit/5ff0e16d0d987f819f9e1eb9820fd756634e4a2f))
- **docs:** Fix baseUrl typo, closes [#607](https://github.com/lowdefy/lowdefy/issues/607) ([4b1e6ce](https://github.com/lowdefy/lowdefy/commit/4b1e6ceb9a80db324a56692072315baeaf4053d2))
- **docs:** Remove deprecated \_js wasm. ([8b00683](https://github.com/lowdefy/lowdefy/commit/8b00683c4f96bcbe9944a990f6c8b5ec3c2d9bb1))
- **docs:** Update docs for try catch actions. ([3d7969d](https://github.com/lowdefy/lowdefy/commit/3d7969d9f6b483211820598b2deb69701ad2ed08))
- **operators:** Remove deprecated \_js wasm. ([20d2d0f](https://github.com/lowdefy/lowdefy/commit/20d2d0f0d98073399019e6c2daee4d1f2d0af474))
- **server-docker:** Use port 3000 as default port. ([53bbc5f](https://github.com/lowdefy/lowdefy/commit/53bbc5fc1343832a26e60d189e080e0f13b1ede5))
- **servers:** Use a empty app config instead of starter config for lowdefy default. ([db4b7f9](https://github.com/lowdefy/lowdefy/commit/db4b7f902835dcfe49d0f4cf0402b5b8435528c5))

### Features

- Add configurable public directory to servers. ([7c2beeb](https://github.com/lowdefy/lowdefy/commit/7c2beeb049d647452d4b6838427ae609e6d91b46))
- Add docker ignore files ([441b150](https://github.com/lowdefy/lowdefy/commit/441b150e7528a5b4efae3b73d129091e690116de))
- Github actions to deploy docker images ([de49159](https://github.com/lowdefy/lowdefy/commit/de49159af23871fac829d6268facd46e1e3069c8))
- Update release action to publish to npm and docker. ([acd2c5d](https://github.com/lowdefy/lowdefy/commit/acd2c5d07811e54f2006c5ca8a820705fbaeded2))
- **build:** Add a default 404 page if no page is defined. ([b0abb39](https://github.com/lowdefy/lowdefy/commit/b0abb39e108ab22421cb5bac9248dcef9e209367))
- **engine:** Add catchActions to events, closes [#608](https://github.com/lowdefy/lowdefy/issues/608) ([305b3aa](https://github.com/lowdefy/lowdefy/commit/305b3aa3f9ff51c605384e36902c15d3491a5736))
- **operators:** Add \_location operator. ([9175dbe](https://github.com/lowdefy/lowdefy/commit/9175dbe3b84a74169d5f72018388293790ad2f9d))
- Init @lowdefy/server package. ([f4699be](https://github.com/lowdefy/lowdefy/commit/f4699be366912f8730c74036bbfbd5b2bb915b4a))
- Init @lowdefy/shell package ([1c188a0](https://github.com/lowdefy/lowdefy/commit/1c188a052f203d89241ea23c90c5b74759849343))
- Init aws lambda server. ([f48021e](https://github.com/lowdefy/lowdefy/commit/f48021ea38184708ede63f306dad2684e948925e))
- Update docker server dockerfile. ([0f52b35](https://github.com/lowdefy/lowdefy/commit/0f52b350483f1e6157040eb6539266839bb563c4))
- Use @lowdefy/server package in dev server. ([dc4848a](https://github.com/lowdefy/lowdefy/commit/dc4848a28f70b969865e7a207d0ccfd01c9f69d4))
- use lowdefy server in docker and lambda servers ([4854f74](https://github.com/lowdefy/lowdefy/commit/4854f74733d3d3d5de0426b17669760e41785508))
- Use lowdefy server in netlify server. ([4a78a97](https://github.com/lowdefy/lowdefy/commit/4a78a9753c54ef217a14e99924a0f02b4bdddf9f))
- Use lowdefy shell in aws lambda server. ([933281f](https://github.com/lowdefy/lowdefy/commit/933281f82a2cd81329aa3ab3997ebd8d98a0900d))
- Use shell package in dev and docker servers ([d9abe05](https://github.com/lowdefy/lowdefy/commit/d9abe05ef7267527f4fb1140557905d243246a92))
- **server-docker:** Update lowdefy app directory in dockerfile ([cedea93](https://github.com/lowdefy/lowdefy/commit/cedea93f6b22dfb255e40aefc50172b01bafdfea))

### Reverts

- Revert "chore: Update yarn version." ([04fe765](https://github.com/lowdefy/lowdefy/commit/04fe765cafc72f5cd4ea836167c285082bc2ad12))
- Revert "chore: Yarn upgrade rename .pnp.js" ([59a0413](https://github.com/lowdefy/lowdefy/commit/59a041378ed4e6eb92f1afb6db19bf84760ebef9))

## [3.16.5](https://github.com/lowdefy/lowdefy/compare/v3.16.4...v3.16.5) (2021-05-31)

## Changes

This release only contains updates to dependencies.

## Commits

### Bug Fixes

- **deps:** update apollo server packages to v2.24.1. ([a538a22](https://github.com/lowdefy/lowdefy/commit/a538a22b6d5526678f3d8a1a7c86363a91b96992))
- **deps:** update apollo server packages to v2.25.0 ([bbe713d](https://github.com/lowdefy/lowdefy/commit/bbe713d1bb584e1dcba6db9b9bd46a8531d2e2e6))
- **deps:** update dependency @apollo/client to v3.3.19. ([ac1d1f9](https://github.com/lowdefy/lowdefy/commit/ac1d1f92a4bc4418c05b4d61123e0dd1f28dd1f1))
- **deps:** update dependency @sendgrid/mail to v7.4.4. ([75097df](https://github.com/lowdefy/lowdefy/commit/75097df501f6985b9ffd9ab7bb9e79fdf621ab15))
- **deps:** update dependency aws-sdk to v2.914.0 ([8259549](https://github.com/lowdefy/lowdefy/commit/82595494ab527238da27abe7102985b12dce8f77))
- **deps:** update dependency aws-sdk to v2.918.0 ([68eed24](https://github.com/lowdefy/lowdefy/commit/68eed24bd0c330aa53c78365beec63dbd1031249))
- **deps:** update dependency classnames to v2.3.1 ([d4c7249](https://github.com/lowdefy/lowdefy/commit/d4c7249814a3b6180a1cce63c0dbbd635df3db10))
- **deps:** update dependency dompurify to v2.2.8. ([1d9b4de](https://github.com/lowdefy/lowdefy/commit/1d9b4de393b043dd00004b6660153f5fb050a102))
- **deps:** update dependency dotenv to v10.0.0 ([19e6a71](https://github.com/lowdefy/lowdefy/commit/19e6a7186821a40b82a6c391646f64108a743b0a))
- **deps:** update dependency echarts to v5.1.1 ([6d3a824](https://github.com/lowdefy/lowdefy/commit/6d3a824d33e8374ffd5ed530408e34d52858e16e))
- **deps:** update dependency fs-extra to v10.0.0 ([d9ad1a5](https://github.com/lowdefy/lowdefy/commit/d9ad1a50b1184be4feb10dae90337a2d9e24d4e1))
- **deps:** update dependency graphql-tag to v2.12.4 ([daf81cf](https://github.com/lowdefy/lowdefy/commit/daf81cf76ddc3f91d37fed7634f5427309142156))
- **deps:** update dependency js-yaml to v4.1.0 ([d3954f3](https://github.com/lowdefy/lowdefy/commit/d3954f30dd719deca4bc1383ba23a351a1b3b60b))
- **deps:** update dependency knex to v0.95.6. ([c2b718e](https://github.com/lowdefy/lowdefy/commit/c2b718e7b59ceac273ed66ff3bbc12165eb8219b))
- **deps:** update dependency mongodb to v3.6.8 ([21cacae](https://github.com/lowdefy/lowdefy/commit/21cacae01063b20106c9ee72fb9267615339d1db))
- **deps:** update dependency mongodb to v3.6.9 ([310d474](https://github.com/lowdefy/lowdefy/commit/310d4746cb76fabd0fddccf2c824f2bd7c4ddc22))
- **deps:** update dependency mssql to v7.1.0. ([becfe14](https://github.com/lowdefy/lowdefy/commit/becfe14c5dbaaf9c1729d1fd7e7ad6fa7eb60221))
- **deps:** update dependency openid-client to v4.7.4 ([79d2ad2](https://github.com/lowdefy/lowdefy/commit/79d2ad21bbcf65ada29805600258632e31060445))
- **deps:** update dependency pg to v8.6.0 ([630b448](https://github.com/lowdefy/lowdefy/commit/630b4484c99212aca614205ec848501bd5328215))
- **deps:** update dependency query-string to v7.0.0. ([f96afb8](https://github.com/lowdefy/lowdefy/commit/f96afb81d9c7aeb8fd586e74b2dd4748982bfb3a))
- **deps:** update dependency tslib to v2.2.0 ([8873c41](https://github.com/lowdefy/lowdefy/commit/8873c417a24a70ebb048879d26f20f7846dee495))

## [3.16.4](https://github.com/lowdefy/lowdefy/compare/v3.16.3...v3.16.4) (2021-05-28)

## Changes

### Fixes

- CLI now works for previous Lowdefy versions, closes [#598](https://github.com/lowdefy/lowdefy/issues/598)
- Fix development server hot reload.
- The index.html file is no longer cached by the development server.
- Add separate file hosting section to the docs.
- Fix an issue on selector blocks where the correct value was not found in options if the value was a complex object.

## Commits

### Bug Fixes

- **blocks-antd:** Fix selector index comparison. ([3f06fcd](https://github.com/lowdefy/lowdefy/commit/3f06fcde4b3e01c35e942c4b0ec0a430c5039b96))
- **cli:** Fix CLI for previous lowdefy versions ([89b8533](https://github.com/lowdefy/lowdefy/commit/89b85332033c59b64904d693776d62fc82dd8817)), closes [#598](https://github.com/lowdefy/lowdefy/issues/598)
- **cli:** Fix dev server reload. ([af6e70d](https://github.com/lowdefy/lowdefy/commit/af6e70da762fe1212ea9a0ec6372f02d09c9a185))
- **docs:** Split file hosting to separate concepts section. ([f802a6c](https://github.com/lowdefy/lowdefy/commit/f802a6ce351e3e4d562e29d0d407d814cf49b38f))

## [3.16.3](https://github.com/lowdefy/lowdefy/compare/v3.16.2...v3.16.3) (2021-05-27)

## Changes

### Fixes

- Custom HTML was not appended when navigating to the home (`/`) route.

## Commits

### Bug Fixes

- **servers:** Append html when serving index from url root ([12cb782](https://github.com/lowdefy/lowdefy/commit/12cb7829460e05479fc7376f49b0defa0819afea))

## [3.16.2](https://github.com/lowdefy/lowdefy/compare/v3.16.1...v3.16.2) (2021-05-26)

## Changes

### Fixes

- Fix CLI development server.

## Commits

### Bug Fixes

- **blocks-antd:** Remove Descriptions example with failing schema ([7e45bb3](https://github.com/lowdefy/lowdefy/commit/7e45bb30bb5fa993e6a580eabf7e9ae049ffe18f))
- **cli:** Fix cli dev server missing import ([beff373](https://github.com/lowdefy/lowdefy/commit/beff37341b9d055028b44bfb662785ccfff100c4))
- Update yarn lock ([622ae88](https://github.com/lowdefy/lowdefy/commit/622ae8873646a79a00d6053234d76531606eebbd))

## [3.16.1](https://github.com/lowdefy/lowdefy/compare/v3.16.0...v3.16.1) (2021-05-26)

## Changes

### Fixes

- Add new block locations to build.
- Fix Descriptions schema for docs generator.

## Commits

### Bug Fixes

- **build:** Add default locations for new blocks. ([544d1e1](https://github.com/lowdefy/lowdefy/commit/544d1e1d8459fb03294eb692f12116fa9f3904a5))
- **docs:** Fix Descriptions schema for docs generator. ([dbe1efe](https://github.com/lowdefy/lowdefy/commit/dbe1efec53930f5507abcebb54bc4d21e56ddc94))

# [3.16.0](https://github.com/lowdefy/lowdefy/compare/v3.15.0...v3.16.0) (2021-05-26)

## Changes

### BREAKING

- Rename selectGMT to selectUTC for DateTimeSelector.

### Depreciated

- Depreciate \_js.evaluate and \_js.function operators. Replaced with the new \_js operator. See [https://docs.lowdefy.com/\_js](https://docs.lowdefy.com/_js)

### Features

- Add support for custom HTML before the closing head and body tags of the app.
- Add the JsAction action, that can run custom JavaScript.
- Javascript operators are now implemented differently. See [https://docs.lowdefy.com/custom-code](https://docs.lowdefy.com/custom-code)
- Add Tooltip and Img blocks.

### Fixes

- Fix docs sitemap.
- Add new-line support to Descriptions, closes [#581](https://github.com/lowdefy/lowdefy/issues/581)
- Fix DateTimeSelector to work for local or utc time, closes [#580](https://github.com/lowdefy/lowdefy/issues/580)
- Document client and server environment operators.
- Document context initialization events for context blocks.
- SendGridMailSend to handle arrays, closes [#582](https://github.com/lowdefy/lowdefy/issues/582)
- Document Tabs block events, closes [#576](https://github.com/lowdefy/lowdefy/issues/576).
- Wait for login action on expired token refresh.
- Fixed cached scripts on app update by including contenthash in webpack output, closes [#575](https://github.com/lowdefy/lowdefy/issues/575).

## Commits

### Bug Fixes

- **docs:** Sitemap must be https. ([290b271](https://github.com/lowdefy/lowdefy/commit/290b271ec6b1cff3e89c3381ab741d913eea5688))
- fix indentation level op events in schema ([4426888](https://github.com/lowdefy/lowdefy/commit/44268886182657a95b7b1f4c1f2e7aa0ec63bcd1))
- **blocksAntd:** Add new-line support to Descriptions, closes [#581](https://github.com/lowdefy/lowdefy/issues/581) ([41bb9ee](https://github.com/lowdefy/lowdefy/commit/41bb9eee438b60d75efe00a433beb99ad98e78b8))
- **blocksAntd:** Fix DateTimeSelector to work for local or utc time, closes [#580](https://github.com/lowdefy/lowdefy/issues/580) # ([30a4764](https://github.com/lowdefy/lowdefy/commit/30a476460859f8b72198bad17ef892ef634cb24d))
- **blocksAntd:** Fix srcSet and media change width. ([4fb991a](https://github.com/lowdefy/lowdefy/commit/4fb991af415ab66dcdee59d233bf43d4c271f99c))
- **blocksAntd:** Rename selectGMT to selectUTC for DateTimeSelector. ([e817fb1](https://github.com/lowdefy/lowdefy/commit/e817fb1900a66c38487632500302040acd206a46))
- **build:** Do not throw on validate app config. ([96904a7](https://github.com/lowdefy/lowdefy/commit/96904a7783695f2b60b20be9488ffcb8dde79930))
- **docs:** Add alerts for client or server operators. ([bf5c9be](https://github.com/lowdefy/lowdefy/commit/bf5c9be5e672703c7e31f7a5a7228e492dd73e9c))
- **docs:** Add custom code concept. ([b0e63e1](https://github.com/lowdefy/lowdefy/commit/b0e63e1e2e7bcbdcec3c96692f694a8cd33e3b1d))
- **docs:** Add discord link. ([0a24af7](https://github.com/lowdefy/lowdefy/commit/0a24af75ebb682abf51556cafcab1c584e01053e))
- **docs:** Document context initialization events for context blocks. ([a59bff5](https://github.com/lowdefy/lowdefy/commit/a59bff50f25b79d0468a4a6afc836f264c3263b2)), closes [#576](https://github.com/lowdefy/lowdefy/issues/576)
- **engine:** Add tests for JsAction. ([2113ae5](https://github.com/lowdefy/lowdefy/commit/2113ae5c74d1143e1305b858b555cd5ff35faa59))
- **engine:** Update tests for new action responses structure. ([73c84e6](https://github.com/lowdefy/lowdefy/commit/73c84e6fdc75f4aca072f6843fea17eee87b02eb))
- **graphql:** SendGridMailSend to handle arrays, closes [#582](https://github.com/lowdefy/lowdefy/issues/582) ([dc0ef6c](https://github.com/lowdefy/lowdefy/commit/dc0ef6c521d1b4e5b2c498e2932cc2c2d83f5eb1))
- Fix Tabs blocks events in schema. ([70a13af](https://github.com/lowdefy/lowdefy/commit/70a13af94d90c6c40276f77fefea8708e7040451)), closes [#576](https://github.com/lowdefy/lowdefy/issues/576)
- webpack config so that index.html is not minified. ([d9cbf8d](https://github.com/lowdefy/lowdefy/commit/d9cbf8df56f97116832a7038f026058f1d528dc6))
- **docs:** Change to head.html. ([a7f20c4](https://github.com/lowdefy/lowdefy/commit/a7f20c4d238b520cf172934fd9df0c4f83d9157d))
- **docs:** Create modules/index and load filterDefaultValue. ([e45e5f1](https://github.com/lowdefy/lowdefy/commit/e45e5f1f80ccc256d668e92813b9e5415eccf6b7))
- **docs:** Fix custom block event actions history description. ([eb49803](https://github.com/lowdefy/lowdefy/commit/eb49803a48719c38a7d4cb0ff7d0540c0da25d75))
- **docs:** Import \_js.filterDefaultValue as operator. ([a6e2fe0](https://github.com/lowdefy/lowdefy/commit/a6e2fe036160d49b6c1994aee68326f88fc7c564))
- **docs:** Updates to custom code docs. ([a4be530](https://github.com/lowdefy/lowdefy/commit/a4be53077afd6dbcf42f41473695f77d00ccd1a5))
- **engine:** Modify action response object. ([94db71d](https://github.com/lowdefy/lowdefy/commit/94db71d2ace301c930f775de44d9908eb9c63576))
- **operators:** Update tests for \_js and \_actions. ([022893b](https://github.com/lowdefy/lowdefy/commit/022893bbca2dbfdbd8542dc3436cf5d960522f3c))
- **renderer:** Fix deprication build warning. ([18baf4a](https://github.com/lowdefy/lowdefy/commit/18baf4a421741c4c8f3034eea4fcf697a9c15023))
- **renderer:** Load and remove lowdefy.imports. ([e6fccbc](https://github.com/lowdefy/lowdefy/commit/e6fccbc4f9d7a9ec19e746b33698d86d0a2cab58))
- **renderer:** Wait for login action on expired token refresh. ([7219cdd](https://github.com/lowdefy/lowdefy/commit/7219cddb40f047e539c723aa2a19ea3c2a2bebe3))
- Rename appendHeader to appendHead. ([4e79736](https://github.com/lowdefy/lowdefy/commit/4e797363540bd0f5cfbe65928585012316b05a58))
- **servers:** Express function changed to async. ([6df571b](https://github.com/lowdefy/lowdefy/commit/6df571b0475d946e6864c2824af36450b70a7fa0))

### Features

- add Tooltip to docs ([e79a876](https://github.com/lowdefy/lowdefy/commit/e79a876a30585d90532680d7229ee921b18a4ac1))
- new Tooltip block and tests ([8717767](https://github.com/lowdefy/lowdefy/commit/871776745a3a4beb60622bb5b3e5aca0a1454a94))
- **blockBasic:** Add Img block. ([c850cb3](https://github.com/lowdefy/lowdefy/commit/c850cb32061cf2a4c361aecc024fe699cc06c7e0))
- Include contenthash in webpack output. ([dd2adbb](https://github.com/lowdefy/lowdefy/commit/dd2adbbaa195899c6986ca99934e19c4f6aeca21)), closes [#575](https://github.com/lowdefy/lowdefy/issues/575)
- **build:** Build app config. ([6575bc7](https://github.com/lowdefy/lowdefy/commit/6575bc78bc37a1b33f301364a5daee4bab324884))
- **cli:** Add appendHead, appendBody and custom js scripts. ([0f74833](https://github.com/lowdefy/lowdefy/commit/0f74833914917e7fb5d2d51177e2010b698d1019))
- **docs:** Add \_actions operator. ([d5583d2](https://github.com/lowdefy/lowdefy/commit/d5583d200a809cc451d051a7ee16455f018beff9))
- **docs:** Add JsAction. ([19fd956](https://github.com/lowdefy/lowdefy/commit/19fd9563c038a16aabebbf5c0e9b3324efa5b9d4))
- **engine:** Add JsAction. ([005155a](https://github.com/lowdefy/lowdefy/commit/005155aecf97774b37611eaa18c6aa854d6a92d3))
- **operators:** Custom \_js and \_actions operators. ([815f6a4](https://github.com/lowdefy/lowdefy/commit/815f6a452fcbe38ce21361393d2a0c9a74ff7058))
- **renderer:** Add customActions, jsOperators, registerCustomAction and registerJsOperator to lowdefy object. ([95f853d](https://github.com/lowdefy/lowdefy/commit/95f853da4b8f4308a9751a191b9519e8d69e8ace))
- **server:** Add head and body load scripts. ([ad195b4](https://github.com/lowdefy/lowdefy/commit/ad195b409b1780ac1bb3e194de5c106dbdb0b2b3))
- **servers:** Load header and body html on server. ([a5b070f](https://github.com/lowdefy/lowdefy/commit/a5b070f03b1d69991e9bfa7a4ccd571972d344df))

# [3.15.0](https://github.com/lowdefy/lowdefy/compare/v3.14.1...v3.15.0) (2021-05-11)

## Changes

### BREAKING

- Remove `logoutFromProvider` option in `config.auth.openId`.
- Remove OracleDB support.

### Features

- Allow custom OpenID Connect authorization url parameters.
- Add nunjucks template logout url.
- Use square logo for `PageHeaderMenu` and `PageSiderMenu` on mobile media sizes.
- Docs for user authentication and authorization.

### Fixes

- Show warning message before validation error message.
- Replace nunjucks-date-filter dependency with dateFilter function that does not default to utc time.
- Do not filter OPENID_CLIENT_ID and OPENID_DOMAIN from secrets.
- Id token was not sent with openIdLogoutUrlInput request.

## Commits

### Bug Fixes

- **blocksAntd:** Add square logo for mobile menu. Closes [#545](https://github.com/lowdefy/lowdefy/issues/545) ([296c7ec](https://github.com/lowdefy/lowdefy/commit/296c7ecb1ba4ad92684e64816d55cc2863014152))
- **blocksAntd:** Show warning before validation. Closes [#562](https://github.com/lowdefy/lowdefy/issues/562) ([7b4909b](https://github.com/lowdefy/lowdefy/commit/7b4909b07dd4560329aff6515d53c1f283fc9116))
- **docs:** Add users object, general fixes. ([72c0e25](https://github.com/lowdefy/lowdefy/commit/72c0e25632061f90176e2e235ac06cc6a24b3f38))
- **docs:** Add user authorization docs. ([9f259fd](https://github.com/lowdefy/lowdefy/commit/9f259fdb90bf5e6160c86343ae3ad64ce58b959a))
- **docs:** Add user object and roles docs. ([ccc8138](https://github.com/lowdefy/lowdefy/commit/ccc8138d402e485fd05944436d9c52f661c9cae2))
- **docs:** Document protected pages. ([7a338b9](https://github.com/lowdefy/lowdefy/commit/7a338b9e96e331bf5aa3cb81977d264fc45eaf84))
- **docs:** Generate sitemap for docs. ([5a2e0cd](https://github.com/lowdefy/lowdefy/commit/5a2e0cdffbf9f03769dc32674a5b4e957c524428))
- **docs:** Remove OracleDB. ([0672aa8](https://github.com/lowdefy/lowdefy/commit/0672aa8486daf7a43a7cb004606e682ecc52339c))
- **nunjucks:** Fix tests. ([f60f00e](https://github.com/lowdefy/lowdefy/commit/f60f00ea131b26dc6aa70ad1d927c38dd71308be))
- **nunjucks:** Replace nunjucks-date-filter dependancy with dateFilter function. ([f876c5b](https://github.com/lowdefy/lowdefy/commit/f876c5bc1fef68c8b7459678f1e4f5ce50cf9b73))
- **operators:** Do not filter OPENID_CLIENT_ID and OPENID_DOMAIN from secrets. ([3c56737](https://github.com/lowdefy/lowdefy/commit/3c56737cc2b654382e6635b472ae371a2a46cdc8))
- Remove support for oracle db due to lack of apple silicon support. ([0a1ca68](https://github.com/lowdefy/lowdefy/commit/0a1ca687607e4d49bc6a0a46e6784eb9a957cd09))
- **renderer:** Id token was not sent with openIdLogoutUrlInput request. ([e636c79](https://github.com/lowdefy/lowdefy/commit/e636c7976724fc8e767e6fac3e1c22c617952ae2))

### Features

- Allow custom openid authorization url parameters. ([427b3a1](https://github.com/lowdefy/lowdefy/commit/427b3a10036ea77cef0a04335b3dc3bbf9b6e286)), closes [#546](https://github.com/lowdefy/lowdefy/issues/546)
- Remove logoutFromProvider config, and nunjucks template logout url ([111d3da](https://github.com/lowdefy/lowdefy/commit/111d3da83f4d132e4243583dabbdd7cdaae69fe7)), closes [#563](https://github.com/lowdefy/lowdefy/issues/563)

## [3.14.1](https://github.com/lowdefy/lowdefy/compare/v3.14.0...v3.14.1) (2021-04-28)

## Changes

### Fixes

- Fix required validation broken by dynamic operators, closes #554.

## Commits

### Bug Fixes

- **engine:** Fix required validation broken by dynamic operators. ([6d38dbb](https://github.com/lowdefy/lowdefy/commit/6d38dbbe577a833368b7f4bccfcdadec7e103dc8))

# [3.14.0](https://github.com/lowdefy/lowdefy/compare/v3.13.0...v3.14.0) (2021-04-26)

## Changes

### Features

- Role based authorization for pages.
- Handle dates in `_js` operator.
- Enable console.log in `_js` operator.

### Fixes

- The `_array`, `_object`, and `_string` operators no longer throw errors on null values.
- Operators in page title are now evaluated correctly.
- Improved error pages.
- Fix an error when serializing data for `_js` operator.

## Commits

### Bug Fixes

- **blocksAntd:** Update snapshots. ([ed6b6e7](https://github.com/lowdefy/lowdefy/commit/ed6b6e76a7d8a2c3c81dc86c7ede82b2908e0fed))
- **blocksColorSelector:** Fix tests for Label. ([f2e6bc1](https://github.com/lowdefy/lowdefy/commit/f2e6bc193a50a6229b1ab2dbefbb3e46e2ab3130))
- **blockTools:** Add full error page. ([9baf5ad](https://github.com/lowdefy/lowdefy/commit/9baf5adba218f93fa257d46cf0e3bbfa0ed6b85b))
- **blockTools:** Update error defaults. ([cc02a89](https://github.com/lowdefy/lowdefy/commit/cc02a89571d260dd08b0cfdbd486f1f4c0c9841c))
- **build:** Fix build import. ([307d0ce](https://github.com/lowdefy/lowdefy/commit/307d0ce152bae7a5327f0488e8ac23f0b592cc8b))
- **cli:** Fix webpack config mode, should be production. ([86d7f38](https://github.com/lowdefy/lowdefy/commit/86d7f38129e4f400299a5999e9f7fad0cb30451a))
- **docs:** Fix typo in docs. ([343553a](https://github.com/lowdefy/lowdefy/commit/343553ac4a94fd5fb867346628c8f3ea10341f06))
- **graphql:** Simplify auth check ([cfb4d7f](https://github.com/lowdefy/lowdefy/commit/cfb4d7f4d0240526afef1afa6dc05e59d2d91eeb))
- **operators:** Add prep to object. ([24f6188](https://github.com/lowdefy/lowdefy/commit/24f6188e555ef7ac4284b5a0693aaba80bfa065f))
- **renderer:** Catch render error with full page. ([9775e24](https://github.com/lowdefy/lowdefy/commit/9775e242735a2c19eb8595131596a0961e7545eb))
- Add lgtm badges. ([62af825](https://github.com/lowdefy/lowdefy/commit/62af825d11b5eeb62636ed2f4c8a898ea9b0e432))
- Fix yarn lock ([b161786](https://github.com/lowdefy/lowdefy/commit/b161786d10cf3817fc93c26150524c0e5642223f))
- Make lgtm corrections. ([ef20857](https://github.com/lowdefy/lowdefy/commit/ef2085781aa245bf0d027ddec3511d949403bed9))
- **operators:** Fix stringify bug and allow for dates and console.log in \_js. ([0e7fe34](https://github.com/lowdefy/lowdefy/commit/0e7fe340cb1eee2eb982914b2f0d65ca3638ecb4))
- **operators:** Prep operator args to handle void instance. Closes [#519](https://github.com/lowdefy/lowdefy/issues/519) , Closes [#511](https://github.com/lowdefy/lowdefy/issues/511) ([5980f87](https://github.com/lowdefy/lowdefy/commit/5980f8799f8b0ddb3f6f412d801410c6aebc351f))
- **renderer:** Remove extra root context and pass page properties to Helmet. ([f17b412](https://github.com/lowdefy/lowdefy/commit/f17b41238d97f1b6d6bd4eb8996a5ea8e3d790c4))

### Features

- **build:** Build auth objects for role bases authorization. ([5fa6436](https://github.com/lowdefy/lowdefy/commit/5fa643643dc4ef5a04737228c87acf76c23e3135))
- **build:** Build correct auth object for menus ([2145033](https://github.com/lowdefy/lowdefy/commit/21450334159b216b833bc8e8cd6656269b380746))
- **build:** Update lowdefy app schema to include rolesField. ([3f1e06b](https://github.com/lowdefy/lowdefy/commit/3f1e06b38d9f1590a1ed275b138c358d5e252283))
- **graphql:** Add role based authorization. ([4e15ed3](https://github.com/lowdefy/lowdefy/commit/4e15ed3a08544bafd7cbb34e74ce89ffb08b527d))

# [3.13.0](https://github.com/lowdefy/lowdefy/compare/v3.12.6...v3.13.0) (2021-04-16)

## Changes

### Features

- Add Knex SQL support. This adds support forthe following databases:
  - Amazon Redshift
  - MariaDB
  - Microsoft SQL Server
  - MySQL
  - Oracle Database
  - PostgreSQL
  - SQLite
- Add \_js operator that evaluates JavaScript functions. This replaces the \_experimental_unsafe_js operator.
- Add eval option to \_ref operator during build, to evaluate js files and reference JavaScript function definitions.
- Operators on the client are now imported lazily.

### Fixes

- Getter operators now return the specified default value if the key or from arguments are null.
- OpenID Connect fields were present on the user object if a page was reloaded.

## Commits

### Bug Fixes

- **build:** Add configDirectory to context for full local builds. ([5a6a36d](https://github.com/lowdefy/lowdefy/commit/5a6a36dc3373b9864896171b2f5d3185d72d6c3b))
- **build:** Add eval option to \_ref operator during build. ([eb62e8a](https://github.com/lowdefy/lowdefy/commit/eb62e8a22b326c16148ae8324d64d89022cf16c6))
- **build:** Add list of operators in context to build. ([88a6f24](https://github.com/lowdefy/lowdefy/commit/88a6f24c8f486ee5370e78c8829cad0fb2d18492))
- **docs:** Add \_js operator to docs. ([b7b2135](https://github.com/lowdefy/lowdefy/commit/b7b21354fb9822914357f5924349640a7e712578))
- **docs:** Add \_ref.eval to docs. ([d90e02f](https://github.com/lowdefy/lowdefy/commit/d90e02f719f506cd03a99a099524b0f98df10345))
- **docs:** Make connection examples and secrets more consistant ([4c473a3](https://github.com/lowdefy/lowdefy/commit/4c473a3e6308d768cf7658758aa696fa2141aeb8))
- **docs:** Update \_js operator docs. ([1c00b36](https://github.com/lowdefy/lowdefy/commit/1c00b369e2cbf6c1c180159eabf979ade0b1f6d2))
- **docs:** Update docs to use \_js operator. ([91dda91](https://github.com/lowdefy/lowdefy/commit/91dda91eea03654c55c16c089c3583f62aea3c10))
- **engine:** Init async operators. ([63f8d14](https://github.com/lowdefy/lowdefy/commit/63f8d143796e928b5a87a8c6e4a90b4e975a83bc))
- **graphql:** Improve KnexBuilder errors, add KnexBuilder tests. ([daced49](https://github.com/lowdefy/lowdefy/commit/daced49ee28fa7c0863859875a3eb3fae4ef3b22))
- **graphql:** Init operators. ([951e3a7](https://github.com/lowdefy/lowdefy/commit/951e3a7a15f652941d548c784d7967a5c748edc4))
- **graphql:** Knex tests, add tablename prop to builder. ([ba696f8](https://github.com/lowdefy/lowdefy/commit/ba696f80dd45bc056d5b3205c00aaabc0ffa11db))
- **graphql:** Pin mongodb to v3.6.5 due to yarn pnp bug in v3.6.6 ([4b74cb6](https://github.com/lowdefy/lowdefy/commit/4b74cb697adad67030d2a4cd17388182d1c774e2))
- **operators:** Getters should return default if from or key are null. ([be8aae6](https://github.com/lowdefy/lowdefy/commit/be8aae62499065a66e8e1ed9e8ce4c481017203f))
- Fix graphql-federated build, move knex dependencies to cli. ([ff32126](https://github.com/lowdefy/lowdefy/commit/ff321269bf46dd5f334a1f4e2c91c52b59b9dc67))
- **operators:** \_js encode and decode into QuickJS to escape chars in json. ([45644db](https://github.com/lowdefy/lowdefy/commit/45644db11193c571cb886da50d74f397eb337104))
- **operators:** Add tests for json response for \_js. ([6cf5ac7](https://github.com/lowdefy/lowdefy/commit/6cf5ac78c140d627b3648d889eac263ace4d9be1))
- **operators:** Change nodeParser import to require. ([d044d13](https://github.com/lowdefy/lowdefy/commit/d044d1375d8f285ef7ef42185278b401ae2b4f0e))
- **operators:** Update \_js to take code with function as param. ([8fa7fa0](https://github.com/lowdefy/lowdefy/commit/8fa7fa056c4b786aa707d3275445dade1f8fcb26))
- **renderer:** Filter OpenId Connect fields from user object. ([8cdf96f](https://github.com/lowdefy/lowdefy/commit/8cdf96f5eef07358507bb52298679362b8ddba4d))
- Create \_js using quickjs-emscripten. ([4ec8a30](https://github.com/lowdefy/lowdefy/commit/4ec8a300d1f6ff05f87f2cb9a49a686d4c804099))
- Update babel setup for tests. ([1d89de9](https://github.com/lowdefy/lowdefy/commit/1d89de9edb3e64f005bc044ebdc80ef6a8a0eecd))
- Update react, react-dom and react-test-renderer to v17.0.2 ([78969ab](https://github.com/lowdefy/lowdefy/commit/78969abd39e8b04a7cddb39472985da6da50c7b9))
- **operators:** Update dynamic imports. ([5699118](https://github.com/lowdefy/lowdefy/commit/5699118eda068f0f729223eb9ee3cdf8ed4f9840))

### Features

- Update Knex docs for all suported databases. ([1b45b01](https://github.com/lowdefy/lowdefy/commit/1b45b01a647e8710bfa3a60e1a0142226a2f60e2))
- **docs:** Add Knex docs. ([7caefdc](https://github.com/lowdefy/lowdefy/commit/7caefdcd0240a71a884a9c006996b523d3ad589d))
- **graphql:** init Knex connection. ([dac5a4c](https://github.com/lowdefy/lowdefy/commit/dac5a4cb5c8d5fc3452473267547e607e634e7ac))
- **graphql:** Update Knex schemas. ([d2d8a73](https://github.com/lowdefy/lowdefy/commit/d2d8a732d8c129da02ba5b8ba1ffe5e9f7f3300b))
- **operators:** Add \_js operator and remove \_experimental_unsafe_js operator. ([2d1e2b3](https://github.com/lowdefy/lowdefy/commit/2d1e2b3b18f7f379bbe2821055122b0aee31ce62))

## [3.12.6](https://github.com/lowdefy/lowdefy/compare/v3.12.5...v3.12.6) (2021-04-06)

## Changes

### Fixes

- Fix bug where user object is still defined on the client after login has expired.
- Fix Pagination block. The `onSizeChange` event was triggered when the `onChange` event was supposed to be triggered.
- Fix S3UploadButton state value, add the missing `bucket` and `key` values.

## Commits

### Bug Fixes

- Fix bug where user object is still defined after login has expired. ([e3e8803](https://github.com/lowdefy/lowdefy/commit/e3e8803070c3fb59985eadb6c20674c820e3c56a))
- **blocks-antd:** Fix Pagination block onChange. ([5813ff1](https://github.com/lowdefy/lowdefy/commit/5813ff198ccd730efaefab9ea6a1f0b9865c5f12))
- **blocks-antd:** Fix S3UploadButton state value. ([c11184e](https://github.com/lowdefy/lowdefy/commit/c11184e27b1a31908fbe3aac0055cfc4f1cd07aa))
- **deps:** update dependency openid-client to v4.6.0 ([55be522](https://github.com/lowdefy/lowdefy/commit/55be5222670feab106945c05732982d9484a9816))

## [3.12.5](https://github.com/lowdefy/lowdefy/compare/v3.12.4...v3.12.5) (2021-03-31)

## Changes

### Fixes

- Fix S3UploadButton file uploads.

## Commits

### Bug Fixes

- **blocks-antd:** Fix S3UploadButton not uploading files. ([7005a8f](https://github.com/lowdefy/lowdefy/commit/7005a8f547f2d5390d7fe58e903c48d6704e7622))
- **engine:** Fix Request action response. ([45aaa18](https://github.com/lowdefy/lowdefy/commit/45aaa1854595da1eb5225198a101895dc959fe54))

## [3.12.4](https://github.com/lowdefy/lowdefy/compare/v3.12.3...v3.12.4) (2021-03-30)

## Changes

### Fixes

- Fix S3UploadButton file uploads.
- Fix AwsS3Bucket type name.

## Commits

### Bug Fixes

- **blocks-antd:** Fix S3UploadButton file uploads. ([2fa854b](https://github.com/lowdefy/lowdefy/commit/2fa854b1b0563f480dede2986e9f4b64868449e1))
- **deps:** update dependency openid-client to v4.5.2 ([0963d68](https://github.com/lowdefy/lowdefy/commit/0963d68f43928dd80504ad3c05363e7e678be55b))
- **graphql:** Fix AwsS3Bucket type name. ([7aa6581](https://github.com/lowdefy/lowdefy/commit/7aa658172e891d96369fab66119cb5183e0759a7))

## [3.12.3](https://github.com/lowdefy/lowdefy/compare/v3.12.2...v3.12.3) (2021-03-26)

## Changes

### Fixes

- Fix renderer list and request race condition.

### Features

- Add `_ne` operator.

## Commits

### Bug Fixes

- **renderer:** List render race condition, closes [#520](https://github.com/lowdefy/lowdefy/issues/520) ([07907df](https://github.com/lowdefy/lowdefy/commit/07907df30f3ad784709a500bf53c86dec739a0e1))
- Update \_ne tests. ([5611439](https://github.com/lowdefy/lowdefy/commit/5611439c4fa2eeae0968ed0f99be4e73465875a1))
- **operators:** Add \_ne operator. ([d7b62e0](https://github.com/lowdefy/lowdefy/commit/d7b62e0b898d8948ab77d9800ec0b8afdd2d8503))

## [3.12.2](https://github.com/lowdefy/lowdefy/compare/v3.12.1...v3.12.2) (2021-03-24)

## Changes

### Fixes

- Fix ECharts remoteEntry path for block meta data.

## Commits

### Bug Fixes

- **blocksECharts:** Correct the remoteEntry path for ECharts. ([f99cccc](https://github.com/lowdefy/lowdefy/commit/f99cccc28df53bc00bcced137820e6e89b206f3a))

## [3.12.1](https://github.com/lowdefy/lowdefy/compare/v3.12.0...v3.12.1) (2021-03-24)

## Changes

### Fixes

- Fix EChart schema definition for docs.
- Add @lowdefy/blocks-echarts to Lowdefy CDN.

## Commits

### Bug Fixes

- Fix docs issue and add echarts to github actions cdn. ([7509914](https://github.com/lowdefy/lowdefy/commit/7509914051cbad6f2f17b31542c9700ac65b6ef2))

# [3.12.0](https://github.com/lowdefy/lowdefy/compare/v3.11.4...v3.12.0) (2021-03-24)

## Changes

### Fixes

- Size loading block based on block layout and style settings.

### Features

- Add EChart block 🎁.

## Commits

### Bug Fixes

- **renderer:** Loading to size loading block based on block size. ([16e2930](https://github.com/lowdefy/lowdefy/commit/16e29308403484ca61217dedd4c7f3312aa7c933))

### Features

- **blockECharts:** Add EChart block 🎁. ([deff965](https://github.com/lowdefy/lowdefy/commit/deff96504ff1b24152a82458511b0426cec5d8ee))
- **docs:** Add docs for EChart block. ([9f7b31a](https://github.com/lowdefy/lowdefy/commit/9f7b31a809d8bcc04a67ada5ba941f1484a3c665))

## [3.11.4](https://github.com/lowdefy/lowdefy/compare/v3.11.3...v3.11.4) (2021-03-19)

### Features

- Add \_object.defineProperty operator.

### Fixes

- OpenID Connect for Netlify deployment fix.
- Block update on loading complete.

### Documentation

- Add \_object.defineProperty operator.

### Bug Fixes

- **deps:** update dependency openid-client to v4.5.1 ([b6a7cd8](https://github.com/lowdefy/lowdefy/commit/b6a7cd8cb7f0fbf05cf1ccdc91fea7fe7d808847))
- **docs:** typo \_object.defineProperty docs. ([c99ef38](https://github.com/lowdefy/lowdefy/commit/c99ef387a7d749874eb0df00b244b9766c587283))
- **operators:** Add \_object.defineProperty operator. ([52f598f](https://github.com/lowdefy/lowdefy/commit/52f598fe8c8f93ebe93f0e1293057af0efa31e70))
- **renderer:** Set updaters on every render, closes [#499](https://github.com/lowdefy/lowdefy/issues/499) ([b68e5bd](https://github.com/lowdefy/lowdefy/commit/b68e5bd29b9f1b3762d7dba9558df769f1ab22ad))
- **server-netlify:** Fix auth token cookie path. ([6784e27](https://github.com/lowdefy/lowdefy/commit/6784e2756a9fb0b0dff6f3df572d6916040b687a))

## [3.11.3](https://github.com/lowdefy/lowdefy/compare/v3.11.2...v3.11.3) (2021-03-12)

### Fixes

- Fix OpenID connect callback in CLI dev server.

### Bug Fixes

- **cli:** Fix dev server url paths for auth callback ([8cb2717](https://github.com/lowdefy/lowdefy/commit/8cb2717ea79e581e4f40e838b7798336caa210ee))
- **deps:** update dependency openid-client to v4.5.0 ([364d521](https://github.com/lowdefy/lowdefy/commit/364d521f9df09139cc1afa8b60c7827bd8f5e71c))

## [3.11.2](https://github.com/lowdefy/lowdefy/compare/v3.11.1...v3.11.2) (2021-03-11)

### Fixes

- Fix Netlify server deployments.

### Bug Fixes

- **server-netlify:** Fix netlify graphql server path ([07394ac](https://github.com/lowdefy/lowdefy/commit/07394ac7fccaef9b89914a7e72efae31cedf3b90))

## [3.11.1](https://github.com/lowdefy/lowdefy/compare/v3.11.0...v3.11.1) (2021-03-11)

### Bug Fixes

- **server-netlify:** Fix Netlify server graphql path ([0898642](https://github.com/lowdefy/lowdefy/commit/08986421a6f887bef3b306fea9db5a4eaac3664b))

# [3.11.0](https://github.com/lowdefy/lowdefy/compare/v3.10.2...v3.11.0) (2021-03-11)

### Features

This release includes initial support for OpenID Connect. There might be breaking changes to the configuration required as this is tested in the wild. Please see #483 for more information.

### Fixes

- Requests were added to the wrong context in build if more than one context was used on a page.
- The \_mql operator no longer throws error when the `on` argument is `null`.
- Fixed an issue where displayMessage was not initialized properly.

### Documentation

- Fix Descriptions bordered property default value.
- Add a section on using JSON instead of YAML.
- Added a diagram to the overview page.

### Bug Fixes

- **blocks-antd:** Fix Descriptions bordered property default value ([c2503e1](https://github.com/lowdefy/lowdefy/commit/c2503e167a4185cf23f38955f66e0664fc0c5b1a))
- **build:** Add auth config to all menu items. ([cea8982](https://github.com/lowdefy/lowdefy/commit/cea898252dd3f94b89107c15d7aeb889650a9e04))
- **build:** Nested context caused request to be created in wrong context. ([16e2b15](https://github.com/lowdefy/lowdefy/commit/16e2b154d44d3f532fe5be805dabcf0560129dd5))
- **build:** Page auth config fixes. ([601c942](https://github.com/lowdefy/lowdefy/commit/601c942e4fe5f7ed14fc209a5107dd25c65c1afa))
- **build:** Throw when poth protected and public pages are listed. ([5581ac4](https://github.com/lowdefy/lowdefy/commit/5581ac4bb003eb0e0d32320438388ad2af81f9a5))
- **docs:** Add a section on using JSON instead of YAML ([a709086](https://github.com/lowdefy/lowdefy/commit/a709086a8bd239f020cb9cf9228baeaf9d15fb93))
- **docs:** Add app schema image to docs public folder. ([df1c6c7](https://github.com/lowdefy/lowdefy/commit/df1c6c772e0465a20ab76f9494d45c29424e2b7b))
- **docs:** Add deployment tutorial video ([1e63ddd](https://github.com/lowdefy/lowdefy/commit/1e63ddd7d6e2307f53605e6ea7c4cd0a1844b232))
- **docs:** Typos. ([760abe6](https://github.com/lowdefy/lowdefy/commit/760abe6c0e1fa71c02ce1aa71dca7a97451294e9))
- **docs:** Update overview with diagram. ([e8087b7](https://github.com/lowdefy/lowdefy/commit/e8087b728a42444dcd491fd47a7abac82c405560))
- **engine:** Assign rootContext to context, instead of assigning individual fields. ([9461990](https://github.com/lowdefy/lowdefy/commit/9461990863b76d790a55d77fef5278adc4619858))
- **engine:** Rename more root to lowdefy. ([df858c1](https://github.com/lowdefy/lowdefy/commit/df858c16aaeaa6116fd3701cac1bcbdce77e526d))
- **engine:** Rename rootContext to lowdefy, and add pageId to root. ([3ee8807](https://github.com/lowdefy/lowdefy/commit/3ee880702f4edd060b011c1cf22a5015982965c9))
- **engine:** Use context specific pageId in engine. ([e80e461](https://github.com/lowdefy/lowdefy/commit/e80e461ebaa5a6453866f780b0ad4d3e9f2f2237))
- **graphql:** Improve logoutRedirectUri configuration. ([74e1183](https://github.com/lowdefy/lowdefy/commit/74e1183246361fe7d128e9c2ca8dff0a4fecd5c5))
- **operators:** \_mql on null should pass null and not throw. ([3378cb4](https://github.com/lowdefy/lowdefy/commit/3378cb4870db34c173e4c978c5ee5e00cd622889))
- **operators:** Rename input to inputs. ([1815daa](https://github.com/lowdefy/lowdefy/commit/1815daaa1cc73b22d384e40db759192515e2ce2e))
- **operators:** Rename more root to lowdefy. ([b2e40bb](https://github.com/lowdefy/lowdefy/commit/b2e40bbf1f22f9e61ef2350af3495d012eebbaf9))
- **renderer:** Fix login logout. ([2c51020](https://github.com/lowdefy/lowdefy/commit/2c5102059979a7bba9e696a51d23e7b8f240312a))
- **renderer:** Init displayMessage before it is loaded, closes [#470](https://github.com/lowdefy/lowdefy/issues/470). ([fac7e39](https://github.com/lowdefy/lowdefy/commit/fac7e39776b41cc5a175a957c52a135f5e8e73c9))
- **renderer:** Move pageId into lowdefy object. ([5a19389](https://github.com/lowdefy/lowdefy/commit/5a19389929465b64b65ebd4906c50bf66eeb76a4))
- **renderer:** Setup link function using setupLink. ([b078b22](https://github.com/lowdefy/lowdefy/commit/b078b22505e2a3978d791ce1da581869ad507f6b))
- **renderer:** Update blocks using use state. ([de4f899](https://github.com/lowdefy/lowdefy/commit/de4f8996a896c92a358b87cc3bf09d6334bfe978))
- \_mql empty input when data is null. ([a1c913a](https://github.com/lowdefy/lowdefy/commit/a1c913a080758fed82426d9295d53fde8ae3e813))
- Add twitter badges. ([432f4c4](https://github.com/lowdefy/lowdefy/commit/432f4c4dcc2551121a7a856e8690cff179223b52))
- Update telemetry data field names. ([085e5cc](https://github.com/lowdefy/lowdefy/commit/085e5cc635f3eab2433f376de96af67a762f828f))

### Features

- **build:** Add auth field and homePageId to config in app schema. ([a878a31](https://github.com/lowdefy/lowdefy/commit/a878a31160daa9e08b9ace838c3d5eb54b1d805e))
- **build:** Add auth to build arifacts. ([c6a2e53](https://github.com/lowdefy/lowdefy/commit/c6a2e53a2fa0611e2a0f0d4b79fba9f26da66d4e))
- **build:** Update app OpenID configuration schema ([a6df3c0](https://github.com/lowdefy/lowdefy/commit/a6df3c0f65dc5a048ca303a14743ff46f7b6b35a))
- **graphql:** Add OpenID Connect flow queries. ([1ac0b3d](https://github.com/lowdefy/lowdefy/commit/1ac0b3d3180bd3bb5e9d47084125efba1e862715))
- **graphql:** All user object to request operators parser. ([9e43b27](https://github.com/lowdefy/lowdefy/commit/9e43b27a477acfb0bdb944d610d386a0b8cd64e0))
- **graphql:** Allow specifed input, pageId, urlQuery in state token. ([353dfab](https://github.com/lowdefy/lowdefy/commit/353dfabb8db14b5368f339281896a8ee104e4d1b))
- **graphql:** Do authorization checks on pages and requests. ([00bf504](https://github.com/lowdefy/lowdefy/commit/00bf504d60a12a6990d1b6fb2e00390703faf9de))
- **graphql:** Filter menu items. ([cd14afd](https://github.com/lowdefy/lowdefy/commit/cd14afd3593d966a76ba96fbaee142ab4524eca2))
- **graphql:** Make JWT expiry time configurable. ([30bde0b](https://github.com/lowdefy/lowdefy/commit/30bde0be4eb68f59818fdb3738f82c9b0e2e86a2))
- **graphql:** Set and unset authorization cookie. ([8abe43c](https://github.com/lowdefy/lowdefy/commit/8abe43cf99f57d884d0e770ace0393faeebf9606))
- **graphql:** Update jwt tokens, add tests. ([f5ea705](https://github.com/lowdefy/lowdefy/commit/f5ea70507414ae2a64e19f3e59cefafe7395eefc))
- **renderer:** Improve OpenID Connect flows ([e7cca6f](https://github.com/lowdefy/lowdefy/commit/e7cca6f01fe5e08df8c9244144b4e1583fb753ce))
- **renderer:** Switch rootcontext to root lowdefy object ([30919a2](https://github.com/lowdefy/lowdefy/commit/30919a2dd2e2ee9adffbe35f382ba70e78fac25e))
- Move all servers to expressed based apps. ([ffc6043](https://github.com/lowdefy/lowdefy/commit/ffc6043e0faf2812c31d3e25d794a64a154849d2))
- **operators:** Configure operators to work aith root and add \_user. ([c9395b9](https://github.com/lowdefy/lowdefy/commit/c9395b98a9cfd1f1779c57720ee3316287e8592e))
- **renderer:** Handle expired tokens in GQL client and unset tokenId. ([2cc0492](https://github.com/lowdefy/lowdefy/commit/2cc049235e008c4887b5ed57ce92eff12d10ae60))
- Init OpenID Connect flow. ([e2e29d0](https://github.com/lowdefy/lowdefy/commit/e2e29d0f165c148bbc27b5073612a6b4d50e1b87))
- use setHeader plugin to set auth headers ([6238c6f](https://github.com/lowdefy/lowdefy/commit/6238c6f6ba6c1d24720f4867da7e5e577ff344d4))
- **operators:** Filter openid secrets and block get all in \_secret. ([bd7a772](https://github.com/lowdefy/lowdefy/commit/bd7a7720f565d77ed2e644ef6c2857084fdf0d5c))
- **renderer:** Finish OpenId callback. ([9997136](https://github.com/lowdefy/lowdefy/commit/9997136f395c1f7fb7d16ef8fdb6f0cd6043a951))

## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)

## Changes

### Fixes

- Validate action error messages were not showing correctly.
- Validation warnings were showing as errors.
- A Lowdefy object is now added to the browser window when running on localhost for debugging.
- The files that are created by the CLI init command are now logged.
- Fixes to Modal block schema.
- The Favicon PUBLIC_URL error in the browser has been resolved.

### Documentation

- This version includes a large number of updates to the documentation and tutorial.

## Commits

### Bug Fixes

- **blocksAntd:** Update modal schema. ([f2c6739](https://github.com/lowdefy/lowdefy/commit/f2c673921691132ff7935a2fcae52f0780e81464))
- **cli:** Log info about created files in init ([bcb8933](https://github.com/lowdefy/lowdefy/commit/bcb89332aac6ac5a28b6ec2b08d6190ebd24b409))
- **deps:** Update dependency mingo to v4.1.2. ([eb57a01](https://github.com/lowdefy/lowdefy/commit/eb57a01b4a3e2859659462b1865ddb06656f98b1))
- **docs:** Add AgGrid reference to custom-blocks. ([c90f7b5](https://github.com/lowdefy/lowdefy/commit/c90f7b5a2665e1ded79cfaa9d4e2d78ecf3b4507))
- **docs:** Add docs README ([2747197](https://github.com/lowdefy/lowdefy/commit/2747197dc2f86bb00dfeaffec8426a080731184b))
- **docs:** Add links to example demos and code in next steps. ([1bb9569](https://github.com/lowdefy/lowdefy/commit/1bb9569b41ea0c048999a99bfabfbbf5710fad50))
- **docs:** Add netlify deploy section to docs. ([be82708](https://github.com/lowdefy/lowdefy/commit/be827081ac3e1344ab6f907b0c17f9155ae0a47d))
- **docs:** Add telemetry ([1d6c07e](https://github.com/lowdefy/lowdefy/commit/1d6c07eb4ae0ec0ccfcb0b263324d144fbc1fcb3))
- **docs:** add thank you message to footer. ([aa85e8a](https://github.com/lowdefy/lowdefy/commit/aa85e8a792f72a9d39239b69e7ba88ad8564278a))
- **docs:** Add tutorial videos ([9e07674](https://github.com/lowdefy/lowdefy/commit/9e07674f199d9254c95915730561e6a4f95e0239))
- **docs:** Docs and tutorial improvements ([28ef6df](https://github.com/lowdefy/lowdefy/commit/28ef6df6e85fc71817e68428814fb557fb365776))
- **docs:** Fix links and improve docs content ([3019495](https://github.com/lowdefy/lowdefy/commit/30194956a5057b631865ebe4c977b4e5be492367))
- **docs:** fix Request action call all requests documentation. ([c6593f3](https://github.com/lowdefy/lowdefy/commit/c6593f3ac90d723743e57e95b46e8abfe8de084c))
- **docs:** fix tutorial. ([8c9d30d](https://github.com/lowdefy/lowdefy/commit/8c9d30dea44ba0948512d570e222769bbe3e8264))
- **docs:** General docs fixes and improvements ([deddeb4](https://github.com/lowdefy/lowdefy/commit/deddeb4045cde7286c9b58f5881778c87260dd33))
- **docs:** Improve body markdown block ids in tutorial ([7e04786](https://github.com/lowdefy/lowdefy/commit/7e04786cff0b1a5fc9ed73a69fab8f54018c76a0))
- **docs:** Move deployment to the end of tutorial ([b934f9c](https://github.com/lowdefy/lowdefy/commit/b934f9c6bdb48e5d8bb1d86e4d3fdd63e1441809))
- **docs:** Post newsletter subsriptions to Lowdefy API. ([ed51ddb](https://github.com/lowdefy/lowdefy/commit/ed51ddb1d0d522640799a6ff9f1ee34701ae2712))
- **docs:** Remove unused template files ([be0546d](https://github.com/lowdefy/lowdefy/commit/be0546d102d332349fd4ba5e2bb7b6ada62cb92a))
- **docs:** Rename `validation` to `validate` in docs. ([147f8de](https://github.com/lowdefy/lowdefy/commit/147f8dec5bd04471b25ca40b8b6d08fe1642fad0))
- **docs:** Tutorial fixes ([3bc9a55](https://github.com/lowdefy/lowdefy/commit/3bc9a55c786a0ad827d9810c1c44abe8abc38978))
- **docs:** Update introduction. ([4f17f35](https://github.com/lowdefy/lowdefy/commit/4f17f35f58ebc59f4285357ec54811ea700e4c9f))
- **engine:** Validate was not showing the correct error message. ([4fcbda4](https://github.com/lowdefy/lowdefy/commit/4fcbda45ebafb6b40b93d865a648234ca19f505f))
- **engine:** Validation warnings were shown as errors not warnings. ([84ad6b3](https://github.com/lowdefy/lowdefy/commit/84ad6b3b98fb28e770262898cdc41373f3f919a7))
- **renderer:** Add Lowdefy object to window if running on localhost. ([726022d](https://github.com/lowdefy/lowdefy/commit/726022d7db76ad74959c4e19e79faa0fa9f54d63))
- **renderer:** Remove unneed favicon from Helmet component. ([e9e4795](https://github.com/lowdefy/lowdefy/commit/e9e4795eed578de31cbd2fd549a14a1d6a6a85b1))

## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)

## Changes

### Fixes

- Return data property to `TimelineList` until list values get their value in state.
- Improve schema error messages.
- Stop the CLI dev server if the Lowdefy version in `lowdefy.yaml` changes.
- Fix the `saslprep` warning when using the MongoDB connection.
- Fix the issue where aggregation pipeline updates cannot be used with MongoDB update requests.
- Getter operators no longer throw an error when getting from `null`.

### Documentation

- Added documentation for custom blocks.
- Added documentation for versions and updates.

## Commits

### Bug Fixes

- **blocks-antd:** Add data prop back to timeline list until lists get value from state ([71eb8be](https://github.com/lowdefy/lowdefy/commit/71eb8bef5c8e63fa7dd21e0f0820d50d7f8784d6))
- **build:** Start schema error messages with a new line ([80110c5](https://github.com/lowdefy/lowdefy/commit/80110c5fe4e313447df3399d097e2fac628cb4e3))
- **cli:** Give dev command name to startup function. ([1ce7e3f](https://github.com/lowdefy/lowdefy/commit/1ce7e3fcf41669e5861ff8a5f25bd640179cfbfd))
- **cli:** Stop dev server if lowdefy version changes ([a944cc8](https://github.com/lowdefy/lowdefy/commit/a944cc819ee60df6371ae3cff1747ec14889c5dc)), closes [#447](https://github.com/lowdefy/lowdefy/issues/447)
- **docs:** Add comment on LTS version. ([fdf4361](https://github.com/lowdefy/lowdefy/commit/fdf4361516f2b4c87d327406ad8ab89237df2117))
- **docs:** Add custom blocks. ([501664a](https://github.com/lowdefy/lowdefy/commit/501664ab1ce8d1e48d8a617fef626b4332d04814))
- **docs:** Add versions and updates section. ([168175e](https://github.com/lowdefy/lowdefy/commit/168175e149d46c06e4a854b4f413a123f795257d))
- **docs:** Update custom blocks concepts. ([f5bdd5d](https://github.com/lowdefy/lowdefy/commit/f5bdd5d2011cd5168d8322a25cfcb0d0eb7c808c))
- **graphql:** Include saslprep in webpack build for mongodb. ([19e048e](https://github.com/lowdefy/lowdefy/commit/19e048eda39bf30fac4716ebdd4c2aea0261ad7e))
- **graphql:** MongoDB updates can use aggregation pipelines. ([8e9653c](https://github.com/lowdefy/lowdefy/commit/8e9653c09ebe390b64d4071056e3b08b86a80471))
- **operators:** Getter operators should not error if key is null. ([d080e5a](https://github.com/lowdefy/lowdefy/commit/d080e5aac405795ade11bf9bc296fc59d8266e60))

# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)

### Bug Fixes

- **blocks:** Do not pass methods down to imported blocks. ([ff3f588](https://github.com/lowdefy/lowdefy/commit/ff3f588410a970a65523693f143ba9e80139f2f0))
- **blocks:** Update block tests. ([898fc3c](https://github.com/lowdefy/lowdefy/commit/898fc3c818fd9879a79b48fcc785398c33677731))
- **blocksAntd:** Fix icon in Notification. ([34c03fc](https://github.com/lowdefy/lowdefy/commit/34c03fc7f09c5c28717de059443c819cc1bbfa49))
- **build:** Add action messages to app schema ([2aff1cb](https://github.com/lowdefy/lowdefy/commit/2aff1cbf3a2216ab4c97a2119a158381b305ca88))
- **cli:** Log command and lowdefy version in error handler. ([6c1ed5b](https://github.com/lowdefy/lowdefy/commit/6c1ed5b4c29f94b95802f2081ee58db7d1ebe47f))
- **deps:** Update dependency @ant-design/icons to v4.5.0. ([8382bbb](https://github.com/lowdefy/lowdefy/commit/8382bbba7b58ec022109e4d97d1944390a9c09cc))
- **deps:** Update dependency @apollo/client to v3.3.11. ([27f553d](https://github.com/lowdefy/lowdefy/commit/27f553db37287e7d14b08d9eb9896c0ac084d56a))
- **deps:** Update dependency apollo-server packages to v2.21.0 ([276012c](https://github.com/lowdefy/lowdefy/commit/276012c48283be64e60cbe00f7d8acf695773725))
- **deps:** Update dependency aws-sdk to v2.845.0. ([55f5ef7](https://github.com/lowdefy/lowdefy/commit/55f5ef79340d76c74a4fefef8b401ac0603714fd))
- **deps:** Update dependency css-loader to v5.0.2. ([6dd6a82](https://github.com/lowdefy/lowdefy/commit/6dd6a82fa4e4975f201e0c22c6b5bf29cd0541e3))
- **deps:** Update dependency eslint to v7.20.0. ([36b3892](https://github.com/lowdefy/lowdefy/commit/36b389201effcd5f8888beab5e1ed9edae924cc0))
- **deps:** Update dependency html-webpack-plugin to v5.1.0 ([d0dd688](https://github.com/lowdefy/lowdefy/commit/d0dd688816e3e9fc6ff56235698d3af4707eba5f))
- **deps:** Update dependency imports-loader to v2.0.0. ([9543482](https://github.com/lowdefy/lowdefy/commit/954348287f1a07830afbba0724d309189ae6f083))
- **deps:** Update dependency json5 to v2.2.0. ([d93df2b](https://github.com/lowdefy/lowdefy/commit/d93df2b82d15585c907f18e2a52c2fda7b23a71a))
- **deps:** Update dependency less to v4.1.1. ([19ec1e2](https://github.com/lowdefy/lowdefy/commit/19ec1e205154974005b741d4a77a89161fad308f))
- **deps:** Update dependency less-loader to v8.0.0. ([465727b](https://github.com/lowdefy/lowdefy/commit/465727bf5e6cd0377e61afa37a38e7e0a1a05e95))
- **deps:** Update dependency mingo to v4.1.1. ([efdb838](https://github.com/lowdefy/lowdefy/commit/efdb838fdf3b002f5799e04c5d5de1dc721dabdc))
- **deps:** Update dependency mongodb to v3.6.4. ([5a82096](https://github.com/lowdefy/lowdefy/commit/5a820966382377c92ec600ea94fb5faa07e76d7a))
- **deps:** Update dependency nunjucks to v3.2.3. ([741616e](https://github.com/lowdefy/lowdefy/commit/741616e4e46544deac297fcf4dea034b6e2174c5))
- **deps:** Update dependency query-string to v6.14.0. ([3a942f1](https://github.com/lowdefy/lowdefy/commit/3a942f10ba577cc3015b5e1a9eebd23ee21a0238))
- **deps:** Update dependency webpack to v5.22.0. ([bb9f69e](https://github.com/lowdefy/lowdefy/commit/bb9f69e29cbce728932ab512e12122ce3dc349cc))
- **deps:** Update dependency webpack-cli to v4.5.0. ([445d55c](https://github.com/lowdefy/lowdefy/commit/445d55ca12f720be9f09632a319c319323c7041c))
- **deps:** Update package commander to v7.1.0. ([e13945e](https://github.com/lowdefy/lowdefy/commit/e13945e5774078a9b55d8db7391dc4d9b82485c2))
- **docs:** Add concepts pages for lists, secrets and deployment. ([fb93e33](https://github.com/lowdefy/lowdefy/commit/fb93e3369578daf8d99707c531ca55c22d4d227b))
- **docs:** CallMethod takes an array as input. ([a698d0b](https://github.com/lowdefy/lowdefy/commit/a698d0b13739dd5728f69c55a75f3c644828e475))
- **engine:** Fix Link action always errors. ([ec4c0f2](https://github.com/lowdefy/lowdefy/commit/ec4c0f24dcf5715ca8230d20b253a74afcdcccb5))
- **engine:** Fix set block to update on event loading. ([db80390](https://github.com/lowdefy/lowdefy/commit/db8039079ecfb5484f49f0a921e326fda4342050))
- **engine:** Use displayMessage from window. ([a7e50b3](https://github.com/lowdefy/lowdefy/commit/a7e50b39da5a37efc16dc15d2f3e56a4bac820f6))
- **graphql:** Add descriptions to SendGridMailSendSchema. ([edefaa7](https://github.com/lowdefy/lowdefy/commit/edefaa7e52df68f328ead03e5fbd58ae5f2e43c9))
- **graphql:** Add saslprep dependancy for mongodb. ([4d1137a](https://github.com/lowdefy/lowdefy/commit/4d1137af842bec80d1fbc7f131ef86cb66339244))
- **renderer:** Set displayMessage on window. ([8ba9606](https://github.com/lowdefy/lowdefy/commit/8ba9606e048e76478f39125fa21ac97931a68fa6))

### Features

- **cli:** Add init command to cli. ([ec496a5](https://github.com/lowdefy/lowdefy/commit/ec496a5e55caacf42f3fddccefca213778963f2a))
- **cli:** Check for outdated versions on startup. ([7236da3](https://github.com/lowdefy/lowdefy/commit/7236da312b2656464c0775e882fc58e11303944f))
- **cli:** Rename @lowdefy/cli package to lowdefy ([b73777a](https://github.com/lowdefy/lowdefy/commit/b73777a18f379c8cb2ffef7007ba487d4d1c051e))

### Reverts

- fix(deps): Update dependency less to v4.1.1 to v3.13.0. ([2e09287](https://github.com/lowdefy/lowdefy/commit/2e09287f572f78b82eae43cd2f56ef75994a0356))

# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)

### Bug Fixes

- **actions:** Fix action response, add tests. ([0d16f82](https://github.com/lowdefy/lowdefy/commit/0d16f82a92135e0e895bd2088d4386b0f01b67d7))
- **blocksAntd:** Fix args.icon for Message. ([8a16504](https://github.com/lowdefy/lowdefy/commit/8a165048b8253f06a6c827426d9c5f4dd1e002dd))
- **blocksAntd:** Return the message function. ([6fb2aec](https://github.com/lowdefy/lowdefy/commit/6fb2aec2d82085dab4f6a406c6882b7cd7666ef8))
- **blocksAntd:** Update Timeline to work from value settings. ([c95009b](https://github.com/lowdefy/lowdefy/commit/c95009b44128f234d1c3f4848e823b1d9c4400e2))
- **blocksColorSelectors:** Include block value test. ([9da9c32](https://github.com/lowdefy/lowdefy/commit/9da9c322f61ae10fd1123a3852ce6bff096fa329))
- **blockTools:** Add example value to block render tests. ([e860013](https://github.com/lowdefy/lowdefy/commit/e8600131aeabaad93d70b7be4125a2153cb7598d))
- **build:** Fix TimelineList block location (renamed from Timeline). ([02c5dea](https://github.com/lowdefy/lowdefy/commit/02c5dea13ff5f87b385a3ac5408efe2e4fa8c3dc))
- **docs:** Add docs for SendGridMailSend. ([3e19e4c](https://github.com/lowdefy/lowdefy/commit/3e19e4c05ed026873d9e65fda1a667f27073d9c3))
- **docs:** Add init menu for PageSiderMenu and PageHeaderMenu. ([2f8c6d2](https://github.com/lowdefy/lowdefy/commit/2f8c6d29c034576340ae05250811ae54a6f8ecde))
- **docs:** Add List and ControlledList. ([513a494](https://github.com/lowdefy/lowdefy/commit/513a494dc5c9273d346ef850f413bb6721134c89))
- **docs:** filterDefaultValue not to filter arrays. ([48ccc5c](https://github.com/lowdefy/lowdefy/commit/48ccc5c6005760a21845fc1cf30b08ef387f44dc))
- **docs:** Fix schemas for Context Pages. ([2700d68](https://github.com/lowdefy/lowdefy/commit/2700d68c7fd29ad89ba669fcab48ba816211cbcc))
- **docs:** Fixes to SendGridMail. ([4a6cd66](https://github.com/lowdefy/lowdefy/commit/4a6cd663f67057ce120e37fc9d0368c34badf577))
- **docs:** Improve blocks default value filter. ([8e722d1](https://github.com/lowdefy/lowdefy/commit/8e722d1120d8f25da6c9e897701137d90534aecc))
- **docs:** Improve example rendering in template. ([e528776](https://github.com/lowdefy/lowdefy/commit/e5287763e98959a9a559c040e92bd8f895b8293c))
- **docs:** Only recurse getNestedValue on objects. ([d6d3e04](https://github.com/lowdefy/lowdefy/commit/d6d3e0429829f12466fdab56c17af9cfc1cc61ec))
- **docs:** Remove and fix old block examples. ([11defbe](https://github.com/lowdefy/lowdefy/commit/11defbe4b2140ee78a2cec073b9e225bdc1ae24b))
- **docs:** Typos in AxiosHttp. ([5928330](https://github.com/lowdefy/lowdefy/commit/59283307518f24b41dd592879f3eeaefd4cd50f9))
- **docs:** Update \_format operator docs. ([8aa42aa](https://github.com/lowdefy/lowdefy/commit/8aa42aaed51ad49459e0dbf330685019b99d61df))
- **docs:** Update CallMethod docs with new usage. ([0f0f320](https://github.com/lowdefy/lowdefy/commit/0f0f320d180a2ebdb1ae8c1b29ca2afb4f1b0730))
- **engine:** Fix Link action with input and urlQuery. ([be6a1e1](https://github.com/lowdefy/lowdefy/commit/be6a1e1e8801458d059fe937d517b777c41fee71))
- **engine:** Fix Validate function name ([795d876](https://github.com/lowdefy/lowdefy/commit/795d8765e18f5c3c5a1e3b44133e9785fad3aad2))
- **engine:** Log action errors to the console. ([38ea5ff](https://github.com/lowdefy/lowdefy/commit/38ea5ff430d766f3b178b3746aeac6c6c8cb78d6))
- add SECURITY.md ([84a03ba](https://github.com/lowdefy/lowdefy/commit/84a03ba69ce2d6be2387afb8c86749ebd5717a61))
- **renderer:** Add displayMessage to renderer. ([863515e](https://github.com/lowdefy/lowdefy/commit/863515e173ca7bb7cf1f5b65a02efb5a10640da3))

### Features

- **engine:** Parse params for all actions. Refactor actions and events. ([0d55bd2](https://github.com/lowdefy/lowdefy/commit/0d55bd2624917a8415802db7413ebe4e06e1c111))

# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)

### Bug Fixes

- **blocks:** Remove react router from render loop where not required. ([7b6970f](https://github.com/lowdefy/lowdefy/commit/7b6970f9b4fcc1b9e35771ba619fab890fa638f5))
- **blocks-antd:** Remove formatter option from Statistic block. ([4c6a3b8](https://github.com/lowdefy/lowdefy/commit/4c6a3b81310418b207521ca790d80ebfe2149f6c))
- **blocksAntd:** Fix Label areas.label bug. ([6bcd258](https://github.com/lowdefy/lowdefy/commit/6bcd2585268302938ab61010bd297a390e0f09aa))
- **blocksAntd:** Fix suffixIcon and label on MonthSelector. ([9547ff5](https://github.com/lowdefy/lowdefy/commit/9547ff5b147620837becea4e05d4b680b5115b0d))
- **blocksAntd:** PageSiderMenu affix toggle button. ([ae46923](https://github.com/lowdefy/lowdefy/commit/ae469234a8fd7daec47c3e9064234ba1bdeebffd))
- **blocksAntd:** PageSiderMenu clean up. ([340a760](https://github.com/lowdefy/lowdefy/commit/340a760a89c1286a7ec7c4e4b4b7457006cfcf49))
- **blocksAntd:** PageSiderMenu collapsed state should not open defaultOpenKeys. ([9172904](https://github.com/lowdefy/lowdefy/commit/91729047988323907c8ed0db4970be89a1c2c9d0))
- **blocksAntd:** Remove open property from Modal and Drawer. ([e5954ff](https://github.com/lowdefy/lowdefy/commit/e5954fffc71a55b4e883ef93d77f1bb439b68d66))
- **blocksAntd:** Update Anchor to use href spec. ([1b9a5b1](https://github.com/lowdefy/lowdefy/commit/1b9a5b1b4c43489be583968480403325c49fdca7))
- **blocksColorSelectors:** Add default colors for SwatchesColorSelector. ([9650f73](https://github.com/lowdefy/lowdefy/commit/9650f7377b480ac681e199bc355fd4de8c44650e))
- **blocksColorSelectors:** Add value label for CircleColorSelector. ([ee5c05b](https://github.com/lowdefy/lowdefy/commit/ee5c05b7c6361409fa837c92f5cd4a222cfb09eb))
- **blocksColorSelectors:** Upfate blocksColorSelectors examples render loop. ([2f88449](https://github.com/lowdefy/lowdefy/commit/2f884495ceea239e30b95f662db5f271b8344c95))
- **docs:** Improve concepts docs. ([f982f83](https://github.com/lowdefy/lowdefy/commit/f982f8339dd8889ced1b53b000373baca58df06c))
- **docs:** Add 404 to general template. ([c31cb4b](https://github.com/lowdefy/lowdefy/commit/c31cb4b85a07b2708cf34271bfa221d0efcc5043))
- **docs:** Add Collapse, Tabs and MobileMenu blocks ([6db451b](https://github.com/lowdefy/lowdefy/commit/6db451b2a991b4e64d9b58e62c4670b4713a36c9))
- **docs:** Add container block docs. ([b490ec7](https://github.com/lowdefy/lowdefy/commit/b490ec767d6ab78c79f8b78836aee88f2f3b3f12))
- **docs:** Add context category block docs. ([39fb6c3](https://github.com/lowdefy/lowdefy/commit/39fb6c3b78eed52a114608186ad16b385cd43828))
- **docs:** Add examples to Progress. ([9169001](https://github.com/lowdefy/lowdefy/commit/9169001ab56763b6d9ee26d6c9e33705367b60b8))
- **docs:** Add filePath to all pages. ([b890a2a](https://github.com/lowdefy/lowdefy/commit/b890a2a6a18151f47c011707578358668c16b71a))
- **docs:** Fix content overflow on mobile. ([33c1abb](https://github.com/lowdefy/lowdefy/commit/33c1abb8c1992d0d48965e06641a59ef3fc00f7e))
- **docs:** Fix object propertiesGetterTransformer to assign to default object when null. ([31df2a4](https://github.com/lowdefy/lowdefy/commit/31df2a41204365fd898d10df89a89261193b3a0e))
- **docs:** fix schema on ScrollTo blockId example ([9c0b620](https://github.com/lowdefy/lowdefy/commit/9c0b620555990aab52f283965cbdab6b43176a76))
- **docs:** Fix selector value types for init_state_values. ([6cfd6a1](https://github.com/lowdefy/lowdefy/commit/6cfd6a1aa711113f31130940ff5eec5cf008a1f1))
- **docs:** Link to community in header. ([62da21b](https://github.com/lowdefy/lowdefy/commit/62da21b09ae545301312ddac4c5eec9ad27231c7))
- **docs:** Remove Skeleton for now. ([45d5b69](https://github.com/lowdefy/lowdefy/commit/45d5b69db11104af57e719e8a465960cc60f91fd))
- **docs:** Render value by default on color selectors. ([3db0f53](https://github.com/lowdefy/lowdefy/commit/3db0f53e5b839931be831b3d459e6cc236a728c8))
- **docs:** Update blocks template to one use schema variable. ([54aa7dc](https://github.com/lowdefy/lowdefy/commit/54aa7dc1a1b8ba67e596edb8b415cb28c8dff6c1))
- **docs:** Update blocks templates for context blocks ([8e7bd77](https://github.com/lowdefy/lowdefy/commit/8e7bd77ba2ced9f87b502f8876880eec9dc80259))
- **docs:** Update footer links to hrefs. ([787cfb0](https://github.com/lowdefy/lowdefy/commit/787cfb025eac722156954a7cba2bb8dee8b999b5))
- **docs:** Update templates with header and footer. ([e2a63fa](https://github.com/lowdefy/lowdefy/commit/e2a63fac3dbcc6bba9de3d7c53edbb82a32c9c8d))
- **engine:** Fix container chlidren visibilty if container vis is null. ([0af48bd](https://github.com/lowdefy/lowdefy/commit/0af48bdc5b9ea201118e76b3479180c15498fbaf))
- **operators:** Allow get from object to take an integer argument. ([e8bdbd9](https://github.com/lowdefy/lowdefy/commit/e8bdbd96a3bf776365d77f9c0800c3c732ea0fbe))
- **operators:** Block experimental operators in \_operator. ([342b636](https://github.com/lowdefy/lowdefy/commit/342b636468031905a45e2da66b455ce74469ada5))
- **renderer:** Loading must render inside BlockLayout. ([e1bced9](https://github.com/lowdefy/lowdefy/commit/e1bced9843df832084fb724322de074ad64f792f))

### Features

- **engine:** Rename Link action newWindow to newTab. ([35b47f6](https://github.com/lowdefy/lowdefy/commit/35b47f6d47338b3f93ae41a0fcd2046b5593db50))
- **operators:** Add \_format operator. ([44839da](https://github.com/lowdefy/lowdefy/commit/44839daf959253660b6d3c97204898cad0e464fb))
- **operators:** Add \_index operator. ([995a912](https://github.com/lowdefy/lowdefy/commit/995a9128e38a27d4e2fdad8c7b6459ee2640c120))
- **operators:** Add experimental javascript operator ([9b7998c](https://github.com/lowdefy/lowdefy/commit/9b7998c174ed0eb6cb0e6054aa0f3334e404f7d8))

## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)

### Bug Fixes

- Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))

## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/lowdefy

# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)

### Bug Fixes

- **blockDefaults:** Change allowClear default to false for TextArea and TextInput. ([30323ea](https://github.com/lowdefy/lowdefy/commit/30323eadf0bd573c7788302727ba5881caa4fe5e))
- **blocksAntd:** Fix Menu default open and selected keys. ([a1f48c5](https://github.com/lowdefy/lowdefy/commit/a1f48c5c1a93e5d47a08c6808416642598282d45))
- **blocksAntd:** Fix placeholder default for DateRangeSelector. ([03b03ad](https://github.com/lowdefy/lowdefy/commit/03b03addd6f07c55476d5db0055294e683ffa090))
- **blocksAntd:** Update styling for ControlledList. ([e5d773b](https://github.com/lowdefy/lowdefy/commit/e5d773b9f43eaaee2ba5d94ddd0c92c80f14e32d))
- **blockTools:** Add pageId to block schema in schemaTest. ([548ba6a](https://github.com/lowdefy/lowdefy/commit/548ba6aefefa8475cfa6cb7c48ccce143d577d95))
- **blockTools:** Fix Skeleton linear-gradient for safari. ([59026f4](https://github.com/lowdefy/lowdefy/commit/59026f4b75d186a61162f0bc44e8bf8454ea06ff))
- **build:** Allow \_ref path argument to be a \_var. ([a8bd287](https://github.com/lowdefy/lowdefy/commit/a8bd287176a58eff5df5f79071119cce0fc4e0fa))
- **engine:** Actions should only skip when “skip” is explicitly true ([e34dc05](https://github.com/lowdefy/lowdefy/commit/e34dc056d11709d2d319f36a052f27dea0ec7cc6))
- **engine:** Only update when onInit is done. ([9f21597](https://github.com/lowdefy/lowdefy/commit/9f215976ffd44caa96c75e0ba929f750819b2e36))

### Features

- **docs:** Update blocks property getters. ([e68f774](https://github.com/lowdefy/lowdefy/commit/e68f774a5c6421b2b1136fc6943ffd0aaf0da498))

# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)

### Bug Fixes

- Fix blocks-color-seletors typo. ([b6ccedd](https://github.com/lowdefy/lowdefy/commit/b6ccedd355c53b5910ef398aff49d32968f34c2e))
- **blocksAntd:** PageHSCF events rename. ([ec4e9ed](https://github.com/lowdefy/lowdefy/commit/ec4e9edc41561414f11ddf62c2d0d0a63905578c))
- **build:** Add 'field' to block schema. ([4aa76e8](https://github.com/lowdefy/lowdefy/commit/4aa76e807743064cca8c5a51ee3d5c7ad536aff8))
- **cli:** Fix netlify build. ([3c930e8](https://github.com/lowdefy/lowdefy/commit/3c930e85010fcf85aae48eb07603412a31044c29))
- **docs:** Events rename fixes. ([a43cd3d](https://github.com/lowdefy/lowdefy/commit/a43cd3d3b09d88261638539d5c0383f539e705dd))
- **docs:** Update docs for v3.5.0 ([969414d](https://github.com/lowdefy/lowdefy/commit/969414dcaf47039f8feb82034d25bf6bb4aa4e78))
- **engine:** Events rename fix. ([ca142ca](https://github.com/lowdefy/lowdefy/commit/ca142ca160a8e3db911ed70f571be31ef5f60d42))

### Features

- **githubactions:** Upload blocks to cdn on publish. ([2afebd1](https://github.com/lowdefy/lowdefy/commit/2afebd109a67bd298cb16e9c7faf5fa8b4ec73ff))
- 🐢Redirect all paths to blocks-cdn. ([a45447a](https://github.com/lowdefy/lowdefy/commit/a45447ad1dacf977e487a020bd56080ae2b09792))

# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)

### Bug Fixes

- **blockBasic:** Fix typo. ([9772e1a](https://github.com/lowdefy/lowdefy/commit/9772e1a44aa0db1e3c0f3194cd16d71794027de7))
- **blocks:** Add default colors to ColorSelector schemas. ([ed03d73](https://github.com/lowdefy/lowdefy/commit/ed03d733c95fc8d73a276bdb40b5b3afc4880d25))
- **blocks:** Add events to all subblocks. ([753ae60](https://github.com/lowdefy/lowdefy/commit/753ae60fc8a150ef2db3a243a2862841c6aad48b))
- **blocks:** Block schema fixes. ([34b5a11](https://github.com/lowdefy/lowdefy/commit/34b5a118024186e0a8ce241e5d05c0b26f84f710))
- **blocks:** Fix NumberInput to not apply default precision. ([f2ddcaa](https://github.com/lowdefy/lowdefy/commit/f2ddcaa7582515eb42464580888676789df73512))
- **blocks:** Fix port setting in webpack config. ([c828740](https://github.com/lowdefy/lowdefy/commit/c82874045dd041fbf3c3a8b4f5cb7dc27a05f39a))
- **blocks:** RatingSlider NA checkkbox to set NA value to state. ([a15693d](https://github.com/lowdefy/lowdefy/commit/a15693d566cee53f4d7c4f5e2461757f89bc7ee4))
- **blocks:** Update block schemas for all blocks. ([9a79743](https://github.com/lowdefy/lowdefy/commit/9a79743174935fd3eb02b3e777165e026e95c7ec))
- **blocks-antd:** Update snapshots for Avatar schema. ([784c0e9](https://github.com/lowdefy/lowdefy/commit/784c0e965f8455287f5b13f8a44c5386c75801ea))
- **blocksAntd:** Alert description only margin issue. Closes [#327](https://github.com/lowdefy/lowdefy/issues/327) ([864e74e](https://github.com/lowdefy/lowdefy/commit/864e74eff0a9b05eed90cd70081b9826b1ae95dc))
- **blocksAntd:** Correct disabledDates typo. Closes [#358](https://github.com/lowdefy/lowdefy/issues/358) ([558becf](https://github.com/lowdefy/lowdefy/commit/558becf243921b6494eaa99a2b307193253391a5))
- **blocksAntd:** Fix top padding on RatingSlider. ([48f9c13](https://github.com/lowdefy/lowdefy/commit/48f9c13962fdc71a815360c62b71c364ff405a8c))
- **blocksAntd:** Maintain cursor position for input blocks. Closes [#344](https://github.com/lowdefy/lowdefy/issues/344) ([7e90fed](https://github.com/lowdefy/lowdefy/commit/7e90fed8c6b12f51054d3c8bc4b3c93579ab097a))
- **blocksBasic:** Add bad html test. ([98740b8](https://github.com/lowdefy/lowdefy/commit/98740b8aae72a57311d64314f9ce9c1838f212ae))
- **blocksMarkdown:** Update schemas. ([9af217c](https://github.com/lowdefy/lowdefy/commit/9af217cb2b9de6609680fe96e6c006b983adda5d))
- **build:** Add types object to app schema. ([bd40748](https://github.com/lowdefy/lowdefy/commit/bd40748afcbe3c31d83b7c2f169db9ae1285ea5d))
- **build:** Improve error message if \_var receives invalid arguments. ([c52a942](https://github.com/lowdefy/lowdefy/commit/c52a94297aec0f39c88bd5f6ae6d22e6723fe27a))
- **build:** Improve warning message if menu’s page not found ([7df576a](https://github.com/lowdefy/lowdefy/commit/7df576a2689f8eb79b44ca5fa8d2af38126006e7))
- **build:** Update default locations. ([203175d](https://github.com/lowdefy/lowdefy/commit/203175d6a4b8c018c9d65ff7cb7248b10d4e4508))
- **cli:** Clean node_modules in netlify build before copying. ([9251d58](https://github.com/lowdefy/lowdefy/commit/9251d58a592d5cca83021f9d7a6701390defa1f9))
- **cli:** Fix function name case ([1ba1c65](https://github.com/lowdefy/lowdefy/commit/1ba1c65d7d01a808f5c1d06e0c95454bae9594d7))
- **cli:** Fix reload port clash when running multiple dev servers. ([4910718](https://github.com/lowdefy/lowdefy/commit/4910718f4ebe78105694a5943d96989f274c427a))
- **cli:** Only start server if initial build has completed. ([20cfcaa](https://github.com/lowdefy/lowdefy/commit/20cfcaa3d8f67816628f5001fbcc4ebb28b43123))
- **DangerousHtml:** Fix DangerousHtml description in include render details. ([30b348a](https://github.com/lowdefy/lowdefy/commit/30b348aebd163507722dadd163a045e72e7a70ec))
- **deps:** Update dependency @and-design/icons to v4.4.0 ([9189eae](https://github.com/lowdefy/lowdefy/commit/9189eae785d8635cf1f84b17519450fc4f005900))
- **deps:** update dependency aws-sdk to v2.832.0 ([ed9f6d4](https://github.com/lowdefy/lowdefy/commit/ed9f6d4d2fb38b12dea5963ef408d5679cc2b8fe))
- **deps:** update dependency chokidar to v3.5.1 ([fe8ff89](https://github.com/lowdefy/lowdefy/commit/fe8ff892a770cac37cbba3b1244357aab5b68d28))
- **deps:** Update dependency copy-webpack-plugin to v7.0.0. ([901d412](https://github.com/lowdefy/lowdefy/commit/901d4126544dd4ee68d62bf520cdd4cc2b0d1dcc))
- **deps:** Update dependency graphql to v15.5.0 ([90acf72](https://github.com/lowdefy/lowdefy/commit/90acf7289c517f9afe066cd0706c64187a39648b))
- **deps:** Update dependency ora to v5.3.0. ([542c115](https://github.com/lowdefy/lowdefy/commit/542c1156c66c9926d89b751ed5b5bf44661a5d96))
- **deps:** Update peer dependencies. ([57e5295](https://github.com/lowdefy/lowdefy/commit/57e52959b6ec507f4d060d8c7260a22761dca328))
- **docs:** Add default values and loading to blocks. ([fcadf76](https://github.com/lowdefy/lowdefy/commit/fcadf76edca9828c8bc0a511ca24cbbb20ccd219))
- **docs:** Catch null in filter_default_value. ([8975b0f](https://github.com/lowdefy/lowdefy/commit/8975b0f5cbc62e93d32b2ecf151d3c5ed5a822a7))
- **docs:** Change secret warning to Alert. ([9be4ef5](https://github.com/lowdefy/lowdefy/commit/9be4ef585204d143b547da0147a66a827a456956))
- **docs:** Concepts pages fixes and additions. ([fd6fba5](https://github.com/lowdefy/lowdefy/commit/fd6fba55d1d57d120b3fad6045b3d671b1bec0e8))
- **docs:** Convert propertiesFormTransform to work with objects. ([33042ba](https://github.com/lowdefy/lowdefy/commit/33042ba8e5a867338822ba1f4383bf458f801fa1))
- **docs:** Fix all date value_type. ([51e6b70](https://github.com/lowdefy/lowdefy/commit/51e6b70a50fa4dc2579cf9180f7b93284322cd07))
- **docs:** Fix connection docs formatting ([37ff0ce](https://github.com/lowdefy/lowdefy/commit/37ff0cea9345a9741409b28d753d3a0cb36b424b))
- **docs:** Fix lowdfey.yaml ([01cc8fc](https://github.com/lowdefy/lowdefy/commit/01cc8fc27538eec1f4fa5c24e9110949928785ab))
- **docs:** Fix merge conflict and S3UploadButton examples ([e496d8c](https://github.com/lowdefy/lowdefy/commit/e496d8c8de04879fc59810ca66cf4182b3788997))
- **docs:** Fix operator docs ([7bf5a6c](https://github.com/lowdefy/lowdefy/commit/7bf5a6c8759cfd66aab74ba05eb4cb4401563e65))
- **docs:** Improve default value filter for config yaml. ([e0cfc63](https://github.com/lowdefy/lowdefy/commit/e0cfc63d5379637fa16f086bfde1c9eb9c24983d))
- **docs:** Operator docs fixes. ([a36f31c](https://github.com/lowdefy/lowdefy/commit/a36f31cfed44920557123e485c045a44c0d25db9))
- **docs:** Operator docs improvements. ([919949f](https://github.com/lowdefy/lowdefy/commit/919949f4e6cdb1c44d10f543b2ee638b1070beee))
- **docs:** ParagraphInput remove content property. ([83d00ed](https://github.com/lowdefy/lowdefy/commit/83d00ed16c8bfd7b9cfed77c38190f1695cf9213))
- **docs:** Remove text size setting from markdown blocks. ([58cf464](https://github.com/lowdefy/lowdefy/commit/58cf46432431b35b3cbdb0bc520b7402b88207b6))
- **docs:** Review cli and lowdefy-schema. ([4440ecf](https://github.com/lowdefy/lowdefy/commit/4440ecf7378ff1d404c1ef5f03c7910f3599e202))
- **docs:** Right align all label for blocks. ([9060988](https://github.com/lowdefy/lowdefy/commit/906098885c9bee6abdb52af4e70883f67074edfe))
- **docs:** Set initial values for new propertiesFormTransformer. ([01632c6](https://github.com/lowdefy/lowdefy/commit/01632c6796b17f8f458b8b7b5db459ae32dcc441))
- **docs:** Tutorial fixes ([6536cc0](https://github.com/lowdefy/lowdefy/commit/6536cc04c89a18fabb4c3961f22ad519cc2fa284))
- **docs:** Typo fixes on operators. ([d48d391](https://github.com/lowdefy/lowdefy/commit/d48d3918751d048f2ac81e33f4f595e073c12cdc))
- **docs:** Update concpets ortder. ([91a5450](https://github.com/lowdefy/lowdefy/commit/91a54500ceb1a74dd13a2a0083c289ff0dc66884))
- **docs:** Update connections docs. ([75ac999](https://github.com/lowdefy/lowdefy/commit/75ac999f75f321390389fea0fc4bccbd16515fbc))
- **docs:** Update Pagination tests. ([fa583f2](https://github.com/lowdefy/lowdefy/commit/fa583f23a63ce2c40bd08d5acf0b6a0cf5a0c56d))
- **docs:** Update snapshots for Avatar schema. ([0176a85](https://github.com/lowdefy/lowdefy/commit/0176a85f99ff84e7335a22e72943a52b818bdd6c))
- **docs:** Update template tests. ([391c36e](https://github.com/lowdefy/lowdefy/commit/391c36e6f4ec7434eb8eee64f0b809540014b8a2))
- **graphql:** Mongodb, do not allow $out/$merge when write is false. ([92aa370](https://github.com/lowdefy/lowdefy/commit/92aa370ba037758f7e17e6c8c837960817e13ca4)), closes [#242](https://github.com/lowdefy/lowdefy/issues/242)
- **operators:** Fix error when operator not supported, add support for \_global ([8ba32aa](https://github.com/lowdefy/lowdefy/commit/8ba32aa7b4e23311b27043cd64782b75063a60b3))
- **renderer:** Fix registerMethods object. Closes [#348](https://github.com/lowdefy/lowdefy/issues/348) ([d28931f](https://github.com/lowdefy/lowdefy/commit/d28931f012f9aa52e884d58dd4982cb383b68579))
- concept pages typos and minor fixes ([f0df767](https://github.com/lowdefy/lowdefy/commit/f0df767c4073ebeebef9081da8c3f0aef33bfb7a))
- **renderer:** Fix context creation render loop bug. ([019dbdc](https://github.com/lowdefy/lowdefy/commit/019dbdc6465d0178da23e9c6e41bd5c3503ae686))

### Features

- **block-tools:** Rename block actions to events ([e33d0f3](https://github.com/lowdefy/lowdefy/commit/e33d0f3046b8ab354c0bfb38759c67708aafe22a))
- **blocks:** Add default block loading. ([d0d1801](https://github.com/lowdefy/lowdefy/commit/d0d1801490c486b19ec49ee9fd50395c9e02bb68))
- **blocks:** Fix disableDates in date selector schemas. ([b2763ee](https://github.com/lowdefy/lowdefy/commit/b2763ee2053df56a79c17e05998e643275e4bf4e))
- **blocks:** Update block schemas and tests. ([30636bd](https://github.com/lowdefy/lowdefy/commit/30636bd744f43652adcad51dd91570b53667dc04))
- **blocks-antd:** Rename block actions to events. ([9d9dce2](https://github.com/lowdefy/lowdefy/commit/9d9dce2ecfb4d9e37349b9f235a53d9724caee00))
- **blocks-basic:** Rename block actions to events. ([cbb5626](https://github.com/lowdefy/lowdefy/commit/cbb5626b8c3767aeb02a5b087a2cbc585e80b635))
- **blocks-color-selectors:** Rename block actions to events. ([ea13e8e](https://github.com/lowdefy/lowdefy/commit/ea13e8ebfec3512c98894a1483ad13f479dd42ed))
- **blocksBasic:** Sanitize html with dompurify. ([83f72a4](https://github.com/lowdefy/lowdefy/commit/83f72a4e2008f4deb1cb29b5d65fb1de11479644))
- **blocksMarkdown:** Split MarkdownWithCode and Markdown, and add DangerousMarkdown which uses dompurify. ([61ea65b](https://github.com/lowdefy/lowdefy/commit/61ea65b35bd04393cab01de3e9f6a229822001c2))
- **build:** Do not cache block metas if served from localhost. ([58772af](https://github.com/lowdefy/lowdefy/commit/58772af17886570aa8108ce2f04c554f21f80027))
- **docs:** Add \_array and \_string docs. ([ea2ad05](https://github.com/lowdefy/lowdefy/commit/ea2ad05051e79fa22f1225f891065fcb00df725a))
- **docs:** Add \_date, \_object and \_state docs. ([de2035a](https://github.com/lowdefy/lowdefy/commit/de2035a776336a49b2c94b10d7de77cded1aa354))
- **docs:** Add \_input, \_global, \_media, and \_url_query docs. ([9c81963](https://github.com/lowdefy/lowdefy/commit/9c81963ebe27556461f78a78908d9fcd88939329))
- **docs:** Add \_ref and \_var operators. ([420eef7](https://github.com/lowdefy/lowdefy/commit/420eef7593799e13b7c99072d3fd2f7294ccf42b))
- **docs:** Add \_secret, \_menu, \_get, \_event doc pages ([edd5b01](https://github.com/lowdefy/lowdefy/commit/edd5b01dc0fb9a9e60725229dc7006a80cb70908))
- **docs:** Add Alert, Anchor, Avatar and Breadcrumb docs. ([0983607](https://github.com/lowdefy/lowdefy/commit/098360766d95789232050bce9cdfa72ed3405beb))
- **docs:** Add all ColorSelector blocks. ([3913968](https://github.com/lowdefy/lowdefy/commit/3913968620e50e771a21adc452bbc4696b31efab))
- **docs:** Add all Selectors. ([f5e65ab](https://github.com/lowdefy/lowdefy/commit/f5e65ab4068e7c6bd413026b2adecb4e4563761e))
- **docs:** Add block schema transformer ([4cdf891](https://github.com/lowdefy/lowdefy/commit/4cdf89182ce8a81b86a30c84c637ac79e2f5e9ab))
- **docs:** Add blocks for Divider, Menu, Icon, Paragraph, Progress, Skeleton, Statistic. ([a2901ec](https://github.com/lowdefy/lowdefy/commit/a2901ec4b1d29a6973093db877a1ab1e741e4a17))
- **docs:** Add CLI docs page. ([75cc5ba](https://github.com/lowdefy/lowdefy/commit/75cc5babb9d4c3448d38cfb22ce886617016aabf))
- **docs:** Add concepts and next steps. ([f1b8055](https://github.com/lowdefy/lowdefy/commit/f1b80555b6102854b8b7f68450c29d09a0c0d44a))
- **docs:** add concepts docs. ([3b12dc9](https://github.com/lowdefy/lowdefy/commit/3b12dc955edc226fe548c11d5f63d08ae2e3612c))
- **docs:** Add DangerousMarkdown, Markdown, MarkdownWithCode blocks. ([963cfa2](https://github.com/lowdefy/lowdefy/commit/963cfa2ef242ce17650493e1748d87770918d384))
- **docs:** Add date selector docs. ([767f9ac](https://github.com/lowdefy/lowdefy/commit/767f9ac8f3ae0c0ac91bdcd12761c2155b0f5ec8))
- **docs:** Add docs for GoogleSheet connection. ([8d2ff5d](https://github.com/lowdefy/lowdefy/commit/8d2ff5d0dd12064d809989023ff4a2c788b32aa6))
- **docs:** Add docs for TextArea. ([102494e](https://github.com/lowdefy/lowdefy/commit/102494ea422bf980e0b1ab82a2535faab1311605))
- **docs:** Add gutter example to layout docs. ([4929366](https://github.com/lowdefy/lowdefy/commit/492936696ed549078a1b4da32ec29f4c00533e3f))
- **docs:** Add Html and DangerousHtml to docs. ([c6fb602](https://github.com/lowdefy/lowdefy/commit/c6fb6028ca869db960a4b611df18518f9e32ee63))
- **docs:** Add Html block to docs. ([0daff90](https://github.com/lowdefy/lowdefy/commit/0daff90433f74b4132d18d1818bf931593b173ce))
- **docs:** Add Lowdefy schema concept page. ([5d6c78c](https://github.com/lowdefy/lowdefy/commit/5d6c78c6823877f1d75fd0ef4c35d54f760e6d9b))
- **docs:** Add math operator page. ([1c29bda](https://github.com/lowdefy/lowdefy/commit/1c29bdaea2865fc70244526b3d1adaaf6be4618f))
- **docs:** Add NumberInput docs. ([b05cf14](https://github.com/lowdefy/lowdefy/commit/b05cf143fe687f51938019d235710bbbcd750359))
- **docs:** Add operator docs. ([47ad077](https://github.com/lowdefy/lowdefy/commit/47ad0774465261ce3db3f3454660cd3aca0a4ef8))
- **docs:** Add operator docs. ([606346a](https://github.com/lowdefy/lowdefy/commit/606346aeaba441608b8163036f8d395095b61794))
- **docs:** Add operator docs. ([e164d7d](https://github.com/lowdefy/lowdefy/commit/e164d7d4d016218ade6096a85bc97b22733de4e4))
- **docs:** Add optionsSelector displayType. ([572a63d](https://github.com/lowdefy/lowdefy/commit/572a63d5de8a03f4e22d4a523edd118ca8bb6eb0))
- **docs:** Add Pagination to docs. ([83a96ab](https://github.com/lowdefy/lowdefy/commit/83a96ab340d52038ddee03dce554e54af476b7df))
- **docs:** Add RatingSlider to docs. ([f64e363](https://github.com/lowdefy/lowdefy/commit/f64e363691d9e1c8a2ddde92f29c7f5f5d48681e))
- **docs:** Add S3UploadButton docs. ([c024488](https://github.com/lowdefy/lowdefy/commit/c024488b6b4d71e500c480889d1116cd6ef5266f))
- **docs:** Add schemas for connections, requests, action. ([f061f96](https://github.com/lowdefy/lowdefy/commit/f061f9684e5b70b3934db34169b9a4834eb76d9f))
- **docs:** Add Switch block. ([7da2dfb](https://github.com/lowdefy/lowdefy/commit/7da2dfb092e72cc89e2b739ae1db336fed188380))
- **docs:** Add Title block. ([adaa229](https://github.com/lowdefy/lowdefy/commit/adaa229df2e5d9c138770dfe289f9cdb80e9c1b5))
- **docs:** Add TitleInput and ParagraphInput. ([3e5b239](https://github.com/lowdefy/lowdefy/commit/3e5b2393227c579ea957380b78439ff016014385))
- **docs:** Add validation to blocks. ([c841b8a](https://github.com/lowdefy/lowdefy/commit/c841b8a172ad075fc2cca178f152a0d26a6436c7))
- **docs:** Block loading. ([a64c488](https://github.com/lowdefy/lowdefy/commit/a64c4888a6ed256eb2ae2e811c9c0a90e3d46e23))
- **docs:** Context data object init. ([f757eb2](https://github.com/lowdefy/lowdefy/commit/f757eb2c22afcaf9d413aceba10b3cd12c8365ae))
- **docs:** Docs improvements ([529e924](https://github.com/lowdefy/lowdefy/commit/529e92498758abdfec345414723278cb595359f3))
- **docs:** Finalize the Lowdefy introduction. ([938e6fc](https://github.com/lowdefy/lowdefy/commit/938e6fc7b488bc430e29590e39f222098836d9fe))
- **docs:** Init Blocks concept. ([acf7a0c](https://github.com/lowdefy/lowdefy/commit/acf7a0c99e8e52824dbee111d4e2142cf53e075a))
- **docs:** Init docs. ([99cdadd](https://github.com/lowdefy/lowdefy/commit/99cdadd8247b6f114c19d5169d850a445f062bf9))
- **docs:** Make propertiesFormTransformer work with arrays. ([9967d73](https://github.com/lowdefy/lowdefy/commit/9967d731843db28e1181e132d3d5fc7fe057d124))
- **docs:** Move tutorial content from md files to page yaml file ([30f5286](https://github.com/lowdefy/lowdefy/commit/30f528610d8324b49b949119a1f62107d4967883))
- **docs:** Nest layout examples in a Collapse. ([689a8d3](https://github.com/lowdefy/lowdefy/commit/689a8d3d11f731c4348406922c8bda29dc433442))
- **docs:** Overview and operators concepts pages. ([b298dd4](https://github.com/lowdefy/lowdefy/commit/b298dd4104da85dcbee0c78b54b472dfd4feb04f))
- **docs:** TDLR for blocks. ([ef1954b](https://github.com/lowdefy/lowdefy/commit/ef1954b219330457989daa9b778b38f583fab574))
- **docs:** Update actions doc pages. ([ae01776](https://github.com/lowdefy/lowdefy/commit/ae01776b34bda10947160c5adfb98312df156593))
- **docs:** Update blocks concepts. ([19ccf72](https://github.com/lowdefy/lowdefy/commit/19ccf7232e3d0c70724655f204233128eb8a75cd))
- **docs:** Update blocks page template to use transformers ([158539e](https://github.com/lowdefy/lowdefy/commit/158539ef517c4accd35ac3f77830dd43c781bf3c))
- **docs:** Update concepts ([04bfcef](https://github.com/lowdefy/lowdefy/commit/04bfcefe15668c1f702a7351f9dbd32d649ff6bc))
- **docs:** Update Connections and Requests. ([6600773](https://github.com/lowdefy/lowdefy/commit/6600773517669f1824199fafd2d89ecbf893a4ae))
- **docs:** Update context to context-and-state ([d6b0081](https://github.com/lowdefy/lowdefy/commit/d6b00810993b24f460422af92e2745c0fb040cfd))
- **docs:** Update defaultValueTransformer to pull nested defaults from schemas. ([4ecb396](https://github.com/lowdefy/lowdefy/commit/4ecb3962ee9f4091f0e72975d816fa663940d3f8))
- **docs:** Update events-and-actions. ([a09bb11](https://github.com/lowdefy/lowdefy/commit/a09bb114f38d352cda37e26b146d29f0bcbe3923))
- **docs:** Update Layout. ([3d920e6](https://github.com/lowdefy/lowdefy/commit/3d920e61f83531eaff56303e856b6aeddee9685f))
- **docs:** Update operator docs template for methods. ([03be26f](https://github.com/lowdefy/lowdefy/commit/03be26f8feb569bcf12dfc5ac915b93d2d819427))
- **docs:** Update operator docs. ([a31009c](https://github.com/lowdefy/lowdefy/commit/a31009cd7e0a1b6b9020659ef342e7a4f23d71e2))
- **docs:** Update tutorial. ([2c9cb61](https://github.com/lowdefy/lowdefy/commit/2c9cb61c091fc415892d20a34308436145245f62))
- **docs:** Update tutorial. ([b58e95d](https://github.com/lowdefy/lowdefy/commit/b58e95dc1e6d00a6619a5a966d888448dfb962ce))
- **docs:** Use transformer fn to create properties from block schema ([faad65c](https://github.com/lowdefy/lowdefy/commit/faad65cae33e5ea92304a7fa854463a436c2557c))
- **engine:** Add support for meta.initValue to initialize block value from meta. ([5d5307c](https://github.com/lowdefy/lowdefy/commit/5d5307c82a45d7120870fae1c0abc1ea9caf5005))
- **engine:** Rename block actions to events ([bd4f7a7](https://github.com/lowdefy/lowdefy/commit/bd4f7a79e3039d2dcc9a8e0e5663d560cbc6c8bb))
- **graphql:** Rename args object to event. ([e3bb6f5](https://github.com/lowdefy/lowdefy/commit/e3bb6f50a652f76fc2b0fef44229cec5e175f5f1))
- **operators:** Add \_event operator. ([a869441](https://github.com/lowdefy/lowdefy/commit/a869441bf6fdd4cf44e6d5c03f74ea466fa6f027))
- **operators:** Add \_function operator. ([07f7e6f](https://github.com/lowdefy/lowdefy/commit/07f7e6f68ff90c742bb6fb7403bfc53cb0593cb7))
- **operators:** Add array methods that use functions. ([49f6a93](https://github.com/lowdefy/lowdefy/commit/49f6a9301e793181f7460bcdddd670969c26fd34))
- **operators:** Rename \_action_log operator to \_event_log ([dd2af60](https://github.com/lowdefy/lowdefy/commit/dd2af60f67fc095d0e5e9583764c174bae9cd062))
- Rename blocks “actions” field to “events”. ([8f2e998](https://github.com/lowdefy/lowdefy/commit/8f2e9986e72be368203c0479a28ad7c7a2511f10))
- **renderer:** Rename actions to events ([134b275](https://github.com/lowdefy/lowdefy/commit/134b2756fd7f544486d9b1f8f5b53fa566fce23f))
- **renderer:** Rename actions to events. ([601ae65](https://github.com/lowdefy/lowdefy/commit/601ae6513e9ed2d8e5b18e3c3321405fad19c281))

# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)

### Bug Fixes

- **block-tools:** Fix test snapshot. ([e70fc5c](https://github.com/lowdefy/lowdefy/commit/e70fc5c1b95cecfc2b1214f59b9ba969640a239c))
- **build:** Fix app schema test tests. ([86917c0](https://github.com/lowdefy/lowdefy/commit/86917c0f79ca75321af5d89e2f29e9328debec50))
- **build:** Fix lowdefy app schema. ([f33c151](https://github.com/lowdefy/lowdefy/commit/f33c151dfbe1a2ea55ead94c0fc6ef2573f34875))
- **graphql:** Add request deserialize tests for entire inputs. ([98cdbd8](https://github.com/lowdefy/lowdefy/commit/98cdbd895bc038ac49e75554fccf3110b9bed504))
- **graphql:** Deserialize request input variables. ([82e8475](https://github.com/lowdefy/lowdefy/commit/82e8475c2757e35adf24d489627738de736984d4))
- **graphql:** Update tests operator error message. ([c534328](https://github.com/lowdefy/lowdefy/commit/c53432827c2ba05ae4cd6ac16d94c1fa108e374a))
- **operators:** getFromObject should copy object if getting entire obj ([32f0cbc](https://github.com/lowdefy/lowdefy/commit/32f0cbcf813376ad48bd50e375065a536e8f0e35))
- **operators:** Update test error message snapshots. ([1b49ba2](https://github.com/lowdefy/lowdefy/commit/1b49ba233110265db8fb26a8f6294e6e4518b46f))
- \_lt, \_lte, \_gt, \_gte not to throw on non numerics. ([0bad71d](https://github.com/lowdefy/lowdefy/commit/0bad71d2276cdab85b37bba6ada7e859ec7f51fb))
- Temporarily log parser errors to console. ([a43b386](https://github.com/lowdefy/lowdefy/commit/a43b3860354142815e173fc6875f663e018525c7))

### Features

- **build:** Add licence field to app schema. ([a6f7c91](https://github.com/lowdefy/lowdefy/commit/a6f7c910f629884942424f0f177614ca8c3c45ae))

# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)

### Bug Fixes

- Fix location not defined. ([90f1e25](https://github.com/lowdefy/lowdefy/commit/90f1e25594f5ef9cb8f0a6c75e51809a0cb2da6d))
- Give defaultFunction to runClass and error in undefined methodName. ([38af83b](https://github.com/lowdefy/lowdefy/commit/38af83b3fc8fed64427b79ee17275585151259a8))
- Make all method operators work with runClass and runInstance. ([ef58619](https://github.com/lowdefy/lowdefy/commit/ef58619e87d7dd50d045f7dd04587209f8a7679a))
- Update error message for unsupported method. ([285a6cb](https://github.com/lowdefy/lowdefy/commit/285a6cb9284d0d07e02712004539622484797f8b))
- Update tests in engie to work with new operator format. ([4f626a1](https://github.com/lowdefy/lowdefy/commit/4f626a1c543daa0f6fa3fdb0cd6316d642e49700))
- **deps:** update apollo server packages to v2.19.1 ([#326](https://github.com/lowdefy/lowdefy/issues/326)) ([8b977e3](https://github.com/lowdefy/lowdefy/commit/8b977e363930b2c5b639fd4455751d81e3487570))
- **deps:** update dependency aws-sdk to v2.828.0 ([a94debd](https://github.com/lowdefy/lowdefy/commit/a94debd1781ad749218560076901bde6c2587016))
- **deps:** update dependency axios to v0.21.1 [security] ([99d91ed](https://github.com/lowdefy/lowdefy/commit/99d91edce62a5e7c9d98f94f12bbcc1754cee303))
- **deps:** update dependency axios to v0.21.1 [security] yarn pnp ([69807c2](https://github.com/lowdefy/lowdefy/commit/69807c2e20d4e8b460157aa1a94846606b93dcda))
- **deps:** update dependency chokidar to v3.5.0 ([#329](https://github.com/lowdefy/lowdefy/issues/329)) ([3e79f6f](https://github.com/lowdefy/lowdefy/commit/3e79f6f55419995437210f091d39775d3e6fd47d))
- **deps:** update dependency query-string to v6.13.8 ([17bdbb8](https://github.com/lowdefy/lowdefy/commit/17bdbb8ad2e67dd10c0749beb838090985f0ec66))
- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
- project operator import typo ([84ea45e](https://github.com/lowdefy/lowdefy/commit/84ea45e0c169194352a716910ecb9a3fc9312114))
- Update runInstance and runClass to cover all function types. ([bc49186](https://github.com/lowdefy/lowdefy/commit/bc491863e311f32fd30f6f46af412d5a09edd6ca))
- **cli:** add dev server port option ([744ce51](https://github.com/lowdefy/lowdefy/commit/744ce51e9f0318211764d12d82c5e47a7f93c09a))
- **deps:** update apollo server packages to v2.19.2 ([68f89d0](https://github.com/lowdefy/lowdefy/commit/68f89d0b9a131bfd031af5a95f9b71b276efa275))
- **deps:** update dependency @apollo/client to v3.3.7 ([390dbb1](https://github.com/lowdefy/lowdefy/commit/390dbb1d75a9225d4cdcb74c68e4b70aebae9d4c))
- **deps:** Update package @wojtekmaj/enzyme-adapter-react-17 to v0.4.1 ([251102e](https://github.com/lowdefy/lowdefy/commit/251102e986b3e18804a8c94dbde2e93d3a7a85e9))
- Change allowed properties and methods to Sets. ([8b91c21](https://github.com/lowdefy/lowdefy/commit/8b91c211806303ec16a07f23fea50836e91e27c6))
- Change to mingo system import file. ([a540435](https://github.com/lowdefy/lowdefy/commit/a540435870977a3274c5a057f08dbbe6dca929f4))
- Evaluate \_math using runMethod. ([3f06967](https://github.com/lowdefy/lowdefy/commit/3f06967282a456290907f30586f6e4dcdc7b94b2))
- packages/graphql/package.json to reduce vulnerabilities ([63aab05](https://github.com/lowdefy/lowdefy/commit/63aab0545dacf36d9e1a29c92a73f576565fb081))
- packages/graphql/package.json to reduce vulnerabilities ([942fa1e](https://github.com/lowdefy/lowdefy/commit/942fa1e11fd8b067dffff97319072449b1c7cdc3))
- Rename \_base64_encode and \_base64_decode to \_base64.encode and \_base64.decode. ([8ded919](https://github.com/lowdefy/lowdefy/commit/8ded919d17653852ad764d9210a9c0ae020086aa))
- Rename \_uri_encode and \_uri_decode to \_uri.encode and \_uri.decode. ([bb0e9b4](https://github.com/lowdefy/lowdefy/commit/bb0e9b4df16fa6ca89c6060d1698db76cd6720e0))

### Features

- Add \_diff operator on NodeParser. ([ea65823](https://github.com/lowdefy/lowdefy/commit/ea6582330998834deaeb6d1a5184573fb15700a3))
- Rewrite date to us runClass. ([9fe2698](https://github.com/lowdefy/lowdefy/commit/9fe2698f19b3cc622bb2da95c8c43c9df2a819d8))
- Throw error on \_divide by zero. ([3d0047d](https://github.com/lowdefy/lowdefy/commit/3d0047d8f9924d513a6cd0afd617275e4f2234ac))
- **build:** Add transformer function option to \_ref. ([27c9114](https://github.com/lowdefy/lowdefy/commit/27c9114678bcc4ba41ed42ef9e1e96a86b76cb28))
- **build:** add vars parameter to transformer function. ([c0782fe](https://github.com/lowdefy/lowdefy/commit/c0782fee22180a178ee647cfc1b700ba394b38cc))
- **cli:** Rename version field in lowdefy.yaml to lowdefy. ([51ed277](https://github.com/lowdefy/lowdefy/commit/51ed277a0525c1fd6eca426f709a50852b764ece))
- Add \_array, \_object and \_string operators. ([39197f7](https://github.com/lowdefy/lowdefy/commit/39197f760119c16ad6036259a30060a3c67f2e82))
- Add \_base64_encode and \_base64_decode operators. ([25eb55a](https://github.com/lowdefy/lowdefy/commit/25eb55a5cd920bc219d24a25126faf227068e196))
- Add \_divide operator. ([cc57d5d](https://github.com/lowdefy/lowdefy/commit/cc57d5dd01879ed019cdc190694fd54e1eb3babc))
- Add \_gt, \_gte, \_lt, \_lte operators. ([e9d3bba](https://github.com/lowdefy/lowdefy/commit/e9d3bba6ef12facc16d70d3f1bf6e0c752d0c3ad))
- Add \_if_none operator. ([6ee7e42](https://github.com/lowdefy/lowdefy/commit/6ee7e42c27dcdd2def6f73a06fd022d4a67e223c))
- Add \_json.parse and \_json.stringify to replace \_json_parse and \_json_stringify. ([b83749f](https://github.com/lowdefy/lowdefy/commit/b83749f7655eb21dcdfed57c2cb968bac45e5227))
- Add \_log operator. ([735cea0](https://github.com/lowdefy/lowdefy/commit/735cea080dbb34a0f91f6a3d112bc6e274d1a216))
- Add \_math operator. ([9c447f7](https://github.com/lowdefy/lowdefy/commit/9c447f7ebbb4d1824b97c661c65addb7fd5d4c42))
- Add \_media operator. ([fc860ad](https://github.com/lowdefy/lowdefy/commit/fc860ad7091b7b7b74c9b347a2674c98daa4feac))
- Add \_mql to replace \_mql_aggregate, \_mql_test, \_mql_expr. ([20e16bc](https://github.com/lowdefy/lowdefy/commit/20e16bc2bf18c71b7ae0dac6252966982e7c11b7))
- Add \_product operator. ([54704de](https://github.com/lowdefy/lowdefy/commit/54704de97629096118e75f5e19cb38c03024b1c0))
- Add \_random operator. ([41d1960](https://github.com/lowdefy/lowdefy/commit/41d19608b437c0cc6b81a530343dea3450b2942c))
- Add \_subtract operator. ([0f1c1c6](https://github.com/lowdefy/lowdefy/commit/0f1c1c6d8bf750b78aec38b375dbe18761553dbe))
- Add \_sum operator. ([05e5a8d](https://github.com/lowdefy/lowdefy/commit/05e5a8d44098c2433e7c2e60379e3c4f02de25c5))
- Add \_uri_encode and \_uri_decode operators. ([bdb0eb8](https://github.com/lowdefy/lowdefy/commit/bdb0eb8e49768d9f3b1f969b4503e488a2db340d))
- Add \_uuid operator to NodeParser. ([0f562fe](https://github.com/lowdefy/lowdefy/commit/0f562feff59167be3431c04cb1aa65a678eba400))
- Add .env file support for serverDev. ([d533726](https://github.com/lowdefy/lowdefy/commit/d533726993296454d8faa288ca8ea169854ce4b4))
- Add copy option to get. ([9d5b40f](https://github.com/lowdefy/lowdefy/commit/9d5b40f922c95929203b641457231af82d69b6f2))
- Allow method dot notation for operations, and parser performance improvement. ([f0c1711](https://github.com/lowdefy/lowdefy/commit/f0c171179a06152cf756542166c0c37005a7ba29))
- Ignore operator objects with more than one key. ([225a543](https://github.com/lowdefy/lowdefy/commit/225a543a1ecc27b0c624726add3b014d24cec68c))
- Rename \_parse to \_json_parse, \_stringify to \_json_stringify, \_dump_yaml to \_yaml_stringify, \_load_yaml to \_yaml_parse. ([ac6eb0a](https://github.com/lowdefy/lowdefy/commit/ac6eb0ab1af02854d93eedfdfb643f0bc664663a))
- Replace \_yaml_parse and \_yaml_stringify with \_yaml.parse and \_yaml.stringify. ([d61a316](https://github.com/lowdefy/lowdefy/commit/d61a3165631c97c075b1f8c8f0bf6285d6d8958f))
- Update default block versions to ^3.0.0. ([78f1200](https://github.com/lowdefy/lowdefy/commit/78f1200382f3d2f262ab562c6baf63c68283b692))

# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)

### Bug Fixes

- Fix location not defined. ([90f1e25](https://github.com/lowdefy/lowdefy/commit/90f1e25594f5ef9cb8f0a6c75e51809a0cb2da6d))
- Give defaultFunction to runClass and error in undefined methodName. ([38af83b](https://github.com/lowdefy/lowdefy/commit/38af83b3fc8fed64427b79ee17275585151259a8))
- Make all method operators work with runClass and runInstance. ([ef58619](https://github.com/lowdefy/lowdefy/commit/ef58619e87d7dd50d045f7dd04587209f8a7679a))
- Update error message for unsupported method. ([285a6cb](https://github.com/lowdefy/lowdefy/commit/285a6cb9284d0d07e02712004539622484797f8b))
- Update tests in engie to work with new operator format. ([4f626a1](https://github.com/lowdefy/lowdefy/commit/4f626a1c543daa0f6fa3fdb0cd6316d642e49700))
- **deps:** update apollo server packages to v2.19.1 ([#326](https://github.com/lowdefy/lowdefy/issues/326)) ([8b977e3](https://github.com/lowdefy/lowdefy/commit/8b977e363930b2c5b639fd4455751d81e3487570))
- **deps:** update dependency aws-sdk to v2.828.0 ([a94debd](https://github.com/lowdefy/lowdefy/commit/a94debd1781ad749218560076901bde6c2587016))
- **deps:** update dependency axios to v0.21.1 [security] ([99d91ed](https://github.com/lowdefy/lowdefy/commit/99d91edce62a5e7c9d98f94f12bbcc1754cee303))
- **deps:** update dependency axios to v0.21.1 [security] yarn pnp ([69807c2](https://github.com/lowdefy/lowdefy/commit/69807c2e20d4e8b460157aa1a94846606b93dcda))
- **deps:** update dependency chokidar to v3.5.0 ([#329](https://github.com/lowdefy/lowdefy/issues/329)) ([3e79f6f](https://github.com/lowdefy/lowdefy/commit/3e79f6f55419995437210f091d39775d3e6fd47d))
- **deps:** update dependency query-string to v6.13.8 ([17bdbb8](https://github.com/lowdefy/lowdefy/commit/17bdbb8ad2e67dd10c0749beb838090985f0ec66))
- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
- project operator import typo ([84ea45e](https://github.com/lowdefy/lowdefy/commit/84ea45e0c169194352a716910ecb9a3fc9312114))
- Update runInstance and runClass to cover all function types. ([bc49186](https://github.com/lowdefy/lowdefy/commit/bc491863e311f32fd30f6f46af412d5a09edd6ca))
- **cli:** add dev server port option ([744ce51](https://github.com/lowdefy/lowdefy/commit/744ce51e9f0318211764d12d82c5e47a7f93c09a))
- **deps:** update apollo server packages to v2.19.2 ([68f89d0](https://github.com/lowdefy/lowdefy/commit/68f89d0b9a131bfd031af5a95f9b71b276efa275))
- **deps:** update dependency @apollo/client to v3.3.7 ([390dbb1](https://github.com/lowdefy/lowdefy/commit/390dbb1d75a9225d4cdcb74c68e4b70aebae9d4c))
- **deps:** Update package @wojtekmaj/enzyme-adapter-react-17 to v0.4.1 ([251102e](https://github.com/lowdefy/lowdefy/commit/251102e986b3e18804a8c94dbde2e93d3a7a85e9))
- Change allowed properties and methods to Sets. ([8b91c21](https://github.com/lowdefy/lowdefy/commit/8b91c211806303ec16a07f23fea50836e91e27c6))
- Change to mingo system import file. ([a540435](https://github.com/lowdefy/lowdefy/commit/a540435870977a3274c5a057f08dbbe6dca929f4))
- Evaluate \_math using runMethod. ([3f06967](https://github.com/lowdefy/lowdefy/commit/3f06967282a456290907f30586f6e4dcdc7b94b2))
- packages/graphql/package.json to reduce vulnerabilities ([63aab05](https://github.com/lowdefy/lowdefy/commit/63aab0545dacf36d9e1a29c92a73f576565fb081))
- packages/graphql/package.json to reduce vulnerabilities ([942fa1e](https://github.com/lowdefy/lowdefy/commit/942fa1e11fd8b067dffff97319072449b1c7cdc3))
- Rename \_base64_encode and \_base64_decode to \_base64.encode and \_base64.decode. ([8ded919](https://github.com/lowdefy/lowdefy/commit/8ded919d17653852ad764d9210a9c0ae020086aa))
- Rename \_uri_encode and \_uri_decode to \_uri.encode and \_uri.decode. ([bb0e9b4](https://github.com/lowdefy/lowdefy/commit/bb0e9b4df16fa6ca89c6060d1698db76cd6720e0))

### Features

- Add \_diff operator on NodeParser. ([ea65823](https://github.com/lowdefy/lowdefy/commit/ea6582330998834deaeb6d1a5184573fb15700a3))
- Rewrite date to us runClass. ([9fe2698](https://github.com/lowdefy/lowdefy/commit/9fe2698f19b3cc622bb2da95c8c43c9df2a819d8))
- Throw error on \_divide by zero. ([3d0047d](https://github.com/lowdefy/lowdefy/commit/3d0047d8f9924d513a6cd0afd617275e4f2234ac))
- **build:** Add transformer function option to \_ref. ([27c9114](https://github.com/lowdefy/lowdefy/commit/27c9114678bcc4ba41ed42ef9e1e96a86b76cb28))
- **build:** add vars parameter to transformer function. ([c0782fe](https://github.com/lowdefy/lowdefy/commit/c0782fee22180a178ee647cfc1b700ba394b38cc))
- **cli:** Rename version field in lowdefy.yaml to lowdefy. ([51ed277](https://github.com/lowdefy/lowdefy/commit/51ed277a0525c1fd6eca426f709a50852b764ece))
- Add \_array, \_object and \_string operators. ([39197f7](https://github.com/lowdefy/lowdefy/commit/39197f760119c16ad6036259a30060a3c67f2e82))
- Add \_base64_encode and \_base64_decode operators. ([25eb55a](https://github.com/lowdefy/lowdefy/commit/25eb55a5cd920bc219d24a25126faf227068e196))
- Add \_divide operator. ([cc57d5d](https://github.com/lowdefy/lowdefy/commit/cc57d5dd01879ed019cdc190694fd54e1eb3babc))
- Add \_gt, \_gte, \_lt, \_lte operators. ([e9d3bba](https://github.com/lowdefy/lowdefy/commit/e9d3bba6ef12facc16d70d3f1bf6e0c752d0c3ad))
- Add \_if_none operator. ([6ee7e42](https://github.com/lowdefy/lowdefy/commit/6ee7e42c27dcdd2def6f73a06fd022d4a67e223c))
- Add \_json.parse and \_json.stringify to replace \_json_parse and \_json_stringify. ([b83749f](https://github.com/lowdefy/lowdefy/commit/b83749f7655eb21dcdfed57c2cb968bac45e5227))
- Add \_log operator. ([735cea0](https://github.com/lowdefy/lowdefy/commit/735cea080dbb34a0f91f6a3d112bc6e274d1a216))
- Add \_math operator. ([9c447f7](https://github.com/lowdefy/lowdefy/commit/9c447f7ebbb4d1824b97c661c65addb7fd5d4c42))
- Add \_media operator. ([fc860ad](https://github.com/lowdefy/lowdefy/commit/fc860ad7091b7b7b74c9b347a2674c98daa4feac))
- Add \_mql to replace \_mql_aggregate, \_mql_test, \_mql_expr. ([20e16bc](https://github.com/lowdefy/lowdefy/commit/20e16bc2bf18c71b7ae0dac6252966982e7c11b7))
- Add \_product operator. ([54704de](https://github.com/lowdefy/lowdefy/commit/54704de97629096118e75f5e19cb38c03024b1c0))
- Add \_random operator. ([41d1960](https://github.com/lowdefy/lowdefy/commit/41d19608b437c0cc6b81a530343dea3450b2942c))
- Add \_subtract operator. ([0f1c1c6](https://github.com/lowdefy/lowdefy/commit/0f1c1c6d8bf750b78aec38b375dbe18761553dbe))
- Add \_sum operator. ([05e5a8d](https://github.com/lowdefy/lowdefy/commit/05e5a8d44098c2433e7c2e60379e3c4f02de25c5))
- Add \_uri_encode and \_uri_decode operators. ([bdb0eb8](https://github.com/lowdefy/lowdefy/commit/bdb0eb8e49768d9f3b1f969b4503e488a2db340d))
- Add \_uuid operator to NodeParser. ([0f562fe](https://github.com/lowdefy/lowdefy/commit/0f562feff59167be3431c04cb1aa65a678eba400))
- Add .env file support for serverDev. ([d533726](https://github.com/lowdefy/lowdefy/commit/d533726993296454d8faa288ca8ea169854ce4b4))
- Add copy option to get. ([9d5b40f](https://github.com/lowdefy/lowdefy/commit/9d5b40f922c95929203b641457231af82d69b6f2))
- Allow method dot notation for operations, and parser performance improvement. ([f0c1711](https://github.com/lowdefy/lowdefy/commit/f0c171179a06152cf756542166c0c37005a7ba29))
- Ignore operator objects with more than one key. ([225a543](https://github.com/lowdefy/lowdefy/commit/225a543a1ecc27b0c624726add3b014d24cec68c))
- Rename \_parse to \_json_parse, \_stringify to \_json_stringify, \_dump_yaml to \_yaml_stringify, \_load_yaml to \_yaml_parse. ([ac6eb0a](https://github.com/lowdefy/lowdefy/commit/ac6eb0ab1af02854d93eedfdfb643f0bc664663a))
- Replace \_yaml_parse and \_yaml_stringify with \_yaml.parse and \_yaml.stringify. ([d61a316](https://github.com/lowdefy/lowdefy/commit/d61a3165631c97c075b1f8c8f0bf6285d6d8958f))
- Update default block versions to ^3.0.0. ([78f1200](https://github.com/lowdefy/lowdefy/commit/78f1200382f3d2f262ab562c6baf63c68283b692))
