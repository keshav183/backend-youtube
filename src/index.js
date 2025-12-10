//require('dotenv').config({path : './env'})
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { DB_NAME } from './constants.js'
import express from 'express'
import connectDB from './db/index.js'
import app from './app.js'
//const app = express()

dotenv.config({path: "./.env"})


connectDB()  
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{console.log("server is running ")})
})
.catch((err)=>{
    console.log("mongodb connection falied !!! ",err);
})

/*
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/DB_NAME`)
        app.on("error" , (error) => {
            console.log("err" , error);
            throw error
        })
        app.listen(process.env.PORT , ()=> {
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    }
    catch (error){
        console.error("ERROR : " , error)
    }
})()
*/