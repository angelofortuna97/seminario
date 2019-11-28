const mongoose = require('mongoose');

const tweetSchema = mongoose.Schema({
    _author: {type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User'},
    tweet: {type: String, minlenght: 1, maxlenght: 280},
    created_at: {type: Date, default: Date.now()},
    _parent: {type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Tweet'},
    _likes: {type: [mongoose.Schema.Types.ObjectId], ref: 'User'},
    count_likes: Number,
    _favorites: {type: [mongoose.Schema.Types.ObjectId], ref: 'User'},
    hashtags: {type: [String]}
});

const Tweet = mongoose.model('Tweet', tweetSchema);

module.exports = Tweet;