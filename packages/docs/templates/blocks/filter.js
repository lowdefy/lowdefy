// Stages that have been excluded from the aggregation pipeline query
__3tsoftwarelabs_disabled_aggregation_stages = [

	{
		// Stage 11 - excluded
		stage: 11,  source: {
			$project: {
			    "x": {$arrayToObject:  [ "$arr"]}
			}
		}
	},

	{
		// Stage 12 - excluded
		stage: 12,  source: {
			$match: {
			    $and: [
			//    { "value.k": { $ne: "_id"} },
			    { "value.v": { $ne: null} },
			    {"value.v": { $ne: {} }  },
			//    {$expr: {$ne: [ {$type: '$arr.v'}, "object" ] }}
			   // { $or: [ ,] }
			    ]
			    
			}
		}
	},
]

db.getCollection("test").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$project: {
			    "_id": 0,
			    "value": { "$objectToArray": "$$ROOT" }
			}
		},

		// Stage 2
		{
			$unwind: {
			    "path": "$value",
			    "includeArrayIndex": "indexL1"
			}
		},

		// Stage 3
		{
			$match: {
			    "value.k": { $ne: "_id" }
			    
			}
		},

		// Stage 4
		{
			$addFields: {
			    "value": {
			        $cond: [
			            { $eq: [ {$type: "$value.v"}, "object"] },
			            {$objectToArray: "$value.v"},
			            ["$value"]
			        ]
			    },
			    "propLevel": {
			        $cond: [
			            { $eq: [ {$type: "$value.v"}, "object"] },
			            "l2",
			            "l1"
			        ]
			    },
			    "keyL1": "$value.k",
			    "keys": ["$value.k"]
			}
		},

		// Stage 5
		{
			$unwind: {
			    "path": "$value",
			    "includeArrayIndex": "indexL2"
			}
		},

		// Stage 6
		{
			$addFields: {
			    "value": {
			        $cond: [
			            { $eq: [ {$type: "$value.v"}, "object"] },
			            {$objectToArray: "$value.v"},
			            ["$value"]
			        ]
			    },
			    "propLevel": {
			        $cond: [
			            { $eq: [ {$type: "$value.v"}, "object"] },
			            "l3",
			            "$propLevel"
			        ]
			    },
			    "keyL2": {
			        $cond: [
			            { $eq: [ "$propLevel", "l2"] },
			            "$value.k",
			            ""
			        ]
			    },
			    "keys": {
			        $cond: [
			            { $eq: [ "$propLevel", "l2"] },
			            { $concatArrays: [ "$keys", ["$value.k"] ] },
			            "$keys"
			        ]
			    }
			}
		},

		// Stage 7
		{
			$unwind: {
			    "path": "$value",
			    "includeArrayIndex": "indexL3"
			}
		},

		// Stage 8
		{
			$addFields: {
			    "keyL3": {
			        $cond: [
			            { $eq: [ "$propLevel", "l3"] },
			            "$value.k",
			            ""
			        ]
			    },
			    "keys": {
			        $cond: [
			            { $eq: [ "$propLevel", "l3"] },
			            { $concatArrays: [ "$keys", ["$value.k"] ] },
			            "$keys"
			        ]
			    }
			}
		},

		// Stage 9
		{
			$addFields: {
			    // enter query here
			    "key": {
			       $reduce: {
			         input: "$keys",
			         initialValue: "",
			         in: { 
			            $cond: [
			              { $eq: [ "$$value", "" ] },
			              "$$this",
			              { $concat: [ "$$value", ".", "$$this" ] }
			            ] 
			         } 
			       }
			    }
			}
		},

		// Stage 10
		{
			$group: {
			    _id: { 
			        "l1": "$indexL1",
			        "l2": "$indexL2",
			        "l3": "$indexL3",
			    },
			}
		},
	],

	// Options
	{

	}

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
