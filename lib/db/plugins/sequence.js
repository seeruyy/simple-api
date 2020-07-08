'use strict';

const _ = require('lodash');

const defaultsOptions = {
    field:       'integerId',
    startAt:     1,
    incrementBy: 1
};

module.exports = (schema, options = {}) => {
    const { mongoose } = options;

    let IdentityCounter;

    try {
        IdentityCounter = mongoose.model('IdentityCounter');

    } catch (error) {
        if (error.name === 'MissingSchemaError') {
            const counterSchema = new mongoose.Schema({
                model: { type: String, require: true },
                field: { type: String, require: true },
                count: { type: Number, default: 0 }
            });

            counterSchema.index({ field: 1, model: 1 }, { unique: true });

            IdentityCounter = mongoose.model('IdentityCounter', counterSchema);

        } else {
            throw error;

        }
    }

    const fields   = {};
    const settings = { ...defaultsOptions, ...options };

    fields[settings.field] = {
        type:    Number,
        require: true,
        unique:  true
    };

    schema.add(fields);

    schema.static('uniqueKey', () => settings.field);
    schema.method('uniqueKey', () => settings.field);

    const query = _.pick(settings, ['model', 'field']);

    const redisSequenceKey = `${settings.model}Sequence`;

    const initializeIdentityCounter = async() => {
        let counter = await IdentityCounter.findOne(query);

        if (!counter) {
            const params = _.pick(settings, ['model', 'field']);
            params.count = settings.startAt - settings.incrementBy;

            counter = new IdentityCounter(params);

            await counter.save();
        }
    };

    const initializeIdentityCounterPromise = initializeIdentityCounter();

    const nextCount = async() => {
        await initializeIdentityCounterPromise;

        const query  = _.pick(settings, ['model', 'field']);
        const params = { $inc: { count: settings.incrementBy } };

        const identityCounter = await IdentityCounter.findOneAndUpdate(query, params, { new: true });

        return identityCounter.count;
    };

    const resetCount = async() => {
        await initializeIdentityCounterPromise;

        const query  = _.pick(settings, ['model', 'field']);
        const params = { count: settings.startAt - settings.incrementBy };

        await IdentityCounter.findOneAndUpdate(query, params, { new: true });
    };

    schema.method('nextCount', nextCount);
    schema.static('nextCount', nextCount);

    schema.method('resetCount', resetCount);
    schema.static('resetCount', resetCount);

    schema.pre('save', async function(next) {
        if (this.isNew) {
            await initializeIdentityCounterPromise;

            const count = this[settings.field];

            if (count === undefined) {
                this[settings.field] = await this.nextCount();
                return;
            }

            const query          = _.pick(settings, ['model', 'field']);
            const isCountInteger = _.isNumber(count);

            if (!isCountInteger) {
                throw new Error('Auto incremented value is not a number');
            }

            query.count = { $lt: count };

            // NOTE: This operation does nothing if count is less then value
            //       stored in IdentityCounter and would raise exception if
            //       count value is not unique.
            await IdentityCounter.findOneAndUpdate(query, { count });
        }

        return next();
    });
};
