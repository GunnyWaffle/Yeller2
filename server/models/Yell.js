const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

let YellModel = {};

const setString = (str) => encodeURIComponent(str).trim().toUpperCase();

const YellSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true,
    set: setString,
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account',
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

YellSchema.statics.toAPI = (docs) => docs.map((doc) => ({
  _id: doc._id,
  message: decodeURIComponent(doc.message),
  createdDate: doc.createdDate,
  owner: {
    username: doc.owner.username,
  },
}));

// globally applied query filtering and population
const filterYells = (search) => {
  const firstPass = YellModel.find(search).populate('owner', 'username');
  return firstPass.select('owner message createdDate').sort({ createdDate: -1 });
};

// most recent yells, with a count limit
YellSchema.statics.findGlobal = (maxLimit, callback) => {
  const dumb = filterYells({});
  return dumb.limit(maxLimit).exec(callback);
};

// all yells owned by this user ID
YellSchema.statics.findByOwner = (ownerIds, callback) => {
  const search = {
    owner: { $in: ownerIds },
  };

  return filterYells(search).exec(callback);
};

YellModel = mongoose.model('Yell', YellSchema);

module.exports.YellModel = YellModel;
module.exports.YellSchema = YellSchema;
