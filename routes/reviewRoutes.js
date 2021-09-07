const express = require('express');
const authController = require('../controllers/authController')
const reviewController = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });
/**
 * merge params here merges this route from tourRoutes
router.use('/:tourId/reviews', reviewRouter)
 *  to the handler in reviewRouter
 */
router.route('/')
    .get(reviewController.getAllReviews)
    .post(authController.protect, authController.restrictTo('user'),
        reviewController.createReview) // only auth user with user roles can access the route 

router.route('/:id')
    .get(reviewController.getReview)
    .patch(reviewController.UpdateReview)
    .delete(reviewController.deleteReview)
module.exports = router