'use strict';

const schema = Schema({
    collection: 'transactions',
    schema:     {
        userId:        { type: Number, required: true },
        merchantId:    { type: Number, required: true },
        amountInCents: { type: Number, required: true },
    }
});

schema.index({ userId: 1 });

module.exports = schema;
