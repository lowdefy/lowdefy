import schema from './MongoDBCollectionSchema.json';
import MongoDBAggregation from './MongoDBAggregation/MongoDBAggregation';
import MongoDBDeleteMany from './MongoDBDeleteMany/MongoDBDeleteMany';

export default {
  schema,
  requests: {
    MongoDBAggregation,
    MongoDBDeleteMany,
  },
};
