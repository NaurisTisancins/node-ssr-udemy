const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on("uncaughtException", err => {
    console.log(err.name, err.message);
    console.log("UNCAUGHT EXCEPTION! SHUTTING THE SERVER DOWN ...")
    process.exit(1);
});//synchronous uncaughtexception

dotenv.config({ path: './.env' });
const DB = process.env.DATABASE;
mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(con => {
        // console.log(con.connections);
        console.log('DB connection successful');
    });



const app = require('./app');

const port = process.env.PORT || 3000;
const server  = app
    .listen(port, () => {
        console.log(`App runing on port: ${port}...`);
    });

process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log("UNHANDLED REJECTION! sHUTTING THE SERVER DOWN ...")
    server.close(() => {
        process.exit(1);
    });
});//async unhandledException
//if any unhandlet promise rejection occure we
//print the error and close the serverver and then exit the process with
//exit code 1

