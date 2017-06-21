var express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  Post = mongoose.model('Post');
  Category = mongoose.model('Category');

module.exports = function (app) {
  app.use('/posts', router);
};

router.get('/', function (req, res, next) {
  //处理condition问题
  var conditions = { published: true };

  if(req.query.keyword){
    conditions.title = new RegExp(req.query.keyword.trim(), 'i');
    conditions.content = new RegExp(req.query.keyword.trim(), 'i');
  }

  Post.find(conditions)
      .sort('-created')
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

    res.render('client/index', {
      posts: posts.slice((pageNum-1)*pageSize, pageNum*pageSize),
      pageNum: pageNum,
      pageCount: pageCount,
      pretty: true
    });
  });
});

router.get('/view/:id', function (req, res, next) {
  if(!req.params.id){
    return next(new Error('no post id provied'));
  }
  //兼容id和slug(有利于seo)
  var conditions = {};
  try{
    conditions._id = mongoose.Types.ObjectId(req.params.id);
  }catch(err){
    conditions.slug = req.params.id;
  }
  Post.findOne(conditions)
      .populate('category')
      .populate('author')
      .exec(function (err, post) {
        if(err){
          return next(err);
        }
        res.render('client/view', {
          post: post,
          pretty: true
        });
      })
});

router.get('/category/:name', function (req, res, next) {
  Category.findOne({ name: req.params.name }).exec(function (err, category) {
    if(err){
      return next(err);
    }
    Post.find({ category: category, published: true })
        .sort('created')
        .populate('category')
        .populate('author')
        .exec(function (err, posts) {
          if(err){
            return next(err);
          }
          res.render('client/category', {
            posts: posts,
            category: category,
            pretty: true
          });
        });
  });
});

router.post('/comment/:id', function (req, res, next) {
  //res.jsonp(req.body);
  if(!req.body.email){
    return next(new Error('no email provied for commenter'));
  }
  if(!req.body.content){
    return next(new Error('no content provied for commenter'));
  }
  var conditions = {};
  try{
    conditions._id = mongoose.Types.ObjectId(req.params.id);
  }catch(err){
    conditions.slug = req.params.id;
  }
  Post.findOne(conditions).exec(function (err, post) {
      if(err){
        return next(err);
      }
      var perComment = {
        email: req.body.email,
        content: req.body.content,
        created: new Date()
      };
      post.comment.unshift(perComment);
      post.markModified('comment');
      post.save(function (err) {
        req.flash('info', '评论添加成功');
        res.redirect('/posts/view/' + post.slug);
      })
  })
});

router.get('/favorite/:id', function (req, res, next) {
  if(!req.params.id){
    return next(new Error('no post id provied'));
  }
  //兼容id和slug(有利于seo)
  var conditions = {};
  try{
    conditions._id = mongoose.Types.ObjectId(req.params.id);
  }catch(err){
    conditions.slug = req.params.id;
  }
  Post.findOne(conditions)
      .populate('category')
      .populate('author')
      .exec(function (err, post) {
        if(err){
          return next(err);
        }
        post.meta.favorite = post.meta.favorite ? post.meta.favorite+1 : 1;
        post.markModified('meta');
        post.save(function (err) {
           res.redirect('/posts/view/' + post.slug);
        })
       
      })
});
