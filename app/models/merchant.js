'use strict';

const schema = Schema({
    collection: 'merchants',
    schema:     {
        name:      { type: String, required: true },
        latitude:  { type: Number, required: true },
        longitude: { type: Number, required: true },
        address:   { type: String },
    },
    options: {
        sequence: { model: 'Merchant', field: 'merchantId' }
    }
});

schema.index({ name: 1 });

module.exports = schema;
