'use strict';

const HttpStatus = require('http-status-codes');
const UserModule = require('../../modules/User');

module.exports = async(req) => {
    const authorizationToken = req.header('authorization');

    if (!authorizationToken) {
        const error          = new Error('Authorization token is incorrect');
        error.httpStatusCode = HttpStatus.UNAUTHORIZED;

        throw error;
    }

    if (authorizationToken.substr(0, 5) !== 'Basic') {
        const error          = new Error('Authorization type is incorrect');
        error.httpStatusCode = HttpStatus.UNAUTHORIZED;

        throw error;
    }

    const buffer  = new Buffer.from(authorizationToken.replace('Basic ', ''), 'base64');
    const payload = buffer.toString('ascii');

    const [email, password] = payload.split(':');

    const authorizedUser = await UserModule.createByEmail(email);

    if (!authorizedUser.getId()) {
        const error          = new Error('Authentication failed');
        error.httpStatusCode = HttpStatus.FORBIDDEN;

        throw error;
    }

    const isPasswordValid = await authorizedUser.verifyPassword(password || '');

    if (!isPasswordValid) {
        const error          = new Error('Authentication failed');
        error.httpStatusCode = HttpStatus.FORBIDDEN;

        throw error;
    }

    req.requestNamespace = {
        authorizedUser: authorizedUser.toObject()
    };
};
