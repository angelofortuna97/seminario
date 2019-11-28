const express = require('express');
const router = express.Router();

const { check } = require('express-validator');

const Tweet = require('../models/tweet');
const autenticationMiddleware = require('../middlewares/auth');
const { checkValidation } = require('../middlewares/validation');

const User = require('../models/user');

let flagForExit;

router.get('/', function(req, res, next) {
  Tweet.find({
    _parent: null})
    .populate("_author", "-password").exec(function(err, tweets){
    if (err) return res.status(500).json({error: err});
    res.json(tweets);
  });
});

router.get('/:id', function(req, res, next) {
  Tweet.findOne({_id: req.params.id})
    .populate("_author", "-password")
    .exec(function(err, tweet){
      if (err) return res.status(500).json({error: err});
      if(!tweet) return res.status(404).json({message: 'Tweet not found'})
      res.json(tweet);
    });
});

router.get('/:id/comments', function(req, res, next) {
  Tweet.find({_parent: req.params.id})
    .populate("_author", "-password")
    .exec(function(err, tweets){
      if (err) return res.status(500).json({error: err});
      res.json(tweets);
    });
});

router.post('/',autenticationMiddleware.isAuth, [
  check('tweet').isString().isLength({min: 1, max: 120})
], checkValidation, function(req, res, next) {
  const newTweet = new Tweet(req.body);

  const hashtags = newTweet.tweet.match(/(^|\s)(#[a-z\d-]+)/ig);
  
  newTweet._author = res.locals.authInfo.userId;
  newTweet._parent = req.body._parent;
  newTweet._likes = [];

  if (hashtags != null){
    hashtags.forEach(hashtag => {
    newTweet.hashtags.push(hashtag);
    });
  }

  newTweet.count_likes = 0;
  newTweet.save(function(err){
    if(err) {
      return res.status(500).json({error: err});
    } 
    res.status(201).json(newTweet);
  });
});

router.put('/:id', autenticationMiddleware.isAuth, [
  check('tweet').isString().isLength({min: 1, max: 120})
], checkValidation, function(req, res, next) {
  Tweet.findOne({_id: req.params.id}).exec(function(err, tweet) {
    if (err) {
      return res.status(500).json({
        error: err,
        message: "Error reading the tweet"
      });
    }
    if (!tweet) {
      return res.status(404).json({
        message: "Tweet not found"
      })
    }
    if (tweet._author.toString() !== res.locals.authInfo.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You are not the owner of the resource"
      });
    }
    tweet.tweet = req.body.tweet;
    tweet.save(function(err) {
      if(err) return res.status(500).json({error: err});
      res.json(tweet);
    });
  });
});

router.delete('/:id', autenticationMiddleware.isAuth, function(req, res, next) {
  Tweet.findOne({_id: req.params.id}).exec(function(err, tweet) {
    if (err) {
      return res.status(500).json({
        error: err,
        message: "Error reading the tweet"
      });
    }
    if (!tweet) {
      return res.status(404).json({
        message: "Tweet not found"
      })
    }
    if (tweet._author.toString() !== res.locals.authInfo.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You are not the owner of the resource"
      });
    }
    Tweet.remove({_id: req.params.id}, function(err) {
      if(err) {
        return res.status(500).json({error: err})
      }
      res.json({message: 'Tweet successfully deleted'})
    });
  });
});

router.put('/:id/like', autenticationMiddleware.isAuth, function(req, res, next){
  Tweet.findOne({_id: req.params.id}).exec(function(err, tweet) {
    if (err) {
      return res.status(500).json({
        error: err,
        message: "Error reading the tweet"
      });
    }
    if (!tweet) {
      return res.status(404).json({
        message: "Tweet not found"
      })
    }
   
    flagForExit = false;
    tweet._likes.forEach(userId => {
      if (userId == res.locals.authInfo.userId){
        flagForExit = true;
        return res.status(404).json({
        message: "Like exists"
        });
      }
    });
    if (flagForExit)
      return;
    tweet._likes.push(res.locals.authInfo.userId);
    tweet.count_likes += 1;
    tweet.save(function(err) {
      if(err) return res.status(500).json({error: err});
      res.json(tweet);
    });
  })
})

