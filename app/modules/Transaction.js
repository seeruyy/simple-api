'use strict';

const Abstract = require('./Abstract');
const User     = require('./User');
const Merchant = require('./Merchant');

class Transaction extends Abstract {

    static get model() {
        return Model('Transaction');
    }

    static create(transactionData = {}) {
        const transactionModel = new this.model(transactionData);
        return new Transaction(transactionModel);
    }

    static async getAmountInCentsSumByUserId(userId) {
        const result = await this.model.aggregate([
            { $match: { userId } },
            { $group: { _id: { userId: '$userId' }, sum: { $sum: '$amountInCents' } } }
        ]);

        if (result.length) {
            return result.pop().sum;
        }

        return 0;
    }

    async validateMerchant() {
        const { merchantId }   = this.toObject() || {};
        const doesMerchantExist = await Merchant.checkExistingById(merchantId);

        if (!doesMerchantExist) {
            this._addError({
                message: 'The merchant does not exist',
                code:    'MERCHANT_ID_ERROR'
            });
        }
    }

    async validateAmountInCents() {
        const { amountInCents } = this.toObject() || {};

        if (typeof amountInCents !== 'number') {
            return this._addError({
                message: 'amountInCents is invalid',
                code:    'AMOUNT_IN_CENTS_INCORRECT_ERROR'
            });
        }

        if (amountInCents === 0) {
            return this._addError({
                message: 'amountInCents cannot be 0',
                code:    'AMOUNT_IN_CENTS_ZERO_ERROR'
            });
        }
    }

    async validateUserBalance() {
        const { userId, amountInCents } = this.toObject() || {};

        const userModule  = await User.createById(userId);
        const userBalance = await userModule.getBalance();

        const newBalance = userBalance + amountInCents;

        if (newBalance < 0) {
            return this._addError({
                message: 'The user has insufficient balance',
                code:    'INSUFFICIENT_BALANCE_ERROR'
            });
        }
    }
}

module.exports = Transaction;
