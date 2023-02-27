require('dotenv').config()

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const userRoutes = require('./routes/user')
const plaidRoutes = require('./routes/plaid')

//express app
const app = express()

//middleware -> allows access to req.body in routes
app.use(express.json())
app.use(cors());

app.use((req,res,next)=>{
    console.log(req.path, req.method)
    next()
})

//routes
app.use('/api/plaid', plaidRoutes)
app.use('/api/user', userRoutes)

//connect to db
mongoose.set("strictQuery", false);

mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        app.listen(process.env.PORT, ()=>{
            console.log('connected to db and listening on', process.env.PORT)
        })
    })
    .catch((error)=>{
        console.log(error)
    })

