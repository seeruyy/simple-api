'use strict';

const { v4: uuidv4 } = require('uuid');
const faker          = require('faker');

factory.define('User', Model('User'), {
    userId:    () => undefined,
    email:     () => faker.internet.email().toLowerCase(),
    firstName: () => faker.name.firstName(),
    lastName:  () => faker.name.lastName(),
    walletId:  () => uuidv4(),
    password:  () => '',
});
