'use strict';

const HttpStatus = require('http-status-codes');

module.exports = (req, res, error = {}) => {
    if (!error.httpStatusCode) {
        logger.error(error);

        error = {
            message:       'Internal Server Error',
            httpStatusCode: HttpStatus.BAD_REQUEST,
        };
    }

    const { httpStatusCode, message, originalError } = error;

    res.status(httpStatusCode).json({ message, originalError });
};
