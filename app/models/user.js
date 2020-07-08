'use strict';

const schema = Schema({
    collection: 'users',
    schema:     {
        firstName: { type: String, required: true, maxlength: 50 },
        lastName:  { type: String, required: true, maxlength: 50 },
        email:     { type: String, required: true, maxlength: 320, lowercase: true },
        password:  { type: String, required: true },
        walletId:  { type: String, required: true },
    },
    options: {
        sequence: { model: 'User', field: 'userId' }
    }
});

schema.index({ email: 1 });

module.exports = schema;
