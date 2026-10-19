---
'@lowdefy/plugin-aws': patch
'@lowdefy/plugin-azure': patch
'@lowdefy/plugin-gcp': patch
---

fix(plugins): Object storage connections run under a journey data set

`AwsS3Bucket`, `AzureBlobContainer` and `GoogleCloudStorageBucket` now declare `meta: { dataSet: 'external' }`. A journey on a data set whose page reads, uploads or signs a storage file used to fail with `its type does not say how to redirect it`; the request is now sunk, as for every other outside service: it is still validated and checked, then recorded and answered with `null`, and the bucket or container never sees it. A click that reaches one of these connections is still refused by the data-set rails, as it is for every `external` type.
