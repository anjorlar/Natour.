const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price' // the ({VALUE}) has access to the passed val. it is internal to mongoose
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // sets excluding returning a value
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //geojson to specify geospatial data
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    location: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
      }
    ],
    // guides: {
    //   type: Array
    // }
    guides: [ // ref type used here is child referencing
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // location in referenced(Review) model
  localField: "_id" // location in present(tour) model
})
// MIDLEWARE ALSO CALLED HOOKS // >>> mongoose docs
// DOCUMENT MIDDLEWARE: runs before .save() and .create() does not run on insertMany
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// used to get users as tour guide in the embedded guides document
// tourSchema.pre('save', async function (next) {
//   // the asyncronous array.map returns an array of promises 
//   const guidesPromises = this.guides.map(async id => await User.findById(id))
//   // we use promise.all to resolve all the array promises
//   this.guides = await Promise.all(guidesPromises)
//   next();
// });

// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

/** @description  QUERY MIDDLEWARE 
 *  @Usecase (can be used to exclude softly deleted documents ie once isDeleted Is true set it to only return ones that are false)
 * @queryForUsecase { $match: { isDeleted: { $ne: true } } }
  */
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function (next) { // using regex to make the middleware execute for all queries containing find
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next()
})

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// AGGREGATION MIDDLEWARE
/**
 *  @Usecase (can be used to exclude softly deleted documents ie once isDeleted Is true set it to only return ones that are false)
 *  @queryForUsecase { $match: { isDeleted: { $ne: true } } }
 */
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // as aggregation pipeline is an array, we use unshift to add the query (here { $match: { secretTour: { $ne: true } } ) to the beginning on the aggregation array

  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
