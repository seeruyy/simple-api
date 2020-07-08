'use strict';

const dropMongoDB = () => require('../lib/db/bin/drop');

const _   = require('lodash');
const fs  = require('fs');
const csv = require('csvtojson');

const App    = require('../lib/App');
const config = require('../lib/config');

const UserModule = require('../app/modules/User');

class Seed extends App {

    async _initializeServer() {
        return;
    }

    async run() {
        await super.run();
        await this.seed();

        process.exit(0);
    }

    async seed() {
        try {
            this.userMap     = {};
            this.merchantMap = {};

            await dropMongoDB();

            await this.seedTransactions();

        } catch (error) {
            logger.error(error);
            process.exit();

        }
    }

    async seedTransactions(locations) {
        const Transaction    = Model('Transaction');
        let counter          = 0;
        const insertLimit    = 1000;
        let bulkTransactions = [];

        await new Promise((resolve, reject) => {
            csv()
                .fromStream(fs.createReadStream('./seed/data/transactions.csv'))
                .subscribe(async(json) => {
                    const user     = _.pick(json, ['email', 'firstName', 'lastName', 'walletId', 'password']);
                    const merchant = _.pick(json, ['longitude', 'latitude', 'merchant', 'address']);

                    const userId     = await this.createUser(user);
                    const merchantId = await this.createMerchant(merchant);

                    const { amountInCents, createdAt: timestamp } = json;

                    const createdAt = new Date();
                    createdAt.setTime(timestamp);

                    bulkTransactions.push({
                        userId,
                        merchantId,
                        createdAt,
                        amountInCents: parseInt(amountInCents),
                    });

                    if (bulkTransactions.length >= insertLimit) {
                        await Transaction.create(bulkTransactions);
                        counter         += insertLimit;
                        bulkTransactions = [];
                        logger.log(` - Seed transactions: ${counter} documents`);
                    }
                }, reject, resolve);
        });

        if (bulkTransactions.length) {
            await Transaction.create(bulkTransactions);
            counter         += bulkTransactions.length;
            bulkTransactions = [];
            logger.log(` - Seed transactions: ${counter} documents`);
        }

        logger.log(`Finished seed transactions`);
    }

    async createUser(userData) {
        const { email, password } = userData;

        if (!this.userMap[email]) {
            const userModule   = UserModule.create(userData);
            const hashPassword = await UserModule.hashPassword(password);

            userModule.merge({ password: hashPassword });

            await userModule.save();

            this.userMap[email] = userModule.getId();
        }

        return this.userMap[email];
    }

    async createMerchant(merchantData) {
        const { merchant: name, longitude, latitude, address } = merchantData;

        if (!this.merchantMap[name]) {
            const merchant = await Model('Merchant').create({
                name,
                longitude,
                latitude,
                address
            });

            this.merchantMap[name] = merchant[merchant.uniqueKey()];
        }

        return this.merchantMap[name];
    }

}

const seed     = new Seed(config);
module.exports = seed.run();
