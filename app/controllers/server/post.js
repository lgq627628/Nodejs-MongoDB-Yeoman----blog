var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Post = mongoose.model('Post'),
  Category = mongoose.model('Category'),
  User = mongoose.model('User'),
  slug = require('slug'),
  auth = require('./user');
  //pinyin = require('pinyin');


module.exports = function (app) {
  app.use('/admin/posts', router);
};

router.get('/', auth.requireLogin, function (req, res, next) {
  //处理sort排序问题
  var sortby = req.query.sortby ? req.query.sortby : 'created';
  var sortdir = req.query.sortdir ? req.query.sortdir : 'desc';

  if(['title', 'category', 'author', 'created', 'published'].indexOf(sortby) === -1){
    sortby = 'created';
  }
  if(['desc', 'asc'].indexOf(sortdir) === -1){
    sortdir = 'desc';
  }
  var sortObj = {};
  sortObj[sortby] = sortdir;

  //处理condition问题
  var conditions = {};
  if(req.query.category){
    conditions.category = req.query.category.trim();
  }
  if(req.query.author){
    conditions.author = req.query.author.trim();
  }
  if(req.query.keyword){
    conditions.title = new RegExp(req.query.keyword.trim(), 'i');
    conditions.content = new RegExp(req.query.keyword.trim(), 'i');
  }
  User.find({}, function (err, authors) {
    if (err) return next(err);

    Post.find(conditions)
        .sort(sortObj)
        .populate('author')
        .populate('category')
        .exec(function (err, posts) {
      //return res.jsonp(posts);
      if (err) return next(err);

      var pageNum = Math.abs(parseInt(req.query.page || 1, 10)),
          pageSize = 10,
          totalCount = posts.length,
          pageCount = Math.ceil( totalCount/pageSize );

      if(pageNum > pageCount){
        pageNum = pageCount;
      }

      res.render('server/post/index', {
        posts: posts.slice((pageNum-1)*pageSize, pageNum*pageSize),
        pageNum: pageNum,
        authors: authors,
        pageCount: pageCount,
        sortdir: sortdir,
        sortby: sortby,
        pretty: true,
        filter: {
          category: req.query.category || "",
          author: req.query.author || "",
          keyword: req.query.keyword || ""
        }
      });
    });
  });
});

router.get('/edit/:id', auth.requireLogin, function (req, res, next) {
  if(!req.params.id){
    return next(new Error('no post id provied'));
  }
  //兼容id和slug(有利于seo)
  Post.findOne({ _id: req.params.id })
      .populate('category')
      .populate('author')
      .exec(function (err, post) {
        if(err){
          return next(err);
        }
        res.render('server/post/add', {
          post: post,
          action: '/admin/posts/edit/' + post._id,
          pretty: true
        });
      })
});

router.post('/edit/:id', auth.requireLogin, function (req, res, next) {
  if(!req.params.id){
    return next(new Error('no post id provied'));
  }
  Post.findOne({ _id: req.params.id }).exec(function(err, post){
    if(err){
      return next(err);
    }
    var title = req.body.title.trim(),
        category = req.body.category.trim(),
        content = req.body.content;

    post.title = title;
    post.category = category;
    post.content = content;

    post.save(function(err, post){
      if(err){
        req.flash('error', '文章编辑失败');
        res.redirect('/admin/posts/edit/' + post._id);
      }else{
       req.flash('info', '文章编辑成功');
       res.redirect('/admin/posts');
      }
    });
  })
});

router.get('/delete/:id', auth.requireLogin, function (req, res, next) {
  if(!req.params.id){
    return next(new Error('no post id provided'));
  }
  Post.remove({ _id: req.params.id}).exec(function (err, rowsRemoved) {
    if(err){
      return next(err);
    }
    if(rowsRemoved) {
      req.flash('success', '文章删除成功');
    }else{
      req.flash('success', '文章删除失败');
    }
    res.redirect('/admin/posts');
  })
});

router.get('/add', auth.requireLogin, function (req, res, next) {
  res.render('server/post/add', {
    action: "/admin/posts/add",
    post: {
      category: { _id: ''}
    },
    pretty: true
  })
});

router.post('/add', auth.requireLogin, function (req, res, next) {
  //res.jsonp(req.body);
  req.checkBody('title', '文章标题不能为空').notEmpty();
  req.checkBody('category', '必须指定文章分类').notEmpty();
  req.checkBody('content', '文章内容至少写几句').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
      console.log(errors);
      return res.render('server/post/add', {
          errors: errors,
          title: req.body.title,
          content: req.body.content
      });
  }

  var title = req.body.title.trim(),
      category = req.body.category.trim(),
      content = req.body.content;

  User.findOne({}, function (err, author) {
    if(err){
      return next(err);
    }
    /*
    var py = pinyin(title, {
        style: pinyin.STYLE_NORMAL,
        heteronym: false
    }).map(function (item) {
        return item[0];
    }).join(' ');
    console.log(py);
    */
    var post = new Post({
      title: title,
      slug: slug(title),
      category: category,
      content: content,
      author: author,
      meta: { favorite: 0 },
      published: true,
      comments: [],
      created: new Date()
    });

    post.save(function(err, post){
      if(err){
        req.flash('error', '文章保存失败');
        res.redirect('/admin/posts/add');
      }else{
       req.flash('info', '文章保存成功');
       res.redirect('/admin/posts');
      } 
    })
  })
});


function getPostById(req, res, next) {
    if (!req.params.id) {
        return next(new Error('no post id provided'));
    }

    Post.findOne({ _id: req.params.id })
        .populate('category')
        .populate('author')
        .exec(function (err, post) {
            if (err) {
                return next(err);
            }
            if (!post) {
                return next(new Error('post not found: ', req.params.id));
            }
            req.post = post;
            next();
       });
}