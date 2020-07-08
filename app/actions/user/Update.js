'use strict';

const _          = require('lodash');
const HttpStatus = require('http-status-codes');

const { basicAuthentication } = require('../../server/middleware');

const Action = require('../../../lib/Action');
const User   = require('../../modules/User');

class Update extends Action {

    static get method() {
        return 'POST';
    }

    static get path() {
        return '/users/';
    }

    get requiredParamaters() {
        return [];
    }

    authorization() {
        return basicAuthentication(this.req);
    }

    async initialize() {
        await super.initialize();

        this.successStatus  = HttpStatus.NO_CONTENT;
        this.authorizedUser = _.get(this.req, 'requestNamespace.authorizedUser', {});
    }

    async before() {
        const { email: authorizedEmail } = this.authorizedUser;

        this.userModule  = await User.createByEmail(authorizedEmail);
        const userObject = this.userModule.toObject();

        const { password, confirmPassword } = this.parameters;

        if (password) {
            this.userModule.merge({ password });

            this.userModule.validatePassword(confirmPassword);
        }

        const { firstName, lastName, email } = this.parameters;

        this.userModule.merge({ firstName, lastName, email });

        await this.userModule.validateEmail();
        this.userModule.validateFirstName();
        this.userModule.validateLastName();

        if (!this.userModule.isValid()) {
            const error          = new Error('Validation error');
            error.httpStatusCode = HttpStatus.BAD_REQUEST;
            error.originalError  = this.userModule.getErrors();

            throw error;
        }
    }

    async action() {
        const { password } = this.parameters;

        if (password) {
            const hashPassword = await User.hashPassword(password);

            this.userModule.merge({ password: hashPassword });
        }

        return this.userModule.save();
    }
}

module.exports = Update;
