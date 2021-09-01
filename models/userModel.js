const crypto = require('crypto')
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs')
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'A user must have an email'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email']
    },
    photo: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please provide a password'],
        validate: { // only works on create and save
            validator: function (element) {
                return element === this.password
            },
            message: 'Passwords are not the same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})

userSchema.pre('save', async function (next) {
    // only run this function if password was actually modified
    if (!this.isModified('password')) return next()
    // hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12)
    // doesn't allow us persist the passwordConform field in the database
    this.passwordConfirm = undefined
})

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});
//query middleware, points to the current query
userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } })
    next()
});

// an instance method
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) { // JWTTimestamp says time token was issued
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10) // to convert it to be in seconds
        // console.log("this.passwordChangedAt", changedTimeStamp, JWTTimestamp)
        // passwordChangedAt (changedTimeStamp) changed after token (JWTTimestamp) was issued hence the token created at's timestamp (iat) 
        // will be less than the passwordChangedAt timestamp
        return JWTTimestamp < changedTimeStamp
    }
    // false means pasword wasn't changed
    return false
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    console.log(' resetToken }, this.passwordResetToken', { resetToken }, this.passwordResetToken);

    // + 10(min) * 60(secs) * 1000(millisecs)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema)

module.exports = User;
