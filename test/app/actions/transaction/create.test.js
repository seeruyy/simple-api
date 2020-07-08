'use strict';

describe('Create', async() => {

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

    it('Should create a transaction with positive amountInCents', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const user         = await factory.create('User', { password: hashPassword });
        const merchant     = await factory.create('Merchant');

        const { userId }     = user;
        const { merchantId } = merchant;

        return request(app)
            .put('/api/transactions/')
            .auth(user.email, password)
            .send({ merchantId, amountInCents: 1000 })
            .expect(201)
            .then(async(res) => {
                const { status } = res.body;

                expect(status).to.be.equal('APPROVED');

                const result = await Model('Transaction').aggregate([
                    { $match: { userId } },
                    { $group: { _id: { userId: '$userId' }, sum: { $sum: '$amountInCents' } } }
                ]);

                expect(result.pop().sum).to.be.equal(1000);
            });
    });

    it('Should create a transaction with negative amountInCents', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const user         = await factory.create('User', { password: hashPassword });
        const merchant     = await factory.create('Merchant');

        const { userId }     = user;
        const { merchantId } = merchant;

        await factory.create('Transaction', { userId, merchantId, amountInCents: 1000 })

        return request(app)
            .put('/api/transactions/')
            .auth(user.email, password)
            .send({ merchantId, amountInCents: -100 })
            .expect(201)
            .then(async(res) => {
                const { status } = res.body;

                expect(status).to.be.equal('APPROVED');

                const result = await Model('Transaction').aggregate([
                    { $match: { userId } },
                    { $group: { _id: { userId: '$userId' }, sum: { $sum: '$amountInCents' } } }
                ]);

                expect(result.pop().sum).to.be.equal(900);
            });
    });

    it('Should return 403 when user does not exist', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        
        await factory.create('User', { password: hashPassword });
        
        const merchant = await factory.create('Merchant');

        const { merchantId } = merchant;

        return request(app)
            .put('/api/transactions/')
            .auth('not_existing_email@domain.com', 'NewColdPlay')
            .send({ merchantId, amountInCents: 100 })
            .expect(403)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Authentication failed');
            });
    });

    it('Should return 400 when user does not exist', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        
        const user = await factory.create('User', { password: hashPassword });
        
        await factory.create('Merchant');

        return request(app)
            .put('/api/transactions/')
            .auth(user.email, password)
            .send({ merchantId: 99999, amountInCents: 100 })
            .expect(400)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Validation error');
                expect(error.originalError).to.lengthOf(1);
                expect(error.originalError[0]).to.deep.equal({
                    message: 'The merchant does not exist',
                    code:    'MERCHANT_ID_ERROR',
                });
            });
    });

    it('Should return 400 when amountInCents is 0', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const user         = await factory.create('User', { password: hashPassword });
        const merchant     = await factory.create('Merchant');

        const { merchantId } = merchant;

        return request(app)
            .put('/api/transactions/')
            .auth(user.email, password)
            .send({ merchantId, amountInCents: 0 })
            .expect(400)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Validation error');
                expect(error.originalError).to.lengthOf(1);
                expect(error.originalError[0]).to.deep.equal({
                    message: 'amountInCents cannot be 0',
                    code:    'AMOUNT_IN_CENTS_ZERO_ERROR',
                });
            });
    });

    it('Should return 400 when amountInCents is not number', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const user         = await factory.create('User', { password: hashPassword });
        const merchant     = await factory.create('Merchant');

        const { merchantId } = merchant;

        return request(app)
            .put('/api/transactions/')
            .auth(user.email, password)
            .send({ merchantId, amountInCents: 'abc' })
            .expect(400)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Validation error');
                expect(error.originalError).to.lengthOf(1);
                expect(error.originalError[0]).to.deep.equal({
                    message: 'amountInCents is invalid',
                    code:    'AMOUNT_IN_CENTS_INCORRECT_ERROR',
                });
            });
    });

    it('Should return DECLINED when user has insufficient balance', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const user         = await factory.create('User', { password: hashPassword });
        const merchant     = await factory.create('Merchant');

        const { userId }     = user;
        const { merchantId } = merchant;

        await factory.create('Transaction', { userId, merchantId, amountInCents: 500 })
        await factory.create('Transaction', { userId, merchantId, amountInCents: -100 })

        return request(app)
            .put('/api/transactions/')
            .auth(user.email, password)
            .send({ merchantId, amountInCents: -401 })
            .expect(200)
            .then(async(response) => {
                const { status } = response.body;

                expect(status).to.be.equal('DECLINED');

                const result = await Model('Transaction').aggregate([
                    { $match: { userId } },
                    { $group: { _id: { userId: '$userId' }, sum: { $sum: '$amountInCents' } } }
                ]);

                expect(result.pop().sum).to.be.equal(400);
            });
    });

    it('Should return APPROVED when user has enough money and balance after transaction should be 0', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const user         = await factory.create('User', { password: hashPassword });
        const merchant     = await factory.create('Merchant');

        const { userId }     = user;
        const { merchantId } = merchant;

        await factory.create('Transaction', { userId, merchantId, amountInCents: 500 })
        await factory.create('Transaction', { userId, merchantId, amountInCents: -100 })

        return request(app)
            .put('/api/transactions/')
            .auth(user.email, password)
            .send({ merchantId, amountInCents: -400 })
            .expect(201)
            .then(async(response) => {
                const { status } = response.body;

                expect(status).to.be.equal('APPROVED');

                const result = await Model('Transaction').aggregate([
                    { $match: { userId } },
                    { $group: { _id: { userId: '$userId' }, sum: { $sum: '$amountInCents' } } }
                ]);

                expect(result.pop().sum).to.be.equal(0);
            });
    });
});
