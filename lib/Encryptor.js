'use strict';

const crypto = require('crypto');
const fs     = require('fs');

const bcrypt          = require('bcryptjs');
const BluebirdPromise = require('bluebird');
const hashAsync       = BluebirdPromise.promisify(bcrypt.hash);

class Encryptor {

    static get algorithm() {
        return 'aes-256-cfb';
    }

    static genBase64(buffer) {
        return buffer.toString('base64');
    }

    static genRandomBase64(numOfChars) {
        if (numOfChars < 1) {
            return '';
        }

        const randomBuffer       = crypto.randomBytes(numOfChars);
        const randomBufferString = this.genBase64(randomBuffer);
        const returnValue        = randomBufferString.slice(0, numOfChars);

        return returnValue;
    }

    static genIV() {
        return this.genRandomBase64(16);
    }

    static genKey() {
        return this.genRandomBase64(32);
    }

    static MD5Hash(value) {
        return crypto.createHash('md5').update(value).digest('hex');
    }

    static SHA512Hash(value) {
        return crypto.createHash('sha512').update(value).digest('hex');
    }

    static async bcryptoHash(value, key, saltRounds) {
        const iv     = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, new Buffer.from(key), iv);
        const hash   = await hashAsync(value, saltRounds);

        const encryptedHash   = Buffer.concat([cipher.update(hash), cipher.final()]);
        const ivString        = iv.toString('hex');
        const encryptedString = encryptedHash.toString('hex');

        return `${ivString}:${encryptedString}`;
    }

    static verifyBcryptoHash(value, hash, key) {
        const hashParts     = hash.split(':');
        const iv            = new Buffer.from(hashParts.shift(), 'hex');
        const encryptedHash = new Buffer.from(hashParts.join(':'), 'hex');

        let decipher;

        try {
            decipher = crypto.createDecipheriv(this.algorithm, new Buffer.from(key), iv);

        } catch (error) {
            logger.error(error);
            return false;

        }

        const decrypted = decipher.update(encryptedHash);

        let decryptedString;

        try {
            decryptedString = Buffer.concat([decrypted, decipher.final()]).toString();

        } catch (originalError) {
            const message = 'Bcrypto hash verification inconsistency, this happens when global key is changed';
            const error   = new Error(message, originalError);

            logger.error(error);

            return false;
        }

        return bcrypt.compare(value, decryptedString);
    }
}

module.exports = Encryptor;
