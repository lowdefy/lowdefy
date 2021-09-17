# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.22.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.2...v3.22.0-alpha.0) (2021-09-08)


### Bug Fixes

* **blocksAntd:** Updated Password Input tests. ([7f32230](https://github.com/lowdefy/lowdefy/commit/7f322300b7888bc3de51d36483f06a1f68d5d74e))
* **build:** Updated meta locations tests. ([9e20ace](https://github.com/lowdefy/lowdefy/commit/9e20acebaac9ae01fd3974469bddede0e651da19))


### Features

* **blocksAntd:** Card block now has an onClick event. ([4263f6b](https://github.com/lowdefy/lowdefy/commit/4263f6b8764bb147e301c3dbba0ac4986959aad8))
* **blocksAntd:** Password Input block has been added. ([9d99ef8](https://github.com/lowdefy/lowdefy/commit/9d99ef82a930adb93b022c42ef765cf8a5022c70))
* **build:** Added PasswordInput meta location. ([66abcdd](https://github.com/lowdefy/lowdefy/commit/66abcddafc7d8b1950e96a137d0d336ccf3e145b))
* **docs:** Add Stripe documentation. ([ed963ec](https://github.com/lowdefy/lowdefy/commit/ed963ec823ef19e88ed8320d71b83a7eef2e6cfe))
* **docs:** Added Password Input block docs. ([ee8bda4](https://github.com/lowdefy/lowdefy/commit/ee8bda4a5bd6248c03433a720652d72c3b9ddbae))
* **graphql:** Add Stripe connection. ([e676258](https://github.com/lowdefy/lowdefy/commit/e676258688a61b93da7267272903d02cdbb3edcb))





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
