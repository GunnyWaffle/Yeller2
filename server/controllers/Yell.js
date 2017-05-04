const models = require('../models');

const Yell = models.Yell;

// makes a yell in the database
const makeYell = (req, res) => {
  // message required
  if (!req.body.message) {
    return res.status(400).json({ error: "You can't yell nothing!" });
  }

  // trim the incoming message
  const yellData = {
    message: req.body.message.substring(0, 140),
    owner: req.session.account._id,
  };

  // make the yell
  const newYell = new Yell.YellModel(yellData);

  const yellPromise = newYell.save();

  // all good, 200 return
  yellPromise.then(() => res.status(201).json({}));

  // catch the error
  yellPromise.catch((err) => {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Yell already exists.' });
    }

    return res.status(500).json({ error: 'An error occurred' });
  });

  return yellPromise;
};

// get yells
// username= (singular)
// global= true or false
// uses the currently logged in user if global false gets through
// otherwise follows queries
const getYells = (request, response) => {
  const req = request;
  const res = response;

  // if a username is present, use it
  if (req.query.username) {
    // get user
    return models.Account.AccountModel.findByUsername(req.query.username, (accountErr, doc) => {
      if (accountErr) {
        return res.status(500).json({ error: 'An error occurred' });
      }

      // if the user does not exist
      if (!doc[0]) {
        return res.status(400).json({ error: `User '${req.query.username}' does not exist` });
      }

      // get the yells
      return Yell.YellModel.findByOwner(doc[0]._id, (yellErr, docs) => {
        if (yellErr) {
          return res.status(500).json({ error: 'An error occurred' });
        }

        // process yells for the client
        return res.status(200).json({ yells: Yell.YellModel.toAPI(docs) });
      });
    });
  }

  // assuming global
  let global = true;

  // only allow global to be false if the user is logged in and asked for global to be false
  if (req.query.global) {
    global = req.query.global === 'true';
    global = req.session.account ? global : true;
  }

  // if global, get the 10 most recent yells
  if (global) {
    return Yell.YellModel.findGlobal(10, (err, docs) => {
      if (err) {
        return res.status(500).json({ error: 'An error occurred' });
      }

      // process yells for the client
      return res.status(200).json({ yells: Yell.YellModel.toAPI(docs) });
    });
  }
  
  // feed from yellers that the currently logged in user follows
  return models.Account.AccountModel.findByUsername(
  req.session.account.username, (accountErr, doc) => {
    if (accountErr) {
      return res.status(500).json({ error: 'An error occurred' });
    }

    return Yell.YellModel.findByOwner(doc[0].follows, (yellErr, docs) => {
      if (yellErr) {
        return res.status(500).json({ error: 'An error occurred' });
      }

      // process yells for the client
      return res.status(200).json({ yells: Yell.YellModel.toAPI(docs) });
    });
  });
};

module.exports.getYells = getYells;
module.exports.yell = makeYell;