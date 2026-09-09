const express = require('express');
const router = express.Router();
const {suggestValidate, reviewValidate} = require('../middleware/api.middleware');
const {suggest, review} = require('../controllers/api.controller')

router.post('/suggest', suggestValidate, suggest);
router.post('/review', reviewValidate, review);

module.exports = router;