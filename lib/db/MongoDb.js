'use strict';

const BluebirdPromise = require('bluebird');
const _               = require('lodash');
const plugins         = require('./plugins');

const rootPath          = process.cwd();
const defaultModelsPath = '/app/models';

class MongoDbClient {
    constructor({ uri, replicaName, modelsPath }) {
        this.uri        = uri;
        this.modelsPath = modelsPath;

        this.options = {
            replicaSet:         replicaName,
            keepAlive:          1,
            promiseLibrary:     BluebirdPromise,
            poolSize:           20,
            bufferMaxEntries:   0,
            useNewUrlParser:    true,
            useCreateIndex:     true,
            useFindAndModify:   false,
            useUnifiedTopology: true,
        };

        this.mongoose         = require('mongoose');
        this.mongoose.Promise = BluebirdPromise;
        this.models           = {};
        this.schemas          = {};
    }

    async connect() {
        await this.mongoose.connect(this.uri, this.options);
        logger.info('[mongoose driver] Connected to', this.uri);

        this.mongoose.set('debug', false);
    }

    createSchema({ schema: fields, collection, options = {} }) {
        const { sequence } = options;

        const _options = {
            ...{ versionKey: '_v', timestamps: true, id: false, collection },
            ..._.omit(options, ['sequence'])
        };

        const schema = this.mongoose.Schema(fields, _options);

        schema.collection = collection;
        schema.set('toObject', { getters: true });

        if (sequence) {
            schema.plugin(plugins.sequence, { ...sequence, ...{ mongoose: this.mongoose } });
        }

        return schema;
    }

    getSchema(modelName) {
        let schema = this.schemas[modelName];

        if (schema) {
            return schema;
        }

        const moduleName = _.camelCase(modelName);

        try {
            const modelsPath = this.modelsPath || defaultModelsPath;
            schema           = require(`${rootPath}/${modelsPath}/${moduleName}`);

        } catch (error) {
            if (error.code === 'MODULE_NOT_FOUND') {
                throw new Error(`Schema for '${modelName}' is not found`);
            }

            throw error;
        }

        this.schemas[modelName] = schema;

        return schema;
    }

    getModel(modelName) {
        if (this.models[modelName]) {
            return this.models[modelName];
        }

        const schema = this.getSchema(modelName);
        const model  = this.mongoose.model(modelName, schema);

        this.models[modelName] = model;

        return this.models[modelName];
    }
}

module.exports = class {
    static async connect(options) {
        if (!this._mongoDbClient) {
            this._mongoDbClient = new MongoDbClient(options);
        }

        await this._mongoDbClient.connect();
    }

    static Model(modelName) {
        if (!this._mongoDbClient) {
            throw new HttpError('There is no connection to the MongoDB');
        }

        return this._mongoDbClient.getModel(modelName);
    }

    static Schema(...args) {
        if (!this._mongoDbClient) {
            throw new HttpError('There is no connection to the MongoDB');
        }

        return this._mongoDbClient.createSchema(...args);
    }
};
