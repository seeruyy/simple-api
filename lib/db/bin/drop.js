#!/usr/bin/env node

'use strict';

const mongodb = require('mongodb');
const config  = require('config');

const dropCollections = async() => {
    const mongoClient = await connect(config);

    return new Promise((resolve, reject) => {
        mongoClient.db().dropDatabase((err, delOK) => {
            if (err) {
                return reject(err);
            }

            if (delOK) {
                return resolve();
            }
        });
    });
};

const connect = config => {
    const { uri, replicaName } = config.mongodb;
    const options = { replicaSet: replicaName, useNewUrlParser: true, useUnifiedTopology: true };

    const MongoClient = mongodb.MongoClient;
    return MongoClient.connect(uri, options);
};

module.exports = dropCollections();
