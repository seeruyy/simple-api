'use strict';

const App         = require('../lib/App');
const dropMongoDB = () => require('../lib/db/bin/drop');

module.exports = async() => {
    await dropMongoDB();
    
    const app  = await require('../app');

    if (!(app instanceof App)) {
        throw new Error('The server didn\'t start, some error occured');
    }

    global.app = app.server.express;

    require('./factories');
};
