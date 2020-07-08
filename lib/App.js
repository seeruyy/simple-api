'use strict';

const _             = require('lodash');
const Server        = require('./Server');
const MongoDbClient = require('./db/MongoDb');

class App {

    constructor(config) {
        this._config = config;
    }

    get config() {
        return this._config;
    }

    get server() {
        return this._server;
    }

    get isReady() {
        return this._isReady;
    }

    async run() {
        try {
            await this.initialize();

        } catch (error) {
            this.logger.error('[app] Initialization error', error);

            process.exit(1);
        }

        if (this._server) {
            return new Promise(resolve => this._server.listen(() => {
                this._isReady = true;

                resolve(this);
            }));
        }
    }

    async initialize() {
        this._initializeLogger();
        await this._connectDatabases();
        await this._initializeServer();
    }

    _initializeLogger() {
        this.logger   = console;
        global.logger = this.logger;
    }

    async _connectDatabases() {
        await this._mongoDbConnect();
    }

    async _mongoDbConnect() {
        const mongoDbConfig = _.get(this._config, 'mongodb');

        if (mongoDbConfig) {
            await MongoDbClient.connect(mongoDbConfig);

            global.Model  = (...args) => MongoDbClient.Model(...args);
            global.Schema = (...args) => MongoDbClient.Schema(...args);
        }
    }

    async _initializeServer() {
        const serverConfig = _.get(this._config, 'server', {});

        this._server = new Server(serverConfig);

        await this._server.initialize();
    }
}

module.exports = App;
