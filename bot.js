var Twit = require('twit'),
	async = require('async'),
	request = require('request');

// authentication for the Twitter API
var t = new Twit({
	consumer_key: 			process.env.BOT_CONSUMER_KEY,
	consumer_secret: 		process.env.BOT_CONSUMER_SECRET,
	access_token: 			process.env.BOT_ACCESS_TOKEN,
	access_token_secret: 	process.env.BOT_ACCESS_TOKEN_SECRET
});


// get the most recent tweet that matches our query
getAdjectives = function (cb) {
	var wordCount = 100;
	var wordnikKey = process.env.WORDNIK_KEY;
	var randomWords = "http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true&includePartOfSpeech=adjective&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=10&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=" + wordCount + "&api_key=" + wordnikKey;

	request(randomWords, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			console.log(json);
			for (var i = 0; json.length; i++) {
				console.log(json[i] + " " + json[i].word);
			}
			// var botData = {
			// 	photoID: json.photos.photo[0].id,
			// 	photoOwnerID: json.photos.photo[0].owner,
			// 	photoOwnerName: json.photos.photo[0].ownername,
			// 	photoTitle: json.photos.photo[0].title
			// }
			// console.log("here's the photoID: " + botData.photoID);
			// cb(null, botData);
		};
	})

	// t.get('search/tweets', {q: query, count: 1}, function (err, data, response) {
	// 	if (!err) {
	// 		var botData = {
	// 			baseTweet: data.statuses[0].text.toLowerCase(),
	// 			tweetID: data.statuses[0].id_str,
	// 			tweetUsername: data.statuses[0].user.screen_name
	// 		};
	// 		cb(null, botData);
	// 	} else {
	// 		console.log("There was an error getting a public Tweet. ABORT!");
	// 		cb(err, botData);
	// 	}
	// });
}


// make sure '2048' is in the tweet rather than the date
verifyTweet = function (botData, cb) {
	var match2048 = botData.baseTweet.match(/2048/);
	if(match2048) {
		cb(null, botData);
	} else {
		console.log("It appears 2048 isn't in the text. Must be in the date. ABORT!");
		cb(err, botData);
	}
}


// post the tweet
postTweet = function (botData, cb) {
	t.post('statuses/update', {status: botData.tweetBlock}, function (err, data, response) {
		cb(err, botData);
	});
}


// run each function in sequence
run = function () {
	async.waterfall([
		getAdjectives,
		formatTweet,
		postTweet
	],
	function (err, botData) {
		if (err) {
			console.log("There was an error posting to Twitter: ", err);
		} else {
			console.log("Tweet successful!");
			console.log("Tweet: ", botData.tweetBlock);
		}
		console.log("Base tweet: ", botData.baseTweet);
	});
}


// run every three hours
setInterval(function () {
	try {
		run();
	}
	catch (e) {
		console.log(e);
	}
}, 60000 * 1);