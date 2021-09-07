const Review = require('../models/reviewModel');
const catchAsync = require("../utils/catchAsync");
const AppError = require('../utils/appError');
const factory = require('./handlerFactory')

exports.getAllReviews = catchAsync(async (req, res, next) => {
    let filter = {}
    if (req.params.tourId) filter = { tour: req.params.tourId }
    const reviews = await Review.find(filter)
    // .populate({
    //     path: 'tour',
    // })
    // .populate({
    //     path: 'user',
    // })

    res.status(200).json({
        status: 'Success',
        results: reviews.length,
        data: {
            reviews
        }
    })
})

exports.createReview = catchAsync(async (req, res, next) => {
    // Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId
    if (!req.body.user) req.body.user = req.user._id
    console.log("req.params.id", req.user._id)
    // console.log("req", req)
    console.log('req.params.tourId', req.body)
    const newReview = await Review.create(req.body)

    res.status(201).json({
        status: 'Success',
        results: newReview.length,
        data: {
            newReview
        }
    })
})

exports.getReview = factory.getOne(Review)
exports.UpdateReview = factory.updateOne(Review)

exports.deleteReview = factory.deleteOne(Review)