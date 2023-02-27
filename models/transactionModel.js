const mongoose = require('mongoose')

const Schema = mongoose.Schema

const transactionSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    amount:{
        type: Number,
        required: true
    },
    currency:{
        type: String,
        required: true
    },
    date:{
        type: String,
        required: true
    },
    category:{
        type: [String]
    },
    note:{
        type: String,
    },
    user_id:{
        type: String,
        required: true
    },
})

transactionSchema.statics.updateTransactions = async function(user_id, added){
    
    
    added.forEach( async (item)=>{
        let name = item.merchant_name || item.name
        let amount = item.amount
        let currency = item.iso_currency_code
        let date = item.date
        let category = item.category
        await this.create({name, amount, currency, date, category, user_id})
     })
    return 
}

//pluralizes the name Transaction and creates a collection Workouts
module.exports = mongoose.model('Transaction', transactionSchema)