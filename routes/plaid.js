const express = require('express')

const requireAuth = require('../middleware/requireAuth')
const{getLinkToken, exchangeToken, getTransactions, syncTransactions, getIdentity, getBalance} = require('../controller/plaidController')

const router = express.Router()

router.use(requireAuth)

router.post('/create_link_token', getLinkToken)

router.post('/set_access_token', exchangeToken)

router.get('/transactions/:year?/:month?', getTransactions)

router.get('/update_transactions', syncTransactions)

router.get('/institution', getIdentity)

router.get('/balance', getBalance)

module.exports = router