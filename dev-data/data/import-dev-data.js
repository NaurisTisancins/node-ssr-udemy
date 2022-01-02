const fs = require("fs");
const Tour = require('./../../models/tour.model')
const User = require('./../../models/user.model')
const Review = require('./../../models/review.model')
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './.env' });

const DB = process.env.DATABASE;

// Read JSON
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, "utf-8"));
// Import data in to db
const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users);
        await Review.create(reviews);
        console.log("Data successfully loaded", tours)
        console.log("Data successfully loaded", users)
        console.log("Data successfully loaded", reviews)
    } catch (err) {
        console.log(err.message)
    }
};

// Delete All entires from collection
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log("Data deleted successfully!")
    } catch (err) {
        console.log(err.message)
    }
}

(async () => {
    try {
        await mongoose
            .connect(DB, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            })
            .then(con => {
                // console.log(con.connections);
                console.log('DB connection successful');
            });
        if (process.argv[2] === '--import') {
            await importData();
        } else if (process.argv[2] === '--delete') {
            await deleteData();
        }
        await mongoose.disconnect();
    } catch (err) {
        console.log(err);
    }
})()

console.log(process.argv);



