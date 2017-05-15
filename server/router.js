const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  // security
  app.get('/getToken', mid.requiresSecure, controllers.Account.getToken);

  // account management
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);
  app.get('/status', mid.requiresSecure, controllers.Account.getStatus);
  app.get('/logout', mid.requiresLogin, controllers.Account.logout);

  // yell management
  app.get('/getYells', controllers.Yell.getYells);
  app.post('/yell', mid.requiresLogin, controllers.Yell.yell);
  app.post('/deleteYells', mid.requiresLogin, controllers.Yell.deleteYells);

  // account relations
  app.get('/getRelation', controllers.Account.getRelation);
  app.get('/getFollows', controllers.Account.getFollows);
  app.post('/follow', mid.requiresLogin, controllers.Account.follow);
  app.post('/unfollow', mid.requiresLogin, controllers.Account.unfollow);

  // account settings
  app.post('/settings', mid.requiresSecure, mid.requiresLogin, controllers.Account.applySettings);

  // nav paths
  app.get('/:username', controllers.Pages.user);
  app.get('/', controllers.Pages.home);
};

module.exports = router;
