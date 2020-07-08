'use strict';

const faker = require('faker');

factory.define('Merchant', Model('Merchant'), {
    name:      () => faker.company.companyName(),
    latitude:  () => faker.address.latitude(),
    longitude: () => faker.address.longitude(),
    address:   () => faker.address.streetAddress(),
});
