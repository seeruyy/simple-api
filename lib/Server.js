'use strict';

const _           = require('lodash');
const { resolve } = require('path');
const { readdir } = require('fs').promises;

const bodyParser = require('body-parser');
const express    = require('express');
const helmet     = require('helmet');
const noCache    = require('nocache');

class Server {
    constructor(config) {
        this._config = config;
    }

    async initialize() {
        this._express = express();

        this._express.get('/favicon.ico', (req, res) => res.status(200));

        await this._createMiddleware();
        await this._createEndpoints();
    }

    get express() {
        return this._express;
    }

    listen(callback) {
        this._express = this._express.listen(this._config.port, () => {
            logger.info(`[http] Server is listening on port ${this._config.port}`);

            callback();
        });
    }

    async _createMiddleware() {
        const bodySizeLimit = this._config.bodySizeLimit || '2mb';

        this._express.disable('etag');

        this._express.use(noCache());
        this._express.use(helmet());
        this._express.use(bodyParser.json({ limit: bodySizeLimit }));
        this._express.use(bodyParser.urlencoded({ extended: true }));
    }

    async _createEndpoints() {
        logger.info('[api] Create endpoints');

        const { actionsPath } = this._config;

        if (!actionsPath) {
            throw new Error('Missing `actionsPath` in config');
        }

        const actionsList = await this._getActions(actionsPath);

        for (const actionPath of actionsList) {
            const ActionClass      = require(actionPath);
            const { method, path } = ActionClass;

            if (!method || !path) {
                logger.warn(`Action ${actionPath} has no routing settings`);
                continue;
            }

            const apiMethod = method.toLowerCase();
            const apiPath   = resolve(this._config.basePath, path.substr(1));

            this.express[apiMethod](apiPath, async (req, res, next) => {
                const startTime = new Date().getTime();

                const actionInstance = new ActionClass();
                await actionInstance.execute(req, res);

                const actionTimestamp = new Date().toUTCString();
                const fullUrl         = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
                const executionTime   = new Date().getTime() - startTime;

                logger.log(`---- ${actionTimestamp} "${method.toUpperCase()} ${fullUrl}" - ${res.statusCode} ${res.statusMessage} in ${executionTime}ms.`);

                next();
            });
        }

    }

    async _getActions(path) {
        const dirents = await readdir(path, { withFileTypes: true });

        const files = await Promise.all(dirents.map(dirent => {
            const res = resolve(path, dirent.name);

            if (dirent.isDirectory()) {
                return this._getActions(res);
            }

            if (/.js$/.test(res)) {
                return res;
            }
        }));

        return _.compact(Array.prototype.concat(...files));
    }
}

module.exports = Server;
