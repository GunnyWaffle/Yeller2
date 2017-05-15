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

  if (req.body.promoted) {
    yellData.expirationDate = new Date(Date.now() + 60 * 1000);
    yellData.promoted = true;
  }

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

// inject promotional yells into the yell feed
// yells= an array, representing the yell feed
const injectPromotionals = (response, yells) => Yell.YellModel.findPromoted((err, docs) => {
  if (err) {
    return response.status(500).json({ error: 'An error occurred' });
  }

  // all promoted yells in an array
  const promotedYells = Yell.YellModel.toAPI(docs);
  let promoteCounter = 0;

  // inject the promoted yells into the normal yell feed
  const yellFeed = yells.reduce((arr, val, index) => {
    // every 3 yells, while there are promoted yells left
    if (index % 3 === 2 && promoteCounter < promotedYells.length) {
      // inject the next promoted yell
      return arr.concat(val, promotedYells[promoteCounter++]);
    }

    return arr.concat(val, []);
  }, []);

  return response.status(200).json({ yells: yellFeed });
});

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
        return injectPromotionals(res, Yell.YellModel.toAPI(docs));
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

  // if global, get the 12 most recent yells
  if (global) {
    return Yell.YellModel.findGlobal(12, (err, docs) => {
      if (err) {
        return res.status(500).json({ error: 'An error occurred' });
      }

      // process yells for the client
      return injectPromotionals(res, Yell.YellModel.toAPI(docs));
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
      return injectPromotionals(res, Yell.YellModel.toAPI(docs));
    });
  });
};

// delete yells
const deleteYells = (req, res) => {
  if (!req.body.ids) {
    return res.status(400).json({ error: 'No yell(s) specified' });
  }

  // parse for old methods, this also ensures an array is used
  const ids = req.body.ids.split('_');

  // find all yells to be deleted
  return Yell.YellModel.findByIdArray(ids, (idErr, docs) => {
    if (idErr) {
      return res.status(500).json({ error: 'An error occurred' });
    }

    // if some failed, error out
    if (ids.length !== docs.length) {
      return res.status(400).json({ error: 'One or more yells do not exist' });
    }

    // track IDs for ownership
    const validIDs = [];

    for (let i = 0; i < docs.length; ++i) {
      // if this ID is owned by the currently logged in user
      if (req.session.account._id === docs[i].owner.toString()) {
        validIDs.push(ids[i]);
      } else {
        // invalid ID found
        break;
      }
    }

    // cjeck if all IDs were valid
    if (validIDs.length !== ids.length) {
      return res.status(400).json({ error: 'One or more yells do not belong to this account' });
    }

    // track the error, for scoping reasons
    let error = undefined;

    // delete the yell(s)
    const deletePromise = Yell.YellModel.deleteByIdArray(validIDs, (err) => {
      if (err) error = err;
    });

    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'An error occurred' });
    }

    deletePromise.then(() => res.status(200).json({}));

    deletePromise.catch((err) => {
      console.log(err);
      return res.status(500).json({ error: 'An error occurred' });
    });

    return deletePromise;
  });
};

module.exports.getYells = getYells;
module.exports.yell = makeYell;
module.exports.deleteYells = deleteYells;
