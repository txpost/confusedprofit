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


getAntonym = function (word) {
	var wordnikKey = process.env.WORDNIK_KEY;
	var antonymURL = "http://api.wordnik.com:80/v4/word.json/" + word + "/relatedWords?useCanonical=true&relationshipTypes=antonym&limitPerRelationshipType=10&api_key=" + wordnikKey;
	request(antonymURL, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			console.log(json[0].words[0]);
			var antonym = json[0].words[0];
			return antonym;
		};
	})

	return "made it to antonym";
}


// get the most recent tweet that matches our query
getAdjectives = function (cb) {
	var wordCount = 100;
	var wordnikKey = process.env.WORDNIK_KEY;
	var randomWordURL = "http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true&includePartOfSpeech=adjective&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=10&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=" + wordCount + "&api_key=" + wordnikKey;

	request(randomWordURL, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			for (var i = 0; json.length; i++) {
				console.log(json[i] + " " + json[i].word);
				var adjective = json[i].word;
				var antonym = getAntonym(adjective);
				console.log("this is the first antonym checkpoint: " + antonym);
				// if (antonym) {
				// 	console.log("this is the antonym: " + antonym);
				// 	break;
				// };
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


// format the tweet
formatTweet = function (botData, cb) {
	
	var tweetText = botData.photoTitle;
	var tweetOwnerName = botData.photoOwnerName;
	var tweetOwnerID = botData.photoOwnerID;
	var tweetPicID = botData.photoID;

	// example url to get: https://www.flickr.com/photos/48097026@N02/15956844955/in/pool-urbansketches
	var tweetURL = "https://www.flickr.com/photos/" + tweetOwnerID + "/" + tweetPicID + "/in/pool-urbansketches";

	var tweet = '"' + tweetText + '" by ' + tweetOwnerName + ": " + tweetURL;
	botData.tweetBlock = tweet;
	cb(null, botData);
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