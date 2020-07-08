'use strict';

const Abstract = require('./Abstract');

class Merchant extends Abstract {

    static get model() {
        return Model('Merchant');
    }

    static create(merchantData = {}) {
        const merchantModel = new this.model(merchantData);
        return new Merchant(merchantModel);
    }

    static async checkExistingById(merchantId) {
        return !!await this.model.countDocuments({ merchantId });
    }

}

module.exports = Merchant;
