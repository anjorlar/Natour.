const User = require('./../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')

const filterObj = (obj, ...allowedField) => {
  const newObj = {}
  Object.keys(obj).forEach(i => {
    if (allowedField.includes(i)) newObj[i] = obj[i]
  })
  console.log('... newObj', newObj)
  return newObj
}

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find()

  // response
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});


exports.updateMe = catchAsync(async (req, res, next) => {
  // creates error if user posts password data
  const { password, passwordConfirm } = req.body
  const { id } = req.user
  if (password || passwordConfirm) {
    return next(new AppError('This route is not for password update, please use UpdateMyPassword', 400))
  }
  //filtered out unwannted field names that aren't allowed
  const filteredBody = filterObj(req.body, 'name', 'email');
  console.log('>>>> filteredBody', filteredBody)
  // update user document
  const updatedUser = await User.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true
  })

  return res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })
});


exports.deleteMe = catchAsync(async (req, res, next) => {
  const { id } = req.user
  await User.findByIdAndUpdate(id, { active: false })
  return res.status(204).json({
    status: 'success',
    data: null
  });
});


exports.getUser = factory.getOne(User)
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined!, Please use sign up instaed'
  });
};
//do not use for updating password
exports.updateUser = factory.updateOne(User)
// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!'
//   });
// };

exports.deleteUser = factory.deleteOne(User)

// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!'
//   });
// };
