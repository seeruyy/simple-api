'use strict';

describe('Update', async() => {

    const Encryptor = require('../../../../lib/Encryptor');

    const buildUserParameters = async(parameters = {}) => {
        const userParameters = {
            ...await factory.attrs('User'),
            ...parameters
        };

        delete userParameters.userId;
        delete userParameters.walletId;

        return userParameters;
    }

    const verifyUserPassword = (sourcePassword, verifiablePassword) => {
        const { masterKey }   = config.server;
        const currentPassHash = sourcePassword;
        const sha512Password  = Encryptor.SHA512Hash(verifiablePassword);

        return Encryptor.verifyBcryptoHash(sha512Password, currentPassHash, masterKey);
    }

    const hashUserPassword = password => {
        const { masterKey, saltRounds } = config.server;

        const sha512pass = Encryptor.SHA512Hash(password);

        return Encryptor.bcryptoHash(sha512pass, masterKey, saltRounds);
    }

    beforeEach(async() => {
        await Model('User').deleteMany({});
    });

    it('Should update user', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser  = await factory.create('User', { password: hashPassword });
        const { userId }   = createdUser;
        const newPassword  = 'NewColdPlay';

        const userParameters = await buildUserParameters({
            password:        newPassword,
            confirmPassword: newPassword,
        });

        return request(app)
            .post('/api/users/')
            .auth(createdUser.email, password)
            .send(userParameters)
            .expect(204)
            .then(async(res) => {
                const updatedUser = await Model('User').findOne({ userId }).lean();

                expect(updatedUser.firstName).to.be.equal(userParameters.firstName);
                expect(updatedUser.lastName).to.be.equal(userParameters.lastName);
                expect(updatedUser.email).to.be.equal(userParameters.email);

                const isPasswordValid = await verifyUserPassword(updatedUser.password, newPassword);

                expect(isPasswordValid).to.be.true;
            });
    });

    it('Should update user with same email', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser  = await factory.create('User', { password: hashPassword });
        const { userId }   = createdUser;

        const userParameters = await buildUserParameters({
            email: createdUser.email,
        });

        return request(app)
            .post('/api/users/')
            .auth(createdUser.email, password)
            .send(userParameters)
            .expect(204)
            .then(async(res) => {
                const updatedUser = await Model('User').findOne({ userId }).lean();

                expect(updatedUser.firstName).to.be.equal(userParameters.firstName);
                expect(updatedUser.lastName).to.be.equal(userParameters.lastName);
                expect(updatedUser.email).to.be.equal(userParameters.email);

                const isPasswordValid = await verifyUserPassword(updatedUser.password, password);

                expect(isPasswordValid).to.be.true;
            });
    });

    it('Should return 401 when authentication token missed', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser  = await factory.create('User', { password: hashPassword });
        const { userId }   = createdUser;
        const newPassword  = 'NewColdPlay';

        const userParameters = await buildUserParameters({
            password:        newPassword,
            confirmPassword: newPassword,
        });

        return request(app)
            .post('/api/users/')
            .send(userParameters)
            .expect(401)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Authorization token is incorrect');
            });
    });

    it('Should return 401 when authentication type is incorrect', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser  = await factory.create('User', { password: hashPassword });
        const { userId }   = createdUser;
        const newPassword  = 'NewColdPlay';

        const userParameters = await buildUserParameters({
            password:        newPassword,
            confirmPassword: newPassword,
        });

        return request(app)
            .post('/api/users/')
            .set('Authorization', 'Bearer 1234567890')
            .send(userParameters)
            .expect(401)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Authorization type is incorrect');
            });
    });

    it('Should return 401 when user does not exist', async() => {
        const userParameters = await buildUserParameters({
            password:        'NewColdPlay',
            confirmPassword: 'NewColdPlay',
        });

        return request(app)
            .post(`/api/users/`)
            .auth('not_existing_email@domain.com', 'NewColdPlay')
            .send(userParameters)
            .expect(403)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Authentication failed');
            });
    });

    it('Should return 401 when password is incorrect', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser  = await factory.create('User', { password: hashPassword });
        const { userId }   = createdUser;
        const newPassword  = 'NewColdPlay';

        const userParameters = await buildUserParameters({
            password:        newPassword,
            confirmPassword: newPassword,
        });

        return request(app)
            .post('/api/users/')
            .auth(createdUser.email, 'incorrectPassword')
            .send(userParameters)
            .expect(403)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Authentication failed');
            });
    });

    it('Should return 400 with email duplicate error', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser1 = await factory.create('User', { password: hashPassword });
        const createdUser2 = await factory.create('User', { password: hashPassword });

        const userParameters = await buildUserParameters({
            email: createdUser2.email,
        });

        return request(app)
            .post('/api/users')
            .auth(createdUser1.email, password)
            .send(userParameters)
            .expect(400)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Validation error');
                expect(error.originalError).to.lengthOf(1);
                expect(error.originalError[0]).to.deep.equal({
                    message: 'There is a registered user with this email',
                    code:    'DUPLICATE_EMAIL_ERROR',
                });
            });
    });

    it('Should return 400 when email is invalid', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser  = await factory.create('User', { password: hashPassword });

        const userParameters = await buildUserParameters({
            email: 'notValidEmail@.com'
        });

        return request(app)
            .post('/api/users')
            .auth(createdUser.email, password)
            .send(userParameters)
            .expect(400)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Validation error');
                expect(error.originalError).to.lengthOf(1);
                expect(error.originalError[0]).to.deep.equal({
                    message: 'Email is invalid',
                    code:    'INVALID_EMAIL_ERROR',
                });
            });
    });

    it('Should return 400 when firstName is not string', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser  = await factory.create('User', { password: hashPassword });

        const userParameters = await buildUserParameters({
            firstName: ['1']
        });

        return request(app)
            .post('/api/users')
            .auth(createdUser.email, password)
            .send(userParameters)
            .expect(400)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Validation error');
                expect(error.originalError).to.lengthOf(1);
                expect(error.originalError[0]).to.deep.equal({
                    message: 'First Name should be a string no longer than 50 characters',
                    code:    'FIRST_NAME_ERROR',
                });
            });
    });

    it('Should return 400 when firstName is empty', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser  = await factory.create('User', { password: hashPassword });

        const userParameters = await buildUserParameters({
            firstName: ''
        });

        return request(app)
            .post('/api/users')
            .auth(createdUser.email, password)
            .send(userParameters)
            .expect(400)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Validation error');
                expect(error.originalError).to.lengthOf(1);
                expect(error.originalError[0]).to.deep.equal({
                    message: 'First Name should be a string no longer than 50 characters',
                    code:    'FIRST_NAME_ERROR',
                });
            });
    });

    it('Should return 400 when firstName is more then 50 characters', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser  = await factory.create('User', { password: hashPassword });

        const userParameters = await buildUserParameters({
            firstName: 'qwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiop1'
        });

        return request(app)
            .post('/api/users')
            .auth(createdUser.email, password)
            .send(userParameters)
            .expect(400)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Validation error');
                expect(error.originalError).to.lengthOf(1);
                expect(error.originalError[0]).to.deep.equal({
                    message: 'First Name should be a string no longer than 50 characters',
                    code:    'FIRST_NAME_ERROR',
                });
            });
    });

    it('Should return 400 when lastName is not string', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser  = await factory.create('User', { password: hashPassword });

        const userParameters = await buildUserParameters({
            lastName: ['1']
        });

        return request(app)
            .post('/api/users')
            .auth(createdUser.email, password)
            .send(userParameters)
            .expect(400)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Validation error');
                expect(error.originalError).to.lengthOf(1);
                expect(error.originalError[0]).to.deep.equal({
                    message: 'Last Name should be a string no longer than 50 characters',
                    code:    'LAST_NAME_ERROR',
                });
            });
    });

    it('Should return 400 when lastName is empty', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser  = await factory.create('User', { password: hashPassword });

        const userParameters = await buildUserParameters({
            lastName: ''
        });

        return request(app)
            .post('/api/users')
            .auth(createdUser.email, password)
            .send(userParameters)
            .expect(400)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Validation error');
                expect(error.originalError).to.lengthOf(1);
                expect(error.originalError[0]).to.deep.equal({
                    message: 'Last Name should be a string no longer than 50 characters',
                    code:    'LAST_NAME_ERROR',
                });
            });
    });

    it('Should return 400 when lastName is more then 50 characters', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser  = await factory.create('User', { password: hashPassword });

        const userParameters = await buildUserParameters({
            lastName: 'qwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiop1'
        });

        return request(app)
            .post('/api/users')
            .auth(createdUser.email, password)
            .send(userParameters)
            .expect(400)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Validation error');
                expect(error.originalError).to.lengthOf(1);
                expect(error.originalError[0]).to.deep.equal({
                    message: 'Last Name should be a string no longer than 50 characters',
                    code:    'LAST_NAME_ERROR',
                });
            });
    });

    it('Should return 400 when confirmationPassword does not match password', async() => {
        const password     = 'ColdPlay';
        const hashPassword = await hashUserPassword(password);
        const createdUser  = await factory.create('User', { password: hashPassword });

        const userParameters = await buildUserParameters({
            password:        'ColdPlay',
            confirmPassword: 'ColdPlay1',
        });

        return request(app)
            .post('/api/users')
            .auth(createdUser.email, password)
            .send(userParameters)
            .expect(400)
            .then(response => {
                const { body: error } = response;

                expect(error.message).to.be.equal('Validation error');
                expect(error.originalError).to.lengthOf(1);
                expect(error.originalError[0]).to.deep.equal({
                    message: 'The password confirmation does not match the password',
                    code:    'CONFIRMATION_PASSWORD_ERROR',
                });
            });
    });
});
