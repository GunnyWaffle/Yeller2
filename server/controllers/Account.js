const models = require('../models');

const Account = models.Account;

// log out the current user
const logout = (req, res) => {
  // let the session re-generate, for the single page site
  req.session.regenerate(() => {
    res.status(200).json({ csrf: req.csrfToken(), loggedIn: false, username: undefined });
  });
};

// log in the user
const login = (request, response) => {
  const req = request;
  const res = response;

  // force cast to strings to cover some security flaws
  const username = `${req.body.username}`;
  const password = `${req.body.pass}`;

  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  return Account.AccountModel.authenticate(username, password, (err, account) => {
    if (err || !account) {
      return res.status(400).json({ error: 'Wrong username or password' });
    }

    req.session.account = Account.AccountModel.toAPI(account);

    return res.status(200).json({ loggedIn: true, username: req.session.account.username });
  });
};

// sign up a new user
const signup = (request, response) => {
  const req = request;
  const res = response;

  // cast to strings to cover up some security flaws
  req.body.username = `${req.body.username}`;
  req.body.pass = `${req.body.pass}`;
  req.body.pass2 = `${req.body.pass2}`;

  // missing fields
  if (!req.body.username || !req.body.pass || !req.body.pass2) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // bad password
  if (req.body.pass !== req.body.pass2) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  // generate pass
  return Account.AccountModel.generateHash(req.body.pass, (salt, hash) => {
    const accountData = {
      username: req.body.username,
      salt,
      password: hash,
    };

    // new user
    const newAccount = new Account.AccountModel(accountData);

    const savePromise = newAccount.save();

    // update page state
    savePromise.then(() => {
      req.session.account = Account.AccountModel.toAPI(newAccount);
      return res.status(200).json({ loggedIn: true, username: req.session.account.username });
    });

    // user failed
    savePromise.catch((err) => {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Username already in use.' });
      }

      return res.status(400).json({ error: 'Invalid username: 1-16 alphanumeric only' });
    });
  });
};

// (un)follow a user
// username= (array support)
const handleFollow = (request, response, follow) => {
  const req = request;
  const res = response;

  // handle array support
  if (Array.isArray(req.body.username)) {
    req.body.username = req.body.username.map((username) => `${username}`);
  } else {
    req.body.username = `${req.body.username}`;
  }

  // was a username provided?
  if (!req.body.username) {
    return res.status(400).json({ error: `You need a username to ${!follow ? 'un' : ''}follow!` });
  }

  // search for user(s)
  return Account.AccountModel.findByUsername(req.body.username, (err, docs) => {
    if (err) {
      return res.status(500).json({ error: 'An error occurred' });
    }

    // invalid user check
    let validCount = docs.length;

    // check each user
    for (let i = 0; i < docs.length; ++i) {
      if (!docs[i]) --validCount;
    }

    // if none are valid, error out
    if (validCount === 0) {
      return res.status(400).json({ error: 'None of the users exist!' });
    }

    // process the request
    const action = follow ? Account.AccountModel.followUser : Account.AccountModel.unfollowUsers;
    const ids = docs.map((doc) => doc._id);

    // apply the request
    return action(req.session.account._id, ids, (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ error: 'An error occurred' });
      }

      return res.status(204).json({});
    });
  });
};

// forward to handler
const follow = (request, response) => {
  handleFollow(request, response, true);
};

// forward to handler
const unfollow = (request, response) => {
  handleFollow(request, response, false);
};

// current status of the logged in user
const getStatus = (req, res) => {
  const resJSON = {
    loggedIn: typeof req.session.account !== 'undefined',
    username: typeof req.session.account !== 'undefined' ? req.session.account.username : undefined,
  };

  return res.status(200).json(resJSON);
};

// query the relationship between N users
// username= (array support)
const getRelation = (request, response) => {
  const req = request;
  const res = response;

  // handle array type
  if (Array.isArray(req.query.username)) {
    req.query.username = req.query.username.map((username) => `${username}`);
  } else {
    req.query.username = `${req.query.username}`;
  }

  // was username provided properly?
  if (!req.query.username || req.query.username.length < 2) {
    return res.status(400).json({ error: 'You need at least 2 usernames to compare!' });
  }

  // get all the users in username
  return Account.AccountModel.findByUsername(req.query.username, (err, docs) => {
    if (err) {
      return res.status(500).json({ error: 'An error occurred' });
    }

    // populate the relations object
    const relations = {};
    for (let i = 0; i < docs.length; ++i) {
      relations[docs[i].username] = {}; // each user gets an object

      for (let j = 0; j < docs.length; ++j) {
        if (i === j) continue;

        // then the paired user gets an object
        relations[docs[i].username][docs[j].username] = {};
        // set the relationship properties between users i and j
        relations[docs[i].username][docs[j].username].following =
            docs[i].follows.some((id) => id.equals(docs[j]._id));
      }
    }

    return res.status(200).json(relations);
  });
};

