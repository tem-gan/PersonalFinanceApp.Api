const mongoose = require('mongoose')
const bcrypt =require('bcrypt')
const validator = require('validator')

const Schema = mongoose.Schema

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    access_id:{
        type: String,
    },
    cursor:{
        type:String,
    },
})

//static signup method
userSchema.statics.signup = async function(email, password){

    //email and password validation
    if(!email ||!password){
        throw Error('All fields must be filled')
    }
    //validator package
    if(!validator.isEmail(email)){
        throw Error('Email is not valid')
    }
    if(!validator.isStrongPassword(password)){
        throw Error('Password is not strong enough')
    }

    const exists = await this.findOne({email})
    if(exists){
        throw Error('Email already in use')
    }
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = await this.create({email, password: hash})

    return user
}
//static login method
userSchema.statics.login = async function(email, password){
    //email and password validation
    if(!email ||!password){
        throw Error('All fields must be filled')
    }

    const user = await this.findOne({email})

    if(!user){
        throw Error('Incorrect email')
    }
    const match = await bcrypt.compare(password, user.password)

    if(!match){
        throw Error('Incorrect password')
    }
    return user
}
userSchema.statics.settoken = async function(id, token){
    const exists = await this.findById({_id:id})
    if(!exists){
        throw Error('no  such user')
    }
    if(!id){
        throw Error('no id or token')
    }
    const user = await this.findOneAndUpdate({_id:id},{access_id:token})
    return user
}
userSchema.statics.gettoken = async function(id){
    const token = await this.findById({_id: id}).select('access_id -_id')
    return token.access_id
}
userSchema.statics.getcursor = async function(id){
    const data = await this.findById({_id: id}).select('cursor -_id')
    if(!data){
        return null
    }
    return data.cursor
}
userSchema.statics.setcursor = async function(id, cursor){
    const exists = await this.findById({_id:id})
    if(!exists){
        throw Error('no  such user')
    }
    if(!id){
        throw Error('no id or token')
    }
    const user = await this.findOneAndUpdate({_id:id},{cursor})
    return user
}
//pluralizes the name User and creates a collection Users
module.exports = mongoose.model('User', userSchema)