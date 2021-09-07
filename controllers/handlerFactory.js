const catchAsync = require("../utils/catchAsync");
const AppError = require('../utils/appError');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
        return next(new AppError('No document found with that Id', 404))
    }
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!doc) {
        return next(new AppError('No document found with that Id', 404))
    }
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    if (!doc) {
        return next(new AppError('No document found with that Id', 404))
    }
    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    const { id } = req.params;
    let query = Model.findById(id)
    if (popOptions) query = query.populate(popOptions)
    const doc = await query
    // Tour.findOne({ _id: req.params.id })
    if (!doc) {
        return next(new AppError('No documents found with that Id', 404))
    }
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});
