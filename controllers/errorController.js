const AppError = require("../utils/appError");

const handleCastErrorDb = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400)
}

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)
    console.log('>>>>', value[0])
    const message = `Duplicate fields value: ${value[0]}, Please use another value`
    return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(e => e.message)
    const val = Object.values(err.errors)
    console.log('>>errors>>> ', errors)
    console.log('>>>err.errors>> ', val)
    // console.log('>>>>> ', errors)
    const message = `Invalid Input Data, ${errors.join('. ')}`
    return new AppError(message, 400)
}

const handleJwtError = err => new AppError('Invalid Token Please Login Again', 401)
const handleJwtExpiredError = err => new AppError('Your Token has expired please login again', 401)

const sendErrorForDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

const sendErrorForProd = (err, res) => {
    // Operational Error, trusted Error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
        // Programming or other unknown error: don't leak error details to client
    } else {
        //1) log error
        console.error('error', err)

        //2) send generic message
        res.status(500).json({
            status: 'error',
            message: 'something went wrong'
        })
    }
}
module.exports = (err, req, res, next) => {
    // console.log(err.stack)
    err.statusCode = err.statusCode || 500
    err.status = err.status || "error"

    if (process.env.NODE_ENV === 'development') {
        sendErrorForDev(err, res)
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err }
        if (err.name === 'CastError') error = handleCastErrorDb(error)
        if (err.code === 11000) error = handleDuplicateFieldsDB(error)
        if (err.name === 'ValidationError') error = handleValidationErrorDB(error)
        if (err.name === 'JsonWebTokenError') error = handleJwtError()
        if (err.name === 'TokenExpiredError') error = handleJwtExpiredError()
        sendErrorForProd(error, res)
    }
}