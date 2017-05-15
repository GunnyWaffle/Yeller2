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
  promoted: {
    type: Boolean,
    default: false,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  expirationDate: {
    type: Date,
    expires: 0,
  },
});

YellSchema.statics.toAPI = (docs) => docs.map((doc) => ({
  _id: doc._id,
  message: decodeURIComponent(doc.message),
  createdDate: doc.createdDate,
  promoted: doc.promoted,
  owner: {
    username: doc.owner.username,
  },
}));

// globally applied query filtering and population
const filterYells = (search, promoted) => {
  const isPromoted = typeof promoted === 'undefined' ? false : promoted;

  const firstPass = YellModel.find(search).where('promoted');
  const secondPass = firstPass.equals(isPromoted).populate('owner', 'username');
  return secondPass.select('owner message createdDate promoted').sort({ createdDate: -1 });
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

YellSchema.statics.findPromoted = (callback) => filterYells({}, true).exec(callback);

YellModel = mongoose.model('Yell', YellSchema);

module.exports.YellModel = YellModel;
module.exports.YellSchema = YellSchema;
