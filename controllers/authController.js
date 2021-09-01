const crypto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 3600 * 1000), // converts to milliseconds
        httpOnly: true
    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true,
        console.log('cookiedoptions', cookieOptions)
    res.cookie('jwt', token, cookieOptions)
    // removes password from output
    user.password = undefined
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.signUp = catchAsync(async (req, res, next) => {
    const { name, email, password, passwordConfirm, passwordChangedAt, role } = req.body
    let newUser = await User.create({
        name,
        email,
        password,
        passwordConfirm,
        role,
        passwordChangedAt
    })
    createAndSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body
    // check if email and password exist
    console.log(email, password)
    if (!email || !password) {
        return next(new AppError(`Please provide email and password`, 400))
    }

    // check if user exist and password is correct
    const user = await User.findOne({ email }).select('+password')

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError(`Incorrect email or password`, 401))
    }
    createAndSendToken(user, 200, res)

})

exports.protect = catchAsync(async (req, res, next) => {
    // get to the token and check if exits
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }
    if (!token) {
        return next(new Error('You are not logged in please log in to get access', 401))
    }
    // verify token: we used promisify as we didn't want to use callbacks
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY)

    // if the user still exists
    const currentUser = await User.findById(decoded.id)
    switch (true) {
        case !currentUser:
            return next(new AppError('The User with this token does not exit', 401))
    }

    // if user changed password after jwt was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('user recently changed password please login again', 401))
    }

    // Grant access to protected route
    req.user = currentUser
    next()
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array
        console.log('>>>>> req.user.role', req.user)
        if (!roles.includes(req.user.role)) {
            return next(new AppError("You don't have permission to perform this action", 403))
        }
        next()
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // get user based on posted email
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) next(new AppError('There is no user with email address', 404))
    // generate random reset token 
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false }) // disables all the schema validators
    // send it to user's email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password, submit a patch request with your new password and passwordConfirm to: ${resetUrl}.\nif you didn't forget your password please ignore this email`

    try {
        await sendEmail({
            email: user.email,
            subject: `Your password reset token only valid for 10 min`,
            message
        })
        res.status(200).json({
            status: `success`,
            message: `Token sent to email`
        })
    } catch (error) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false }) // disables all the schema validators
        return next(new AppError('There was and error send email please try later', 500))
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    // get user based on token
    let { token } = req.params
    let { passwordConfirm, password } = req.body
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    })
    // set new password if token hasn't expired and there is a user
    if (!user) next(new AppError('Token is invalid or has expired', 400))

    user.password = password
    user.passwordConfirm = passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save();

    // update changedPasswordAt property for the user

    // send token to client
    // log the user in send jwt
    createAndSendToken(user, 200, res)

})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // get user from collection
    let { id } = req.user
    let { password, passwordConfirm, passwordCurrent } = req.body
    const user = await User.findById(id).select('+password')
    // check if posted password is correct
    if (!(await user.correctPassword(passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong', 401))
    }
    // update password 
    user.password = password
    user.passwordConfirm = passwordConfirm
    await user.save();
    // User.findByIdAndUpdate will not work as intended
    // log user in and send jwt
    createAndSendToken(user, 200, res)

})