var express = require('express'),
  router = express.Router();

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  res.redirect('/posts');
});

router.get('/about', function (req, res, next) {
    res.render('client/about', {
        pretty: true,
    });
});

router.get('/contact', function (req, res, next) {
    res.render('client/contact', {
        pretty: true,
    });
});
