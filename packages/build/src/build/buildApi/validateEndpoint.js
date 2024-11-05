import { type } from '@lowdefy/helpers';

function validateEndpoint({ endpoint, index, checkDuplicateEndpointId }) {
  if (type.isUndefined(endpoint.id)) {
    throw new Error(`Endpoint id missing at endpoint ${index}.`);
  }
  if (!type.isString(endpoint.id)) {
    throw new Error(
      `Endpoint id is not a string at endpoint ${index}. Received ${JSON.stringify(endpoint.id)}.`
    );
  }
  if (endpoint.id.includes('.')) {
    throw new Error(
      `Endpoint id "${endpoint.id}" at endpoint "${endpoint.id}" should not include a period (".").`
    );
  }
  if (type.isUndefined(endpoint.type)) {
    throw new Error(
      `Endpoint type is not defined at "${endpoint.id}" on endpoint "${endpoint.id}".`
    );
  }
  if (!type.isString(endpoint.type)) {
    throw new Error(
      `Endpoint type is not a string at "${endpoint.id}" on endpoint "${
        endpoint.id
      }". Received ${JSON.stringify(endpoint.type)}.`
    );
  }
  checkDuplicateEndpointId({ id: endpoint.id });
}

export default validateEndpoint;
