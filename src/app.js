const express = require('express');
const api = require('./routes/api.routes');
const app = express();

app.use(express.json());

app.use('/api', api);

module.exports = app