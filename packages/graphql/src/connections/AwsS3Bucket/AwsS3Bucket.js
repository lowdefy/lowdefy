import schema from './AwsS3BucketSchema.json';
import AwsS3PresignedGetObject from './AwsS3PresignedGetObject/AwsS3PresignedGetObject';
import AwsS3PresignedPostPolicy from './AwsS3PresignedPostPolicy/AwsS3PresignedPostPolicy';

export default {
  schema,
  requests: {
    AwsS3PresignedGetObject,
    AwsS3PresignedPostPolicy,
  },
};
