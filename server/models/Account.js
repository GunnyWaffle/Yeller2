const crypto = require('crypto');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

let AccountModel = {};
const iterations = 10000;
const saltLength = 64;
const keyLength = 64;

// user account
const AccountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^[A-Za-z0-9_\-.]{1,16}$/,
  },
  follows: { // the users that this user follows
    type: [mongoose.Schema.ObjectId],
    ref: 'Account',
  },
  salt: {
    type: Buffer,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

AccountSchema.statics.toAPI = doc => ({
  username: doc.username,
  _id: doc._id,
});

// validate the password
const validatePassword = (doc, password, callback) => {
  const pass = doc.password;

  return crypto.pbkdf2(password, doc.salt, iterations, keyLength, 'RSA-SHA512', (err, hash) => {
    if (hash.toString('hex') !== pass) {
      return callback(false);
    }
    return callback(true);
  });
};

// find user by username
// supports arrays
AccountSchema.statics.findByUsername = (names, callback) => {
  const search = {
    username: { $in: names },
  };

  return AccountModel.find(search).exec(callback); // basic search
};

// find user by username and populate the follows with usernames
// supports arrays
AccountSchema.statics.findByUsernamePopulated = (names, callback) => {
  const search = {
    username: { $in: names },
  };

  // populate usernames too
  return AccountModel.find(search).populate('follows', 'username').exec(callback);
};

// follow user
// supports arrays
AccountSchema.statics.followUser = (accountID, followIDs, callback) => {
  const search = {
    _id: accountID,
  };

  // if an array is used, apply $each
  if (Array.isArray(followIDs)) {
    return AccountModel.update(search, {
      $addToSet: { follows: { $each: followIDs } },
    }).exec(callback);
  }

  return AccountModel.update(search, { $addToSet: { follows: followIDs } }).exec(callback);
};

// unfollow user
// supports arrays
AccountSchema.statics.unfollowUsers = (accountID, unfollowIDs, callback) => {
  const search = {
    _id: accountID,
  };

  // if an array is used, apply $in
  if (Array.isArray(unfollowIDs)) {
    return AccountModel.update(search, { $pull: { follows: { $in: unfollowIDs } } }).exec(callback);
  }

  return AccountModel.update(search, { $pull: { follows: unfollowIDs } }).exec(callback);
};

// hash password generation
AccountSchema.statics.generateHash = (password, callback) => {
  const salt = crypto.randomBytes(saltLength);

  crypto.pbkdf2(password, salt, iterations, keyLength, 'RSA-SHA512', (err, hash) =>
    callback(salt, hash.toString('hex'))
  );
};

// change the password
AccountSchema.statics.changePass = (accountID, pass, salt, callback) => {
  const search = {
    _id: accountID,
  };

  const apply = {
    password: pass,
    salt,
  };

  return AccountModel.update(search, apply).exec(callback);
};

// authenticate the account
AccountSchema.statics.authenticate = (username, password, callback) =>
AccountModel.findByUsername(username, (err, doc) => {
  if (err) {
    return callback(err);
  }

  if (!doc[0]) {
    return callback();
  }

  return validatePassword(doc[0], password, (result) => {
    if (result === true) {
      return callback(null, doc[0]);
    }

    return callback();
  });
});

AccountModel = mongoose.model('Account', AccountSchema);

module.exports.AccountModel = AccountModel;
module.exports.AccountSchema = AccountSchema;
