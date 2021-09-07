const express = require('express');
const tourController = require('./../controllers/tourController');
const tourMiddleware = require('../middleware/tour')
const reviewRouter = require('./reviewRoutes');
const authController = require('../controllers/authController');


const router = express.Router();

// router.param('id', tourController.checkID);
//use this
router.use('/:tourId/reviews', reviewRouter)
//instead of this
// router.route('/:tourId/reviews')
//   .post(authController.protect, authController.restrictTo('user'), reviewController.createReview)

router.route('/top-5-cheap')
  .get(tourMiddleware.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats')
  .get(tourController.getTourStats);
router.route('/monthly-plan/:year')
  .get(tourController.getMonthlyPlan);

router.route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

module.exports = router;
