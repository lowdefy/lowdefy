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

import { Client }          from '@elastic/elasticsearch';
import { validate }        from '@lowdefy/ajv';
import ElasticsearchSearch from './ElasticsearchSearch';

const mockElasticsearchClient  = jest.fn( () => mockElasticsearchClient );
mockElasticsearchClient.search = jest.fn( () => mockElasticsearchClient );
jest.mock( '@elastic/elasticsearch', () => ( {
    Client: jest.fn().mockImplementation( () => mockElasticsearchClient ),
} ) );

const { resolver, schema } = ElasticsearchSearch;

const connection = {
    node:  'http://node',
    index: 'test',
};

test( 'valid request schema', () => {
    const request = {
        size:             42,
        human:            true,
        pretty:           false,
        track_total_hits: true,
        version:          false,
        _source_excludes: [ 'age' ],
        _source_includes: [ 'name' ],
        aggs:             {
            nameAggregation: {
                terms: {
                    field: 'name',
                },
            },
        },
        query:            {
            boolean: {
                should: [
                    {
                        term: {
                            name: 'foo',
                        },
                    },
                ],
            },
        },
    };
    expect( validate( { schema, data: request } ) ).toEqual( { valid: true } );
} );

test( 'valid empty request schema', () => {
    const request = {};
    expect( validate( { schema, data: request } ) ).toEqual( { valid: true } );
} );

