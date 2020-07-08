'use strict';

const _          = require('lodash');
const HttpStatus = require('http-status-codes');
const Action     = require('../../../lib/Action');
const User       = require('../../modules/User');

class Create extends Action {

    static get method() {
        return 'PUT';
    }

    static get path() {
        return '/users/';
    }

    get requiredParamaters() {
        return ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
    }

    async initialize() {
        await super.initialize();

        this.successStatus = HttpStatus.CREATED;
    }

    async before() {
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
        } = this.parameters;

        this.userModule = User.create({
            firstName,
            lastName,
            email,
            password,
        });

        await this.userModule.validateEmail();
        this.userModule.validateFirstName();
        this.userModule.validateLastName();
        this.userModule.validatePassword(confirmPassword);

        if (!this.userModule.isValid()) {
            const error          = new Error('Validation error');
            error.httpStatusCode = HttpStatus.BAD_REQUEST;
            error.originalError  = this.userModule.getErrors();

            throw error;
        }
    }

    async action() {
        const { password } = this.userModule.toObject();
        const hashPassword = await User.hashPassword(password);

        this.userModule.merge({ password: hashPassword });

        await this.userModule.save();

        this.object = this.userModule.toObject();

        delete this.object.password;
        delete this.object.walletId;
    }

}

module.exports = Create;
