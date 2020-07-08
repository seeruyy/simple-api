'use strict';

const _          = require('lodash');
const HttpStatus = require('http-status-codes');
const User       = require('../../modules/User');
const Action     = require('../../../lib/Action');

class GetBalance extends Action {

    static get method() {
        return 'GET';
    }

    static get path() {
        return '/users/balance/:userId';
    }

    get requiredParamaters() {
        return ['userId'];
    }

    async before() {
        const { userId } = this.parameters;

        this.userModule  = await User.createById(userId);
        
        if (!this.userModule.getId()) {
            const error          = new Error('User does not exist');
            error.httpStatusCode = HttpStatus.NOT_FOUND;

            throw error;
        }
    }

    async action() {
        const balance = await this.userModule.getBalance();
        this.object   = { balance };
    }
}

module.exports = GetBalance;