test( 'ElasticsearchSearch with match_all query', async () => {
    const responseData = {
        body:       {
            took:         1234,
            timed_out:    false,
            _shards:      {},
            aggregations: {
                nameAggregation: {
                    doc_count_error_upper_bound: 0,
                    sum_other_doc_count:         0,
                    buckets:                     [],
                },
            },
            hits:         {
                total:     {
                    value:    10000,
                    relation: 'gte',
                },
                max_score: 1,
                hits:      [
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '1',
                        _score:  1,
                        _source: {
                            name: 'foo',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '2',
                        _score:  1,
                        _source: {
                            name: 'bar',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '3',
                        _score:  1,
                        _source: {
                            name: 'baz',
                        },
                    },
                ],
            },
        },
        statusCode: 200,
        headers:    {
            'content-type':   'application/json; charset=UTF-8',
            'content-length': '1234567',
        },
        meta:       {
            context:    null,
            request:    {},
            name:       'elasticsearch-js',
            connection: {},
            attempts:   0,
            aborted:    false,
        },
    };
    mockElasticsearchClient.search.mockImplementationOnce(
        () => Promise.resolve( responseData ),
    );
    const request = {
        size:  3,
        aggs:  {
            nameAggregation: {
                terms: {
                    field: 'name',
                },
            },
        },
        query: {
            match_all: {},
        },
    };
    await resolver( { request, connection } );
    expect( Client.mock.calls ).toEqual( [
        [
            {
                node:  'http://node',
                index: 'test',
            },
        ],
    ] );
    expect( mockElasticsearchClient.search.mock.calls ).toEqual( [
        [
            {
                body:  {
                    query: {
                        match_all: {},
                    },
                    aggs:  {
                        nameAggregation: {
                            terms: {
                                field: 'name',
                            },
                        },
                    },
                },
                index: 'test',
                size:  3,
            },
        ],
    ] );
} );

test( 'ElasticsearchSearch exposes total results', async () => {
    const responseData = {
        body:       {
            took:         1234,
            timed_out:    false,
            _shards:      {},
            aggregations: {
                nameAggregation: {
                    doc_count_error_upper_bound: 0,
                    sum_other_doc_count:         0,
                    buckets:                     [],
                },
            },
            hits:         {
                total:     {
                    value:    1234,
                    relation: 'eq',
                },
                max_score: 1,
                hits:      [
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '1',
                        _score:  1,
                        _source: {
                            name: 'foo',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '2',
                        _score:  1,
                        _source: {
                            name: 'bar',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '3',
                        _score:  1,
                        _source: {
                            name: 'baz',
                        },
                    },
                ],
            },
        },
        statusCode: 200,
        headers:    {
            'content-type':   'application/json; charset=UTF-8',
            'content-length': '1234567',
        },
        meta:       {
            context:    null,
            request:    {},
            name:       'elasticsearch-js',
            connection: {},
            attempts:   0,
            aborted:    false,
        },
    };
    mockElasticsearchClient.search.mockImplementationOnce(
        () => Promise.resolve( responseData ),
    );
    const request = {
        size:  3,
        aggs:  {
            nameAggregation: {
                terms: {
                    field: 'name',
                },
            },
        },
        query: {
            match_all: {},
        },
    };
    const res     = await resolver( { request, connection } );
    expect( Client.mock.calls ).toEqual( [
        [
            {
                node:  'http://node',
                index: 'test',
            },
        ],
    ] );
    expect( mockElasticsearchClient.search.mock.calls ).toEqual( [
        [
            {
                body:  {
                    query: {
                        match_all: {},
                    },
                    aggs:  {
                        nameAggregation: {
                            terms: {
                                field: 'name',
                            },
                        },
                    },
                },
                index: 'test',
                size:  3,
            },
        ],
    ] );
    expect( res.total ).toEqual( 1234 );
} );

test( 'ElasticsearchSearch exposes total results over 10k as Infinity', async () => {
    const responseData = {
        body:       {
            took:         1234,
            timed_out:    false,
            _shards:      {},
            aggregations: {
                nameAggregation: {
                    doc_count_error_upper_bound: 0,
                    sum_other_doc_count:         0,
                    buckets:                     [],
                },
            },
            hits:         {
                total:     {
                    value:    10000,
                    relation: 'gte',
                },
                max_score: 1,
                hits:      [
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '1',
                        _score:  1,
                        _source: {
                            name: 'foo',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '2',
                        _score:  1,
                        _source: {
                            name: 'bar',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '3',
                        _score:  1,
                        _source: {
                            name: 'baz',
                        },
                    },
                ],
            },
        },
        statusCode: 200,
        headers:    {
            'content-type':   'application/json; charset=UTF-8',
            'content-length': '1234567',
        },
        meta:       {
            context:    null,
            request:    {},
            name:       'elasticsearch-js',
            connection: {},
            attempts:   0,
            aborted:    false,
        },
    };
    mockElasticsearchClient.search.mockImplementationOnce(
        () => Promise.resolve( responseData ),
    );
    const request = {
        size:  3,
        aggs:  {
            nameAggregation: {
                terms: {
                    field: 'name',
                },
            },
        },
        query: {
            match_all: {},
        },
    };
    const res     = await resolver( { request, connection } );
    expect( Client.mock.calls ).toEqual( [
        [
            {
                node:  'http://node',
                index: 'test',
            },
        ],
    ] );
    expect( mockElasticsearchClient.search.mock.calls ).toEqual( [
        [
            {
                body:  {
                    query: {
                        match_all: {},
                    },
                    aggs:  {
                        nameAggregation: {
                            terms: {
                                field: 'name',
                            },
                        },
                    },
                },
                index: 'test',
                size:  3,
            },
        ],
    ] );
    expect( res.total ).toEqual( Infinity );
} );

test( 'ElasticsearchSearch exposes maximum score', async () => {
    const responseData = {
        body:       {
            took:         1234,
            timed_out:    false,
            _shards:      {},
            aggregations: {
                nameAggregation: {
                    doc_count_error_upper_bound: 0,
                    sum_other_doc_count:         0,
                    buckets:                     [],
                },
            },
            hits:         {
                total:     {
                    value:    10000,
                    relation: 'gte',
                },
                max_score: 42,
                hits:      [
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '1',
                        _score:  1,
                        _source: {
                            name: 'foo',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '2',
                        _score:  1,
                        _source: {
                            name: 'bar',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '3',
                        _score:  1,
                        _source: {
                            name: 'baz',
                        },
                    },
                ],
            },
        },
        statusCode: 200,
        headers:    {
            'content-type':   'application/json; charset=UTF-8',
            'content-length': '1234567',
        },
        meta:       {
            context:    null,
            request:    {},
            name:       'elasticsearch-js',
            connection: {},
            attempts:   0,
            aborted:    false,
        },
    };
    mockElasticsearchClient.search.mockImplementationOnce(
        () => Promise.resolve( responseData ),
    );
    const request = {
        size:  3,
        aggs:  {
            nameAggregation: {
                terms: {
                    field: 'name',
                },
            },
        },
        query: {
            match_all: {},
        },
    };
    const res     = await resolver( { request, connection } );
    expect( Client.mock.calls ).toEqual( [
        [
            {
                node:  'http://node',
                index: 'test',
            },
        ],
    ] );
    expect( mockElasticsearchClient.search.mock.calls ).toEqual( [
        [
            {
                body:  {
                    query: {
                        match_all: {},
                    },
                    aggs:  {
                        nameAggregation: {
                            terms: {
                                field: 'name',
                            },
                        },
                    },
                },
                index: 'test',
                size:  3,
            },
        ],
    ] );
    expect( res.maxScore ).toEqual( 42 );
} );

test( 'ElasticsearchSearch exposes aggregations', async () => {
    const responseData = {
        body:       {
            took:         1234,
            timed_out:    false,
            _shards:      {},
            aggregations: {
                nameAggregation: {
                    doc_count_error_upper_bound: 0,
                    sum_other_doc_count:         0,
                    buckets:                     [],
                },
            },
            hits:         {
                total:     {
                    value:    10000,
                    relation: 'gte',
                },
                max_score: 1,
                hits:      [
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '1',
                        _score:  1,
                        _source: {
                            name: 'foo',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '2',
                        _score:  1,
                        _source: {
                            name: 'bar',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '3',
                        _score:  1,
                        _source: {
                            name: 'baz',
                        },
                    },
                ],
            },
        },
        statusCode: 200,
        headers:    {
            'content-type':   'application/json; charset=UTF-8',
            'content-length': '1234567',
        },
        meta:       {
            context:    null,
            request:    {},
            name:       'elasticsearch-js',
            connection: {},
            attempts:   0,
            aborted:    false,
        },
    };
    mockElasticsearchClient.search.mockImplementationOnce(
        () => Promise.resolve( responseData ),
    );
    const request = {
        size:  3,
        aggs:  {
            nameAggregation: {
                terms: {
                    field: 'name',
                },
            },
        },
        query: {
            match_all: {},
        },
    };
    const res     = await resolver( { request, connection } );
    expect( Client.mock.calls ).toEqual( [
        [
            {
                node:  'http://node',
                index: 'test',
            },
        ],
    ] );
    expect( mockElasticsearchClient.search.mock.calls ).toEqual( [
        [
            {
                body:  {
                    query: {
                        match_all: {},
                    },
                    aggs:  {
                        nameAggregation: {
                            terms: {
                                field: 'name',
                            },
                        },
                    },
                },
                index: 'test',
                size:  3,
            },
        ],
    ] );
    expect( res.aggregations ).toEqual( {
        nameAggregation: {
            doc_count_error_upper_bound: 0,
            sum_other_doc_count:         0,
            buckets:                     [],
        },
    } );
} );

test( 'ElasticsearchSearch exposes original response body', async () => {
    const responseData = {
        body:       {
            took:         1234,
            timed_out:    false,
            _shards:      {},
            aggregations: {
                nameAggregation: {
                    doc_count_error_upper_bound: 0,
                    sum_other_doc_count:         0,
                    buckets:                     [],
                },
            },
            hits:         {
                total:     {
                    value:    10000,
                    relation: 'gte',
                },
                max_score: 1,
                hits:      [
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '1',
                        _score:  1,
                        _source: {
                            name: 'foo',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '2',
                        _score:  1,
                        _source: {
                            name: 'bar',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '3',
                        _score:  1,
                        _source: {
                            name: 'baz',
                        },
                    },
                ],
            },
        },
        statusCode: 200,
        headers:    {
            'content-type':   'application/json; charset=UTF-8',
            'content-length': '1234567',
        },
        meta:       {
            context:    null,
            request:    {},
            name:       'elasticsearch-js',
            connection: {},
            attempts:   0,
            aborted:    false,
        },
    };
    mockElasticsearchClient.search.mockImplementationOnce(
        () => Promise.resolve( responseData ),
    );
    const request = {
        size:  3,
        aggs:  {
            nameAggregation: {
                terms: {
                    field: 'name',
                },
            },
        },
        query: {
            match_all: {},
        },
    };
    const res     = await resolver( { request, connection } );
    expect( Client.mock.calls ).toEqual( [
        [
            {
                node:  'http://node',
                index: 'test',
            },
        ],
    ] );
    expect( mockElasticsearchClient.search.mock.calls ).toEqual( [
        [
            {
                body:  {
                    query: {
                        match_all: {},
                    },
                    aggs:  {
                        nameAggregation: {
                            terms: {
                                field: 'name',
                            },
                        },
                    },
                },
                index: 'test',
                size:  3,
            },
        ],
    ] );
    expect( res.response ).toMatchObject( responseData.body );
} );

test( 'ElasticsearchSearch result acts as an array of hits', async () => {
    const responseData = {
        body:       {
            took:         1234,
            timed_out:    false,
            _shards:      {},
            aggregations: {
                nameAggregation: {
                    doc_count_error_upper_bound: 0,
                    sum_other_doc_count:         0,
                    buckets:                     [],
                },
            },
            hits:         {
                total:     {
                    value:    10000,
                    relation: 'gte',
                },
                max_score: 1,
                hits:      [
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '1',
                        _score:  1,
                        _source: {
                            name: 'foo',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '2',
                        _score:  1,
                        _source: {
                            name: 'bar',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '3',
                        _score:  1,
                        _source: {
                            name: 'baz',
                        },
                    },
                ],
            },
        },
        statusCode: 200,
        headers:    {
            'content-type':   'application/json; charset=UTF-8',
            'content-length': '1234567',
        },
        meta:       {
            context:    null,
            request:    {},
            name:       'elasticsearch-js',
            connection: {},
            attempts:   0,
            aborted:    false,
        },
    };
    mockElasticsearchClient.search.mockImplementationOnce(
        () => Promise.resolve( responseData ),
    );
    const request = {
        size:  3,
        aggs:  {
            nameAggregation: {
                terms: {
                    field: 'name',
                },
            },
        },
        query: {
            match_all: {},
        },
    };
    const res     = await resolver( { request, connection } );
    expect( Client.mock.calls ).toEqual( [
        [
            {
                node:  'http://node',
                index: 'test',
            },
        ],
    ] );
    expect( mockElasticsearchClient.search.mock.calls ).toEqual( [
        [
            {
                body:  {
                    query: {
                        match_all: {},
                    },
                    aggs:  {
                        nameAggregation: {
                            terms: {
                                field: 'name',
                            },
                        },
                    },
                },
                index: 'test',
                size:  3,
            },
        ],
    ] );
    expect( res instanceof Array ).toBeTruthy();
    expect( res[ 0 ]._type ).toEqual( '_doc' );
    expect( res[ 0 ]._index ).toEqual( 'test' );
    expect( res[ 0 ]._score ).toEqual( 1 );
    expect( res[ 0 ]._id ).toEqual( '1' );
    expect( res[ 0 ]._source ).toEqual( { name: 'foo' } );
    expect( res.filter( () => true ) ).toEqual( [
        {
            _id:     '1',
            _index:  'test',
            _score:  1,
            _source: {
                name: 'foo',
            },
            _type:   '_doc',
            id:      '1',
            name:    'foo',
        },
        {
            _id:     '2',
            _index:  'test',
            _score:  1,
            _source: {
                name: 'bar',
            },
            _type:   '_doc',
            id:      '2',
            name:    'bar',
        },
        {
            _id:     '3',
            _index:  'test',
            _score:  1,
            _source: {
                name: 'baz',
            },
            _type:   '_doc',
            id:      '3',
            name:    'baz',
        },
    ] );
} );

test( 'ElasticsearchSearch results to proxy their _id as id', async () => {
    const responseData = {
        body:       {
            took:         1234,
            timed_out:    false,
            _shards:      {},
            aggregations: {
                nameAggregation: {
                    doc_count_error_upper_bound: 0,
                    sum_other_doc_count:         0,
                    buckets:                     [],
                },
            },
            hits:         {
                total:     {
                    value:    10000,
                    relation: 'gte',
                },
                max_score: 1,
                hits:      [
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '1',
                        _score:  1,
                        _source: {
                            name: 'foo',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '2',
                        _score:  1,
                        _source: {
                            name: 'bar',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '3',
                        _score:  1,
                        _source: {
                            name: 'baz',
                        },
                    },
                ],
            },
        },
        statusCode: 200,
        headers:    {
            'content-type':   'application/json; charset=UTF-8',
            'content-length': '1234567',
        },
        meta:       {
            context:    null,
            request:    {},
            name:       'elasticsearch-js',
            connection: {},
            attempts:   0,
            aborted:    false,
        },
    };
    mockElasticsearchClient.search.mockImplementationOnce(
        () => Promise.resolve( responseData ),
    );
    const request = {
        size:  3,
        aggs:  {
            nameAggregation: {
                terms: {
                    field: 'name',
                },
            },
        },
        query: {
            match_all: {},
        },
    };
    const res     = await resolver( { request, connection } );
    expect( Client.mock.calls ).toEqual( [
        [
            {
                node:  'http://node',
                index: 'test',
            },
        ],
    ] );
    expect( mockElasticsearchClient.search.mock.calls ).toEqual( [
        [
            {
                body:  {
                    query: {
                        match_all: {},
                    },
                    aggs:  {
                        nameAggregation: {
                            terms: {
                                field: 'name',
                            },
                        },
                    },
                },
                index: 'test',
                size:  3,
            },
        ],
    ] );
    expect( res[ 0 ].id ).toEqual( res[ 0 ]._id );
} );

test( 'ElasticsearchSearch results to proxy their _source properties', async () => {
    const responseData = {
        body:       {
            took:         1234,
            timed_out:    false,
            _shards:      {},
            aggregations: {
                nameAggregation: {
                    doc_count_error_upper_bound: 0,
                    sum_other_doc_count:         0,
                    buckets:                     [],
                },
            },
            hits:         {
                total:     {
                    value:    10000,
                    relation: 'gte',
                },
                max_score: 1,
                hits:      [
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '1',
                        _score:  1,
                        _source: {
                            name: 'foo',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '2',
                        _score:  1,
                        _source: {
                            name: 'bar',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '3',
                        _score:  1,
                        _source: {
                            name: 'baz',
                        },
                    },
                ],
            },
        },
        statusCode: 200,
        headers:    {
            'content-type':   'application/json; charset=UTF-8',
            'content-length': '1234567',
        },
        meta:       {
            context:    null,
            request:    {},
            name:       'elasticsearch-js',
            connection: {},
            attempts:   0,
            aborted:    false,
        },
    };
    mockElasticsearchClient.search.mockImplementationOnce(
        () => Promise.resolve( responseData ),
    );
    const request = {
        size:  3,
        aggs:  {
            nameAggregation: {
                terms: {
                    field: 'name',
                },
            },
        },
        query: {
            match_all: {},
        },
    };
    const res     = await resolver( { request, connection } );
    expect( Client.mock.calls ).toEqual( [
        [
            {
                node:  'http://node',
                index: 'test',
            },
        ],
    ] );
    expect( mockElasticsearchClient.search.mock.calls ).toEqual( [
        [
            {
                body:  {
                    query: {
                        match_all: {},
                    },
                    aggs:  {
                        nameAggregation: {
                            terms: {
                                field: 'name',
                            },
                        },
                    },
                },
                index: 'test',
                size:  3,
            },
        ],
    ] );
    expect( res[ 0 ].name ).toEqual( res[ 0 ]._source.name );
} );

test( 'ElasticsearchSearch with full-custom request body', async () => {
    const responseData = {
        body:       {
            took:         1234,
            timed_out:    false,
            _shards:      {},
            aggregations: {
                nameAggregation: {
                    doc_count_error_upper_bound: 0,
                    sum_other_doc_count:         0,
                    buckets:                     [],
                },
            },
            hits:         {
                total:     {
                    value:    10000,
                    relation: 'gte',
                },
                max_score: 1,
                hits:      [
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '1',
                        _score:  1,
                        _source: {
                            name: 'foo',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '2',
                        _score:  1,
                        _source: {
                            name: 'bar',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '3',
                        _score:  1,
                        _source: {
                            name: 'baz',
                        },
                    },
                ],
            },
        },
        statusCode: 200,
        headers:    {
            'content-type':   'application/json; charset=UTF-8',
            'content-length': '1234567',
        },
        meta:       {
            context:    null,
            request:    {},
            name:       'elasticsearch-js',
            connection: {},
            attempts:   0,
            aborted:    false,
        },
    };
    mockElasticsearchClient.search.mockImplementationOnce(
        () => Promise.resolve( responseData ),
    );
    const request = {
        size:  3,
        query: {
            aggs:  {
                nameAggregation: {
                    terms: {
                        field: 'name',
                    },
                },
            },
            query: {
                match_all: {},
            },
        },
    };
    const res     = await resolver( { request, connection } );
    expect( Client.mock.calls ).toEqual( [
        [
            {
                node:  'http://node',
                index: 'test',
            },
        ],
    ] );
    expect( mockElasticsearchClient.search.mock.calls ).toEqual( [
        [
            {
                body:  {
                    query: {
                        match_all: {},
                    },
                    aggs:  {
                        nameAggregation: {
                            terms: {
                                field: 'name',
                            },
                        },
                    },
                },
                index: 'test',
                size:  3,
            },
        ],
    ] );

    expect( res.total ).toEqual( Infinity );
    expect( res.maxScore ).toEqual( 1 );
    expect( res.aggregations ).toEqual( {
        nameAggregation: {
            doc_count_error_upper_bound: 0,
            sum_other_doc_count:         0,
            buckets:                     [],
        },
    } );
    expect( res.response ).toMatchObject( responseData.body );
    expect( res instanceof Array ).toBeTruthy();
    expect( res.filter( () => true ) ).toEqual( [
        {
            _id:     '1',
            _index:  'test',
            _score:  1,
            _source: {
                name: 'foo',
            },
            _type:   '_doc',
            id:      '1',
            name:    'foo',
        },
        {
            _id:     '2',
            _index:  'test',
            _score:  1,
            _source: {
                name: 'bar',
            },
            _type:   '_doc',
            id:      '2',
            name:    'bar',
        },
        {
            _id:     '3',
            _index:  'test',
            _score:  1,
            _source: {
                name: 'baz',
            },
            _type:   '_doc',
            id:      '3',
            name:    'baz',
        },
    ] );
} );

test( 'ElasticsearchSearch with full-custom request body, merged aggregations', async () => {
    const responseData = {
        body:       {
            took:         1234,
            timed_out:    false,
            _shards:      {},
            aggregations: {
                requestLevelAggregation: {
                    doc_count_error_upper_bound: 0,
                    sum_other_doc_count:         0,
                    buckets:                     [],
                },
                bodyLevelAggregation:    {
                    doc_count_error_upper_bound: 0,
                    sum_other_doc_count:         0,
                    buckets:                     [],
                },
            },
            hits:         {
                total:     {
                    value:    10000,
                    relation: 'gte',
                },
                max_score: 1,
                hits:      [
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '1',
                        _score:  1,
                        _source: {
                            name: 'foo',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '2',
                        _score:  1,
                        _source: {
                            name: 'bar',
                        },
                    },
                    {
                        _index:  'test',
                        _type:   '_doc',
                        _id:     '3',
                        _score:  1,
                        _source: {
                            name: 'baz',
                        },
                    },
                ],
            },
        },
        statusCode: 200,
        headers:    {
            'content-type':   'application/json; charset=UTF-8',
            'content-length': '1234567',
        },
        meta:       {
            context:    null,
            request:    {},
            name:       'elasticsearch-js',
            connection: {},
            attempts:   0,
            aborted:    false,
        },
    };
    mockElasticsearchClient.search.mockImplementationOnce(
        () => Promise.resolve( responseData ),
    );
    const request = {
        size:  3,
        aggs:  {
            requestLevelAggregation: {
                terms: {
                    field: 'name',
                },
            },
        },
        query: {
            aggs:  {
                bodyLevelAggregation: {
                    terms: {
                        field: 'name',
                    },
                },
            },
            query: {
                match_all: {},
            },
        },
    };
    const res     = await resolver( { request, connection } );
    expect( Client.mock.calls ).toEqual( [
        [
            {
                node:  'http://node',
                index: 'test',
            },
        ],
    ] );
    expect( mockElasticsearchClient.search.mock.calls ).toEqual( [
        [
            {
                body:  {
                    query: {
                        match_all: {},
                    },
                    aggs:  {
                        requestLevelAggregation: {
                            terms: {
                                field: 'name',
                            },
                        },
                        bodyLevelAggregation:    {
                            terms: {
                                field: 'name',
                            },
                        },
                    },
                },
                index: 'test',
                size:  3,
            },
        ],
    ] );

    expect( res.total ).toEqual( Infinity );
    expect( res.maxScore ).toEqual( 1 );
    expect( res.aggregations ).toEqual( {
        requestLevelAggregation: {
            doc_count_error_upper_bound: 0,
            sum_other_doc_count:         0,
            buckets:                     [],
        },
        bodyLevelAggregation:    {
            doc_count_error_upper_bound: 0,
            sum_other_doc_count:         0,
            buckets:                     [],
        },
    } );
    expect( res.response ).toMatchObject( responseData.body );
    expect( res instanceof Array ).toBeTruthy();
    expect( res.filter( () => true ) ).toEqual( [
        {
            _id:     '1',
            _index:  'test',
            _score:  1,
            _source: {
                name: 'foo',
            },
            _type:   '_doc',
            id:      '1',
            name:    'foo',
        },
        {
            _id:     '2',
            _index:  'test',
            _score:  1,
            _source: {
                name: 'bar',
            },
            _type:   '_doc',
            id:      '2',
            name:    'bar',
        },
        {
            _id:     '3',
            _index:  'test',
            _score:  1,
            _source: {
                name: 'baz',
            },
            _type:   '_doc',
            id:      '3',
            name:    'baz',
        },
    ] );
} );
