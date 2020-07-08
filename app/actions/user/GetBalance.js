'use strict';

const _          = require('lodash');
const HttpStatus = require('http-status-codes');
const User       = require('../../modules/User');
const Action     = require('../../../lib/Action');

const { basicAuthentication } = require('../../server/middleware');

class GetBalance extends Action {

    static get method() {
        return 'GET';
    }

    static get path() {
        return '/users/balance/';
    }

    get requiredParamaters() {
        return [];
    }

    authorization() {
        return basicAuthentication(this.req);
    }

    async initialize() {
        await super.initialize();

        this.authorizedUser = _.get(this.req, 'requestNamespace.authorizedUser', {});
    }

    async before() {
        const { userId: authorizedUserId } = this.authorizedUser;

        this.userModule = await User.createById(authorizedUserId);
    }

    async action() {
        const balance = await this.userModule.getBalance();
        this.object   = { balance };
    }
}

module.exports = GetBalance;
