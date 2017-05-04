const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get('/getToken', mid.requiresSecure, controllers.Account.getToken);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);
  app.get('/status', mid.requiresSecure, controllers.Account.getStatus);
  app.get('/logout', mid.requiresLogin, controllers.Account.logout);
  app.get('/getYells', controllers.Yell.getYells);
  app.post('/yell', mid.requiresLogin, controllers.Yell.yell);
  app.get('/getRelation', controllers.Account.getRelation);
  app.post('/follow', mid.requiresLogin, controllers.Account.follow);
  app.post('/unfollow', mid.requiresLogin, controllers.Account.unfollow);
  app.post('/settings', mid.requiresSecure, mid.requiresLogin, controllers.Account.applySettings);
  app.get('/getFollows', controllers.Account.getFollows);
  app.get('/:username', controllers.Pages.user);
  app.get('/', controllers.Pages.home);
};

module.exports = router;
