'use strict';

const _            = require('lodash');
const HttpStatus   = require('http-status-codes');
const errorHandler = require('./errorHandler');

class Action {

    constructor(modelName) {
        this.successStatus = HttpStatus.OK;

        this._validationErrors = [];
    }

    async execute(req, res) {
        this.req = req;
        this.res = res;

        try {
            await this.authorization();

            await this.initialize();

            this.validateRequiredParameters();

            if (this.before) {
                await this.before();
            }

            await this.action();

            if (this.after) {
                await this.after();
            }

            this.success();

        } catch (error) {
            errorHandler(this.req, this.res, error);
        }
    }

    async authorization() {}

    async initialize() {
        this.parameters = {
            ...this.req.body || {},
            ...this.req.params || {}
        };
    }

    validateRequiredParameters() {
        if (!Array.isArray(this.requiredParamaters) || !this.requiredParamaters.length) {
            return;
        }

        const validationErrors = [];

        for (const fieldName of this.requiredParamaters) {
            const value = this.parameters[fieldName];

            if (value === undefined) {
                validationErrors.push({
                    message: `Parameter '${fieldName}' is required.`,
                    code:    'REQUIRED_FIELD_MISSED'
                });
            }
        }

        if (validationErrors.length) {
            const error          = new Error('Validation error');
            error.httpStatusCode = HttpStatus.BAD_REQUEST;
            error.originalError  = validationErrors;

            throw error;
        }
    }

    async action() {}

    success() {
        if (this.successStatus === HttpStatus.NO_CONTENT) {
            return this.res.set('Content-Type', 'application/json').status(this.successStatus).end();
        }

        const response = this.object || this.objects;

        this.res.status(this.successStatus).json(response);
    }
}

module.exports = Action;
