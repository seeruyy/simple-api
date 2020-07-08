'use strict';

const faker = require('faker');

factory.define('Transaction', Model('Transaction'), {
    userId:        () => 1,
    merchantId:    () => 1,
    amountInCents: () => 1,
});
