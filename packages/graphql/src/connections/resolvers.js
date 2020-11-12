import axiosHTTPS from './axios/http';
import mongodbAggregation from './mongodb/aggregation';
import mongodbDeleteOne from './mongodb/deleteOne';
import mongodbDeleteMany from './mongodb/deleteMany';
import mongodbFind from './mongodb/find';
import mongodbFindOne from './mongodb/findOne';
import mongodbInsertOne from './mongodb/insertOne';
import mongodbInsertMany from './mongodb/insertMany';
import mongodbUpdateOne from './mongodb/updateOne';
import mongodbUpdateMany from './mongodb/updateMany';
import sendGridMailSend from './sendgrid/sendGridMailSend';
import presignedPostPolicy from './s3/presignedPostPolicy';
import presignedGetObject from './s3/presignedGetObject';

const connectionMutations = {
  MongoDBAggregation: {
    resolver: mongodbAggregation,
    connectionType: 'MongoDBCollection',
  },
  MongoDBDeleteOne: {
    resolver: mongodbDeleteOne,
    connectionType: 'MongoDBCollection',
  },
  MongoDBDeleteMany: {
    resolver: mongodbDeleteMany,
    connectionType: 'MongoDBCollection',
  },
  MongoDBFind: {
    resolver: mongodbFind,
    connectionType: 'MongoDBCollection',
  },
  MongoDBFindOne: {
    resolver: mongodbFindOne,
    connectionType: 'MongoDBCollection',
  },
  MongoDBInsertOne: {
    resolver: mongodbInsertOne,
    connectionType: 'MongoDBCollection',
  },
  MongoDBInsertMany: {
    resolver: mongodbInsertMany,
    connectionType: 'MongoDBCollection',
  },
  MongoDBUpdateOne: {
    resolver: mongodbUpdateOne,
    connectionType: 'MongoDBCollection',
  },
  MongoDBUpdateMany: {
    resolver: mongodbUpdateMany,
    connectionType: 'MongoDBCollection',
  },
  AxiosHttp: {
    resolver: axiosHTTPS,
    connectionType: 'AxiosHttp',
  },
  SendGridMailSend: {
    resolver: sendGridMailSend,
    connectionType: 'SendGridMail',
  },
  AwsS3PresignedPostPolicy: {
    resolver: presignedPostPolicy,
    connectionType: 'AwsS3Bucket',
  },
  AwsS3PresignedGetObject: {
    resolver: presignedGetObject,
    connectionType: 'AwsS3Bucket',
  },
};

export default connectionMutations;
