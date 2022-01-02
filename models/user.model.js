const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Pick a name!"],
    },
    email: {
        type: String,
        required: [true, "Chose an email!"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Provide a valid email!"],
    },
    photo: String,
    role: {
        type: String,
        enum: [
            "user",
            "guide",
            "lead-guide",
            "admin",
        ],
        default: "user",
    },
    password: {
        type: String,
        required: [true, "Provide a password!"],
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        require: [true, "You need to confirm your password!"],
        validate: {
            //works only on save/create
            validator: function (el) {
                return el === this.password;
            },
            message: "Passwords do not match!"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

//mongoose pre save middleware to encrypt passwords
userSchema.pre("save", async function (next) {
    //only run if pass is modified
    if (!this.isModified("password")) return next();
    //encrypt/hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    //delete passwordConfirm as it it not necessary to be persisted in db
    this.passwordConfirm = undefined;
    next();
});//encryption middleware

userSchema.pre("save", function (next) {
    if (!this.isModified("password")|| this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    
    next();
});//set the password changedAt prop

userSchema.pre(/^find/, function (next) {
    //this point to the current query
    this.find({ active: {$ne: false} });
    next();
});//filter out deleted/inactive accounts when fetching users from database

//instance methods
userSchema
    .methods
    .correctPassword = async function (
        candidatePassword,
        userPassword
    ) {
        return await bcrypt.compare(
            candidatePassword,
            userPassword
        );
    }

userSchema//check if the password has been changed after the token issued
    .methods
    .changedPasswordAfter = function (JWTTimestamp) {
        if (this.passwordChangedAt) {
            const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
            return JWTTimestamp < changedTimestamp;
        }
        return false;//means NOT changed
    };

userSchema
    .methods
    .createPasswordResetToken = function () {
        const resetToken = crypto.randomBytes(32).toString("hex");

        this.passwordResetToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        console.log({ resetToken }, this.passwordResetToken);

        this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

        return resetToken;
    }


const User = mongoose.model("User", userSchema);
module.exports = User;