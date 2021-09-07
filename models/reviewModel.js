const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            trim: true
        },
        rating: {
            type: Number,
            min: [0, 'Ratings must be above 0'],
            max: [6, 'Ratings must be below 6']
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: { // ref type used here is parent referencing
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tour',
            required: [true, 'review must belong to a tour']
        },
        user: { // ref type used here is parent referencing
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'review must have a user']
        }
    }, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
}
)

reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name' // selects only tour name
    // }).populate({
    //     path: 'user',
    //     select: 'name photo' // selects only user name and photo
    // })
    this.populate({
        path: 'user',
        select: 'name photo' // selects only user name and photo
    })
    next()
})

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review