router.delete('/:id/like', autenticationMiddleware.isAuth, function(req, res, next){
  Tweet.findOne({_id: req.params.id}).exec(function(err, tweet) {
    if (err) {
      return res.status(500).json({
        error: err,
        message: "Error reading the tweet"
      });
    }
    if (!tweet) {
      return res.status(404).json({
        message: "Tweet not found"
      })
    }

    flagForExit = false;
    tweet._likes.forEach(user => {
      if (user == res.locals.authInfo.userId){
        flagForExit = true;
        tweet._likes.remove(res.locals.authInfo.userId);
        tweet.count_likes -= 1;
        tweet.save(function(err) {
          if(err) return res.status(500).json({error: err});
          res.json(tweet);
        });
        return;
      }
    });
    if (!flagForExit){
      return res.status(404).json({
      message: "Like doesn't exist"
      })
    }
  });
})

router.put('/:id/favorite', autenticationMiddleware.isAuth, function(req, res, next){
  Tweet.findOne({_id: req.params.id}).exec(function(err, tweet) {
    if (err) {
      return res.status(500).json({
        error: err,
        message: "Error reading the tweet"
      });
    }
    if (!tweet) {
      return res.status(404).json({
        message: "Tweet not found"
      })
    }

    User.findOne({_id: res.locals.authInfo.userId}).exec(function(err, user) {
      if (err) {
        return res.status(500).json({
          error: err,
          message: "Error reading the user"
        });
      }
      if (!user) {
        return res.status(404).json({
          message: "User not found"
        })
      }

      flagForExit = false;
      user._favorites.forEach(favoriteId => {
        if (favoriteId.toString() == tweet._id.toString()){
          console.log(""+favoriteId+tweet._id);
          flagForExit = true;
          return res.status(404).json({
          message: "Is already favorited"
          });
        }
      });

      if (flagForExit)
        return;
      //console.log("anche se il tweet è favorito sono arrivato qui");
      user._favorites.push(tweet._id);
      user.save(function(err) {
        if(err) return res.status(500).json({error: err});
      });

      tweet._favorites.push(user._id);
      tweet.save(function(err) {
        if(err) return res.status(500).json({error: err});
      });

      res.json(user);
    })
  })
})

router.delete('/:id/favorite', autenticationMiddleware.isAuth, function(req, res, next){
  Tweet.findOne({_id: req.params.id}).exec(function(err, tweet) {
    if (err) {
      return res.status(500).json({
        error: err,
        message: "Error reading the tweet"
      });
    }
    if (!tweet) {
      return res.status(404).json({
        message: "Tweet not found"
      })
    }

    User.findOne({_id: res.locals.authInfo.userId}).exec(function(err, user) {
      if (err) {
        return res.status(500).json({
          error: err,
          message: "Error reading the user"
        });
      }
      if (!user) {
        return res.status(404).json({
          message: "User not found"
        })
      }

      flagForExit = false;
      user._favorites.forEach(favoriteId => {
        if (favoriteId.toString() == tweet._id.toString()){
          flagForExit = true;
          user._favorites.remove(tweet._id);
          user.save(function(err) {
            if(err) return res.status(500).json({error: err});
          });
          tweet._favorites.remove(user._id);
          tweet.save(function(err) {
            if(err) return res.status(500).json({error: err});
          });
          res.json(user);
        }
      });
      if(!flagForExit){
        return res.status(404).json({
          message: "Is not favorited"
        });
      }
    })
  })
})

/*router.get('/search/:hashtag', function(req, res, next) {
  Tweet.find({hashtags: {'$all': ["#" + req.params.hashtag]}})
  .exec(function(err, tweets){
      if (err) return res.status(500).json({error: err});
      res.json(tweets);
    });
});*/

router.get('/search/:hashtag', function(req, res, next) {
  Tweet.find().exec(function(err, tweets){
      if (err) return res.status(500).json({error: err});      

      var tweetsWithHashtag = [];
      var tmp;

      tweets.forEach(tweet => {
        tweet.hashtags.forEach(hashtag => {
          tmp = " #" + req.params.hashtag.toString();
          if (hashtag.toString() == tmp.toString() ){
            tweetsWithHashtag.push(tweet);
            return;
          }
        });
      });

      res.json(tweetsWithHashtag);
    });
});

module.exports = router;