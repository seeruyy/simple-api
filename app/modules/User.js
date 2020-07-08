'use strict';

const { v4: uuidv4 } = require('uuid');

const Abstract  = require('./Abstract');
const config    = require('../../lib/config');
const Encryptor = require('../../lib/Encryptor');

class User extends Abstract {

    static get model() {
        return Model('User');
    }

    static create(userData = {}) {
        const userModel = new this.model(userData);
        return new User(userModel);
    }

    static async createById(userId) {
        const user = await this.model.findOne({ userId });
        return new User(user);
    }

    static async createByEmail(email) {
        const user = await this.model.findOne({ email });
        return new User(user);
    }

    static async checkExistingById(userId) {
        return !!await this.model.countDocuments({ userId });
    }

    static async checkExistingByEmail(email, userId) {
        const query = { email };

        if (userId) {
            query.userId = { $ne: userId };
        }

        return !!await this.model.countDocuments(query);
    }

    static hashPassword(password) {
        const { masterKey, saltRounds } = config.server;

        const sha512pass = Encryptor.SHA512Hash(password);

        return Encryptor.bcryptoHash(sha512pass, masterKey, saltRounds);
    }

    async beforeInsert() {
        const { walletId } = this.toObject();

        if (!walletId) {
            this.merge({ walletId: uuidv4() });
        }
    }

    verifyPassword(password) {
        const { password: currentPassword } = this.toObject();

        const { masterKey }   = config.server;
        const currentPassHash = currentPassword;
        const sha512Password  = Encryptor.SHA512Hash(password);

        return Encryptor.verifyBcryptoHash(sha512Password, currentPassHash, masterKey);
    }

    async validateEmail() {
        const { email } = this.toObject() || {};

        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

        if (!emailRegex.test(email)) {
            this._addError({
                message: 'Email is invalid',
                code:    'INVALID_EMAIL_ERROR'
            });
        }

        const duplicateEmailExists = await User.checkExistingByEmail(email, this.getId());

        if (duplicateEmailExists) {
            this._addError({
                message: 'There is a registered user with this email',
                code:    'DUPLICATE_EMAIL_ERROR'
            });
        }
    }

    async validateFirstName() {
        const { firstName } = this.toObject() || {};

        if (typeof firstName !== 'string' || !firstName.length || firstName.length > 50) {
            this._addError({
                message: 'First Name should be a string no longer than 50 characters',
                code:    'FIRST_NAME_ERROR'
            });
        }
    }

    async validateLastName() {
        const { lastName } = this.toObject() || {};

        if (typeof lastName !== 'string' || !lastName.length || lastName.length > 50) {
            this._addError({
                message: 'Last Name should be a string no longer than 50 characters',
                code:    'LAST_NAME_ERROR'
            });
        }
    }

    async validatePassword(confirmPassword) {
        const { password } = this.toObject() || {};

        if (password !== confirmPassword) {
            this._addError({
                message: 'The password confirmation does not match the password',
                code:    'CONFIRMATION_PASSWORD_ERROR'
            });
        }
    }

    async getBalance() {
        const Transaction = require('./Transaction');

        return Transaction.getAmountInCentsSumByUserId(this.getId());
    }
}

module.exports = User;
