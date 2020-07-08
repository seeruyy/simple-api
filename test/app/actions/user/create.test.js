'use strict';

describe('Create', async() => {

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

    it('Should create user', async() => {
        const password = 'ColdPlay';

        const userParameters = await buildUserParameters({
            password,
            confirmPassword: password
        });

        return request(app)
            .put('/api/users')
            .send(userParameters)
            .expect(201)
            .then(async(response) => {
                const { body: createdUser } = response;

                const { userId, password: currentPassword } = await Model('User').findOne({ userId: createdUser.userId }).lean();

                expect(createdUser.userId).to.be.equal(userId);

                expect(createdUser.firstName).to.be.equal(userParameters.firstName);
                expect(createdUser.lastName).to.be.equal(userParameters.lastName);
                expect(createdUser.email).to.be.equal(userParameters.email);

                const isPasswordValid = await verifyUserPassword(currentPassword, password);

                expect(isPasswordValid).to.be.true;
            });
    });

    it('Should return 400 when required field missed', async() => {
        const userParameters = await buildUserParameters({
            password:        'ColdPlay',
            confirmPassword: 'ColdPlay',
        });

        const requiredFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];

        while (requiredFields.length) {
            const removedField = requiredFields.pop();

            const parameters = {...userParameters};

            delete parameters[removedField];

            await request(app)
                .put('/api/users')
                .send(parameters)
                .expect(400)
                .then(response => {
                    const { body: error } = response;

                    expect(error.message).to.be.equal('Validation error');
                    expect(error.originalError).to.lengthOf(1);
                    expect(error.originalError[0]).to.deep.equal({
                        message: `Parameter '${removedField}' is required.`,
                        code:    'REQUIRED_FIELD_MISSED',
                    });
                });
        }
    });

    it('Should return 400 with email duplicate error', async() => {
        const password    = await hashUserPassword('ColdPlay');
        const createdUser = await factory.create('User', { password });

        const userParameters = await buildUserParameters({
            email:           createdUser.email,
            password:        'ColdPlay',
            confirmPassword: 'ColdPlay',
        });

        return request(app)
            .put('/api/users')
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
        const userParameters = await buildUserParameters({
            email:           'notValidEmail@.com',
            password:        'ColdPlay',
            confirmPassword: 'ColdPlay',
        });

        return request(app)
            .put('/api/users')
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
        const userParameters = await buildUserParameters({
            firstName:       ['1'],
            password:        'ColdPlay',
            confirmPassword: 'ColdPlay',
        });

        return request(app)
            .put('/api/users')
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
        const userParameters = await buildUserParameters({
            firstName:       '',
            password:        'ColdPlay',
            confirmPassword: 'ColdPlay',
        });

        return request(app)
            .put('/api/users')
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
        const userParameters = await buildUserParameters({
            firstName:       'qwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiop1',
            password:        'ColdPlay',
            confirmPassword: 'ColdPlay',
        });

        return request(app)
            .put('/api/users')
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
        const userParameters = await buildUserParameters({
            lastName:        ['1'],
            password:        'ColdPlay',
            confirmPassword: 'ColdPlay',
        });

        return request(app)
            .put('/api/users')
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
        const userParameters = await buildUserParameters({
            lastName:        '',
            password:        'ColdPlay',
            confirmPassword: 'ColdPlay',
        });

        return request(app)
            .put('/api/users')
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
        const userParameters = await buildUserParameters({
            lastName:        'qwertyuiopqwertyuiopqwertyuiopqwertyuiopqwertyuiop1',
            password:        'ColdPlay',
            confirmPassword: 'ColdPlay',
        });

        return request(app)
            .put('/api/users')
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
        const userParameters = await buildUserParameters({
            password:        'ColdPlay',
            confirmPassword: 'ColdPlay1',
        });

        return request(app)
            .put('/api/users')
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
