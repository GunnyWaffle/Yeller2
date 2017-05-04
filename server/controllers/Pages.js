const models = require('../models');

const Account = models.Account;

const renderPage = (req, res) => {
  res.render('app');
};

const userPage = (req, res) => {
  Account.AccountModel.findByUsername(req.params.username, (err, doc) => {
    if (err) {
      return res.redirect('/');
    }

    if (!doc[0]) {
      return res.redirect('/');
    }

    return renderPage(req, res);
  });
};


module.exports.home = renderPage;
module.exports.user = userPage;
