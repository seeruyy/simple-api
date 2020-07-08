'use strict';

describe('GetBalance', async() => {

    const Encryptor = require('../../../../lib/Encryptor');

    const hashUserPassword = password => {
        const { masterKey, saltRounds } = config.server;

        const sha512pass = Encryptor.SHA512Hash(password);

        return Encryptor.bcryptoHash(sha512pass, masterKey, saltRounds);
    }

    beforeEach(async() => {
        await Model('User').deleteMany({});
        await Model('Transaction').deleteMany({});
        await Model('Merchant').deleteMany({});
    });

    it('Should retrive positive balance', async() => {
        const password       = 'ColdPlay';
        const hashPassword   = await hashUserPassword(password);
        const user1          = await factory.create('User', { password: hashPassword });
        const user2          = await factory.create('User', { password: hashPassword });
        const merchant       = await factory.create('Merchant');

        const { merchantId } = merchant;

        await Promise.all([
            factory.create('Transaction', { userId: user1.userId, merchantId, amountInCents: 1000 }),
            factory.create('Transaction', { userId: user1.userId, merchantId, amountInCents: -100 }),

            factory.create('Transaction', { userId: user2.userId, merchantId, amountInCents: 100500 }),
            factory.create('Transaction', { userId: user2.userId, merchantId, amountInCents: -250 }),
            factory.create('Transaction', { userId: user2.userId, merchantId, amountInCents: -250 }),
        ]);

        return request(app)
            .get('/api/users/balance/')
            .auth(user2.email, password)
            .expect(200)
            .then(async(res) => {
                const { balance } = res.body;

                expect(balance).to.be.equal(100000);
            });
    });

    it('Should retrive positive balance', async() => {
        const password       = 'ColdPlay';
        const hashPassword   = await hashUserPassword(password);
        const user1          = await factory.create('User', { password: hashPassword });
        const user2          = await factory.create('User', { password: hashPassword });
        const merchant       = await factory.create('Merchant');

        const { merchantId } = merchant;

        await Promise.all([
            factory.create('Transaction', { userId: user1.userId, merchantId, amountInCents: 1000 }),
            factory.create('Transaction', { userId: user1.userId, merchantId, amountInCents: -100 }),

            factory.create('Transaction', { userId: user2.userId, merchantId, amountInCents: 1000 }),
            factory.create('Transaction', { userId: user2.userId, merchantId, amountInCents: -250 }),
            factory.create('Transaction', { userId: user2.userId, merchantId, amountInCents: -250 }),
            factory.create('Transaction', { userId: user2.userId, merchantId, amountInCents: -800 }),
        ]);

        return request(app)
            .get('/api/users/balance/')
            .auth(user2.email, password)
            .expect(200)
            .then(async(res) => {
                const { balance } = res.body;

                expect(balance).to.be.equal(-300);
            });
    });

    it('Should retrive 0 balance', async() => {
        const password       = 'ColdPlay';
        const hashPassword   = await hashUserPassword(password);
        const user1          = await factory.create('User', { password: hashPassword });
        const user2          = await factory.create('User', { password: hashPassword });
        const merchant       = await factory.create('Merchant');

        const { merchantId } = merchant;

        await Promise.all([
            factory.create('Transaction', { userId: user1.userId, merchantId, amountInCents: 1000 }),
            factory.create('Transaction', { userId: user1.userId, merchantId, amountInCents: -100 }),
        ]);

        return request(app)
            .get('/api/users/balance/')
            .auth(user2.email, password)
            .expect(200)
            .then(async(res) => {
                const { balance } = res.body;

                expect(balance).to.be.equal(0);
            });
    });

    it('Should return 403 when user does not exist', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);

        await factory.create('User', { password: hashPassword });

        return request(app)
            .get('/api/users/balance/')
            .auth('not_existing_email@domain.com', 'NewColdPlay')
            .expect(403)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Authentication failed');
            });
    });
});