// apply a group of settings to the currently logged in user
// newPass= and newPass2= for pass change
// unfollow= (array support) for unfollowing
const applySettings = (request, response) => {
  const req = request;
  const res = response;

  // changes in this request
  const changes = {
    password: false,
    unfollowed: false,
  };

  // database async tracker
  const settingsManager = {
    queue: 0,
    err: false,
  };

  // clean the strings
  req.body.newPass = `${req.body.newPass}`;
  req.body.newPass2 = `${req.body.newPass2}`;

  // detect pass change
  if (req.body.newPass && req.body.newPass2) {
    changes.password = true;
    ++settingsManager.queue;
  }

  // detect unfollows
  if (req.body.unfollow) {
    changes.unfollowed = true;
    ++settingsManager.queue;
  }

  // async database handler
  const handleSetting = (setting, err) => {
    --settingsManager.queue; // one less setting to wait for

    // error happened
    // log it's occurance and undo the changes flag for this setting
    // this way the user can check what settings passed
    if (err) {
      settingsManager.err = true;
      changes[setting] = false;
    }

    // no more settings to wait on
    if (settingsManager.queue === 0) {
      // error check
      if (settingsManager.err) {
        // merge in the error report, so that they know to check what changes did not make it
        res.status(500).json(Object.assign(changes, { error: 'An error occurred' }));
      } else {
        // let the user know what changes were applied
        res.status(200).json(changes);
      }
    }
  };

  // change the password
  if (changes.password) {
    Account.AccountModel.generateHash(req.body.newPass, (salt, hash) => {
      Account.AccountModel.changePass(req.session.account._id, hash, salt, (err) => {
        handleSetting('password', err);
      });
    });
  }

  // apply the unfollows
  if (changes.unfollowed) {
    Account.AccountModel.findByUsername(req.body.unfollow, (nameErr, docs) => {
      const unfollowIDs = docs.map((doc) => doc._id);
      Account.AccountModel.unfollowUsers(req.session.account._id, unfollowIDs, (updateErr) => {
        handleSetting('unfollowed', updateErr);
      });
    });
  }
};

// get the users that user(s) follow
// username= (array support)
const getFollows = (request, response) => {
  const req = request;
  const res = response;

  // handle array type
  if (Array.isArray(req.query.username)) {
    req.query.username = req.query.username.map((username) => `${username}`);
  } else {
    req.query.username = `${req.query.username}`;
  }

  // make sure usernames are provided
  if (!req.query.username) {
    return res.status(400).json({ error: 'A username is needed to get their follows!' });
  }

  // get all users, with their follows populated
  return Account.AccountModel.findByUsernamePopulated(req.query.username, (err, docs) => {
    if (err) {
      return res.status(500).json({ error: 'An error occurred' });
    }

    // track invalid users
    let validCount = docs.length;

    // check for invalid users
    for (let i = 0; i < docs.length; ++i) {
      if (!docs[i]) --validCount;
    }

    // were any of them valid?
    if (validCount === 0) {
      return res.status(400).json({ error: 'None of the users exist!' });
    }

    // the follows object
    const follows = {};
    for (let i = 0; i < docs.length; ++i) {
      // each user is a property to an array of people that they follow
      follows[docs[i].username] = docs[i].follows.map((user) => user.username);
    }

    return res.status(200).json({ follows });
  });
};

const getToken = (request, response) => {
  const req = request;
  const res = response;

  const csrfJSON = {
    csrf: req.csrfToken(),
  };

  res.status(200).json(csrfJSON);
};

module.exports.login = login;
module.exports.logout = logout;
module.exports.signup = signup;
module.exports.follow = follow;
module.exports.unfollow = unfollow;
module.exports.getStatus = getStatus;
module.exports.getRelation = getRelation;
module.exports.applySettings = applySettings;
module.exports.getFollows = getFollows;
module.exports.getToken = getToken;
