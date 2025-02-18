# Change Log

## 4.4.0

### Patch Changes

- @lowdefy/helpers@4.4.0

## 4.3.2

### Patch Changes

- @lowdefy/helpers@4.3.2

## 4.3.1

### Patch Changes

- @lowdefy/helpers@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/helpers@4.3.0

## 4.2.2

### Patch Changes

- 50af1e8aa: Add MongoDbBulkWrite to MongoDBCollection requests.
  - @lowdefy/helpers@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/helpers@4.2.1

## 4.2.0

### Minor Changes

- 143c83e7d: Add request type `MongoDBBulkWrite` to the MongoDB connection.

### Patch Changes

- @lowdefy/helpers@4.2.0

## 4.1.0

### Patch Changes

- @lowdefy/helpers@4.1.0

## 4.0.2

### Patch Changes

- @lowdefy/helpers@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/helpers@4.0.1

## 4.0.0

### Patch Changes

- 66e3c1bfe: Improve property validation errors in MongoDBCollection connection.
- a8673449b: Update dependency mongodb to v6.3.0.
  - @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([2086f5d](https://github.com/lowdefy/lowdefy/commit/2086f5d2e8e5665ec5fd16ce83e59119571f833d))
- **deps:** Update dependency mongodb to v4.17.1 ([35abd12](https://github.com/lowdefy/lowdefy/commit/35abd12336d60ad316905cc19260061af7efc90e))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Patch version updates for various deps. ([64068f3](https://github.com/lowdefy/lowdefy/commit/64068f38573113e9436d638489e9435ac7f45edf))
- **deps:** Update dependency next to v13.5.4. ([230a687](https://github.com/lowdefy/lowdefy/commit/230a6876993a0802190a7f33d823fe5630062da9))
- **deps:** Update dependency next-auth to v4.23.1 ([48f9780](https://github.com/lowdefy/lowdefy/commit/48f97809e825fb9afdd169120371184b3e2a98c8))
- **plugin-mongodb:** Fix schema discription. ([5f5cca1](https://github.com/lowdefy/lowdefy/commit/5f5cca1ca6fcacd6092dd6e56620346926925ad3))
- Update to Next 13 and update Link. ([33c34c3](https://github.com/lowdefy/lowdefy/commit/33c34c3b5b10973bd749b7dc806210aa7d92dbda))

### Features

- **plugin-mongodb:** Move log-collection to community plugins. ([d526a10](https://github.com/lowdefy/lowdefy/commit/d526a10da8725e9e50de13e24d29d282a1969899))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Bug Fixes

- Fix next-auth peer dependencies. ([0a251a8](https://github.com/lowdefy/lowdefy/commit/0a251a8ff9d80bdafbe0dc38e6d0394a40699d03))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

### Bug Fixes

- **connection-mongodb:** Use Lowdefy serialiser util to serialise object ids. ([b7d5d71](https://github.com/lowdefy/lowdefy/commit/b7d5d718466c44a3c01d94359540e8e5e9def96b))

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Bug Fixes

- **connection-mongodb:** Handle upsert true on MongoDBUpdateOne ([7611bee](https://github.com/lowdefy/lowdefy/commit/7611bee1899332b6ccca03fada7cec1541d6c902))

### Features

- Add helper findLogCollectionRecordTestMongoDb ([bc590c9](https://github.com/lowdefy/lowdefy/commit/bc590c99c241f0fbb046be4e13a710070c96cba5))
- **connection-mongodb:** Add log collection tests MongoDBDeleteMany ([15a8b22](https://github.com/lowdefy/lowdefy/commit/15a8b2226828a80ab83d5cfe11c355bb3f45d576))
- **connection-mongodb:** Add log collection tests MongoDBDeleteOne ([5a1334a](https://github.com/lowdefy/lowdefy/commit/5a1334a291c0c1a2263ab0c53cb727efaf6a8693))
- **connection-mongodb:** Add log collection tests MongoDBInsertMany ([64dc0d2](https://github.com/lowdefy/lowdefy/commit/64dc0d22b8810f2ca23085770cffd61aaacb5c92))
- **connection-mongodb:** Add log collection tests MongoDBInsertOne ([a882513](https://github.com/lowdefy/lowdefy/commit/a882513a81cafcc355d212bbb9331a18dd3cc809))
- **connection-mongodb:** Add log collection tests MongoDBUpdateMany ([1b9c64b](https://github.com/lowdefy/lowdefy/commit/1b9c64bb56b7b780ea87b8bc430503386a1bac72))
- **connection-mongodb:** Add log collection tests MongoDBUpdateOne ([9a66604](https://github.com/lowdefy/lowdefy/commit/9a666042429620ff689ee19cef8b97315a795fc5))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Bug Fixes

- **deps:** update dependency next-auth to v4.20.1 [security] ([7e408a2](https://github.com/lowdefy/lowdefy/commit/7e408a2095e73dca79b9777217aec37e11d4cba3))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- Add MongoDBAdapter docs. ([c609b25](https://github.com/lowdefy/lowdefy/commit/c609b25311af8b5df250fc27b56f2fbbe6e80d49))
- **connection-mongodb:** Fix responses, fix after and update user to meta ([485c0b7](https://github.com/lowdefy/lowdefy/commit/485c0b7c11418544d3f51eceab7e75273a65fb8e))
- **connection-mongodb:** Update MongoDBUpdateOne test ([1de6f7a](https://github.com/lowdefy/lowdefy/commit/1de6f7a0fa6a1fa384d2f85a2f8a90274ff35cac))
- **deps:** Dependencies minor version updates ([e50ec30](https://github.com/lowdefy/lowdefy/commit/e50ec30a8bf7dcd38d3ca4cbf68907935939f088))
- **deps:** Update connection driver minor versions. ([bbd43c1](https://github.com/lowdefy/lowdefy/commit/bbd43c139efbb8559c279c1eea635512dbdc026c))

### Features

- Update dependency next-auth and add new providers. ([ca72d8c](https://github.com/lowdefy/lowdefy/commit/ca72d8c87b50651c701ea619a5e061210adf3e53))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

### Features

- **connection-mongodb:** Add changeLog to connection and requests. ([8e3a0b9](https://github.com/lowdefy/lowdefy/commit/8e3a0b9bc84a410f6dcf2954ba62d3e231a53672))

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

### Features

- Add Next-Auth MongoDB adapter. ([bdffb86](https://github.com/lowdefy/lowdefy/commit/bdffb86edf578c5ea603f382b237601c42e14044))

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

### Features

- Add Next-Auth MongoDB adapter. ([bdffb86](https://github.com/lowdefy/lowdefy/commit/bdffb86edf578c5ea603f382b237601c42e14044))

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Fix license typo. ([972acbb](https://github.com/lowdefy/lowdefy/commit/972acbb46b9b1113053797f82a41c5f9032dd8b0))

### Features

- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- Package Updates. ([0f9d8cd](https://github.com/lowdefy/lowdefy/commit/0f9d8cd89186e12c66e5f833c13c12472f52eaee))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- **connection-mongodb:** Add license comments in schema files. ([0872590](https://github.com/lowdefy/lowdefy/commit/08725905456a3c00d0c00ae3ed2fc5cdde2bd24e))
- **connection-mongodb:** Fix connection-mongodb plugin structure to work with version 4. ([a8b9da9](https://github.com/lowdefy/lowdefy/commit/a8b9da9707fe7aa77e64f042ac36a8efb135329b))
- **connection-mongodb:** Update dependency mongodb to v4.4.0. ([0655365](https://github.com/lowdefy/lowdefy/commit/065536568199fb5cee12d8108b910b675ac5981d))
- Fix V4 tests. ([d082d0c](https://github.com/lowdefy/lowdefy/commit/d082d0c335eb4426acadbf30a08de64266d9f004))

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

**Note:** Version bump only for package @lowdefy/connection-mongodb

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

### Features

- Update google sheets and mongodb connections to plugin structure. ([53278a3](https://github.com/lowdefy/lowdefy/commit/53278a31289a398ea2b09cce8b7ec39b5108548f))
