'use strict';

const _ = require('lodash');

class Abstract {

    constructor(model) {
        this._model = model;
        this._data  = (this.model ? this.model.toObject() : undefined);

        this._uniqueKey = ((this.model && this.model.uniqueKey) ? this.model.uniqueKey() : '_id')

        this._validationErrors = [];
    }

    get model() {
        return this._model;
    }

    getId() {
        const object = this.toObject() || {};
    
        return object[this._uniqueKey];
    }

    toObject() {
        return _.cloneDeep(this._data);
    }

    // Note This method doesn't do deep merge
    merge(data = {}) {
        this._data = { ...this._data, ...data };
    }

    isValid() {
        return !this._validationErrors.length;
    }

    getErrors() {
        return this._validationErrors;
    }

    _addError({ message, code }) {
        this._validationErrors.push({ message, code });
    }

    async save() {
        const isNew = this.model.isNew;

        if (isNew) {
            await this.beforeInsert();
        } else {
            await this.beforeUpdate();
        }

        this.model.overwrite(this.toObject());

        await this.model.save();

        if (isNew) {
            await this.afterInsert();
        } else {
            await this.afterUpdate();
        }

        this._data = this.model.toObject();
    }

    beforeInsert() {}

    afterInsert() {}

    beforeUpdate() {}

    afterUpdate() {}
}

module.exports = Abstract;
