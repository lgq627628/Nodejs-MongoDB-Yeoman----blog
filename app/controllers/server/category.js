var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Post = mongoose.model('Post'),
  Category = mongoose.model('Category'),
  slug = require('slug'),
  auth = require('./user');
  //pinyin = require('pinyin');

module.exports = function (app) {
  app.use('/admin/categories', router);
};

router.get('/', auth.requireLogin, function (req, res, next) {
  res.render('server/category/index', {
    pretty: true
  })
});

router.get('/add', auth.requireLogin, function (req, res, next) {
  res.render('server/category/add', {
    action: "/admin/categories/add",
    category: '',
    pretty: true
  })
});

router.post('/add', auth.requireLogin, function (req, res, next) {
  //res.jsonp(req.body);
  req.checkBody('name', '分类标题不能为空').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
      console.log(errors);
      return res.render('server/category/add', {
          errors: errors,
          name: req.body.name,
      });
  }

  var name = req.body.name.trim();  
  /*
  var py = pinyin(name, {
      style: pinyin.STYLE_NORMAL,
      heteronym: false
  }).map(function (item) {
      return item[0];
  }).join(' ');
  */

  var category = new Category({
      name: name,
      slug: slug(name),
      created: new Date()
  });

  category.save(function (err, category) {
      if (err) {
          console.log('category/add error:', err);
          req.flash('error', '分类添加失败');
          res.redirect('/admin/categories/add');
      } else {
          req.flash('info', '分类添加成功');
          res.redirect('/admin/categories');
      }
  });
});

router.get('/edit/:id', auth.requireLogin, function (req, res, next) {
  if(!req.params.id){
    return next(new Error('no category id provied'));
  }
  Category.findOne({ _id: req.params.id }).exec(function (err, category) {
    if(err){
      return next(err);
    }
    if (!category) {
        return next(new Error('category not found: ', req.params.id));
    }
    console.log(category);
    res.render('server/category/add', {
        action: "/admin/categories/edit/" + category._id,
        category: category
    });
  })
});

router.post('/edit/:id', auth.requireLogin, function (req, res, next) {
  if(!req.params.id){
    return next(new Error('no category id provied'));
  }
  Category.findOne({ _id: req.params.id }).exec(function (err, category) {
    if(err){
      return next(err);
    }
    var name = req.body.name.trim();

    /*
    var py = pinyin(name, {
      style: pinyin.STYLE_NORMAL,
      heteronym: false
    }).map(function (item) {
        return item[0];
    }).join(' ');
    */

    category.name = name;
    category.slug = slug(name);

    category.save(function (err, category) {
      if (err) {
          console.log('category/edit error:', err);
          req.flash('error', '分类编辑失败');
          res.redirect('/admin/categories/edit/' + post._id);
      } else {
          req.flash('info', '分类编辑成功');
          res.redirect('/admin/categories');
      }
    });
  })
});

router.get('/delete/:id', auth.requireLogin, function (req, res, next) {
  if(!req.params.id){
    return next(new Error('no category id provided'));
  }
  Category.remove({ _id: req.params.id}).exec(function (err, rowsRemoved) {
    if(err){
      return next(err);
    }
    if(rowsRemoved) {
      req.flash('success', '分类删除成功');
    }else{
      req.flash('success', '分类删除失败');
    }
    res.redirect('/admin/categories');
  })
});
