require('dotenv').config();
const {  PlaidApi, Products} = require('plaid');
const configuration = require('../configs/plaidConfigs')
const User = require('../models/userModel')
const Transaction = require('../models/transactionModel')


const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || Products.Transactions).split(
    ',',
  );
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(
  ',',
);
const PLAID_REDIRECT_URI = process.env.PLAID_REDIRECT_URI || '';


// We store the access_token in memory - in production, store it in a secure
// persistent data store
let ACCESS_TOKEN = null;
let PUBLIC_TOKEN = null;
let ITEM_ID = null;


const client = new PlaidApi(configuration);

// Create a link token with configs which we can then use to initialize Plaid Link client-side.
// See https://plaid.com/docs/#create-link-token
const getLinkToken = async (request, response, next)=>{
      const user_id=request.user._id
      try {
        const configs = {
          user: {
            // This should correspond to a unique id for the current user.
            client_user_id: user_id,
          },
          client_name: 'Plaid Quickstart',
          products: PLAID_PRODUCTS,
          country_codes: PLAID_COUNTRY_CODES,
          language: 'en',
          
        };
  
        
        const createTokenResponse = await client.linkTokenCreate(configs);
        const link_token = createTokenResponse.data.link_token
        response.status(200).json({link_token});
      }catch(e){
        response.status(400).json({error: e.message})
      }
}

// Exchange token flow - exchange a Link public_token for
// an API access_token
// https://plaid.com/docs/#exchange-token-flow
const exchangeToken = async (request, response, next) =>{
    PUBLIC_TOKEN = request.body.public_token;
    const user_id = request.user._id
    try {
        const tokenResponse = await client.itemPublicTokenExchange({
          public_token: PUBLIC_TOKEN,
        });
        
        ACCESS_TOKEN = tokenResponse.data.access_token;
        ITEM_ID = tokenResponse.data.item_id;
        await User.settoken(user_id, ACCESS_TOKEN)
        console.log(user_id, ACCESS_TOKEN, ITEM_ID)
        response.status(200).json({
          // the 'access_token' is a private token, DO NOT pass this token to the frontend in your production environment
          access_token: ACCESS_TOKEN,
          item_id: ITEM_ID,
          error: null,
        });
      }catch(error){
        response.status(400).json({error: error.message})
      }
}

// Retrieve Transactions for an Item, in the future store item id in database to support more than one linked bank
// https://plaid.com/docs/#transactions
const getTransactions = async (request, response, next) =>{
     try{
        const {year, month} = request.params
        const pattern = "^"+year+"-"+month
        const user_id = request.user._id
        const transactions = await Transaction.find({user_id,date: {$regex:pattern} }).sort({date: -1})
        
        response.status(200).json({latest_transactions:transactions})
      }catch(error){
        response.status(400).json({error: error.message})
      }
}
const syncTransactions = async (request, response, next) =>{
  try{
     const user_id = request.user._id
     // Set cursor to empty to receive all historical updates
     let cursor = await User.getcursor(user_id);

     // New transaction updates since "cursor"
     let added = [];
     let modified = [];
     // Removed transaction ids
     let removed = [];
     let hasMore = true;
     //get access id stored in database using user id, t is the access id
     
     const access_token = await User.gettoken(user_id)
     console.log(access_token)
     // Iterate through each page of new transaction updates for item
     while (hasMore) {
       const request = {
         access_token,
         cursor,
       };
       const response = await client.transactionsSync(request)
       const data = response.data;
       
       // Add this page of results
       added = added.concat(data.added);
       modified = modified.concat(data.modified);
       removed = removed.concat(data.removed);
       hasMore = data.has_more;
       // Update cursor to the next cursor
       cursor = data.next_cursor;
       
     }
     await User.setcursor(user_id, cursor)
     
     if(added){
      await Transaction.updateTransactions(user_id, added)
     }
    
    response.status(200).json({success: 'successfully updated transactions', number: added.length})
   }catch(error){
    response.status(400).json({error: error.message})
   }
}

// Retrieve real-time Balances for each of an Item's accounts
// https://plaid.com/docs/#balance
const getBalance = async (request, response, next) =>{
    try {
        const user_id = request.user._id
        const access_token = await User.gettoken(user_id)

        const balanceResponse = await client.accountsBalanceGet({
          access_token,
        });
        
        response.status(200).json(balanceResponse.data);
      }catch(error){
        response.status(400).json({error: error.message})
      }
}
//get bank info and plaid item info
const getIdentity = async (request, response, next)=> {
    try{
      const user_id = request.user._id
      const access_token = await User.gettoken(user_id)
      const itemResponse = await client.itemGet({
        access_token,
      });
      const configs = {
        institution_id: itemResponse.data.item.institution_id,
        country_codes: PLAID_COUNTRY_CODES,
      };
      const instResponse = await client.institutionsGetById(configs);
      //console.log(itemResponse);
      response.status(200).json({
        item: itemResponse.data.item,
        institution: instResponse.data.institution,
      });
    }catch(error){
      response.status(400).json({error: error.message})
    }
    
}

module.exports={
    getLinkToken,
    exchangeToken,
    getTransactions,
    getBalance,
    syncTransactions,
    getIdentity,
}