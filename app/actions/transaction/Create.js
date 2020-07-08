'use strict';

const _           = require('lodash');
const HttpStatus  = require('http-status-codes');
const Action      = require('../../../lib/Action');
const Transaction = require('../../modules/Transaction');
const User        = require('../../modules/User');
const Merchant    = require('../../modules/Merchant');

const { basicAuthentication } = require('../../server/middleware');

class Create extends Action {

    static get method() {
        return 'PUT';
    }

    static get path() {
        return '/transactions/';
    }

    get requiredParamaters() {
        return ['merchantId', 'amountInCents'];
    }

    authorization() {
        return basicAuthentication(this.req);
    }

    async initialize() {
        await super.initialize();

        this.authorizedUser = _.get(this.req, 'requestNamespace.authorizedUser', {});
    }

    async before() {
        const { userId }                    = this.authorizedUser;
        const { merchantId, amountInCents } = this.parameters;

        this.transactionModule = Transaction.create({
            userId,
            merchantId,
            amountInCents,
        });

        await this.transactionModule.validateMerchant();
        this.transactionModule.validateAmountInCents();

        if (!this.transactionModule.isValid()) {
            const error          = new Error('Validation error');
            error.httpStatusCode = HttpStatus.BAD_REQUEST;
            error.originalError  = this.transactionModule.getErrors();

            throw error;
        }
    }

    async action() {
        await this.transactionModule.validateUserBalance();

        if (!this.transactionModule.isValid()) {
            this.object = { status: 'DECLINED' };

            this.successStatus = HttpStatus.OK;

        } else {
            await this.transactionModule.save();
            this.object = { status: 'APPROVED' };

            this.successStatus = HttpStatus.CREATED;

        }
    }

}

module.exports = Create;
