var Twit = require('twit'),
	async = require('async'),
	request = require('request');
	_ = require('lodash');

// authentication for the Twitter API
var t = new Twit({
	consumer_key: 			process.env.BOT_CONSUMER_KEY,
	consumer_secret: 		process.env.BOT_CONSUMER_SECRET,
	access_token: 			process.env.BOT_ACCESS_TOKEN,
	access_token_secret: 	process.env.BOT_ACCESS_TOKEN_SECRET
});


// random: http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true&includePartOfSpeech=adjective&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=10&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=100&api_key=76e5465d283f80dbfb3090c68fe06731740c58d996136493e

// antonym: http://api.wordnik.com:80/v4/word.json/high/relatedWords?useCanonical=true&relationshipTypes=antonym&limitPerRelationshipType=10&api_key=76e5465d283f80dbfb3090c68fe06731740c58d996136493e


// get the most recent tweet that matches our query
getAdjectives = function (cb) {
	var wordCount = 100;
	var wordnikKey = process.env.WORDNIK_KEY;
	var randomWordURL = "http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true&includePartOfSpeech=adjective&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=10&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=" + wordCount + "&api_key=" + wordnikKey;

	request(randomWordURL, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			var botData = {
				adjList: json,
			}
			cb(null, botData);
		} else {
			console.log("there was a problem with the adjectives" + error);
			cb(error, botData);
		};
	})
}


getAntonyms = function (botData, cb) {
	var wordnikKey = process.env.WORDNIK_KEY;

	// console.log(botData.adjList);
	_.each(botData.adjList, function (adj) {
		// console.log(adj.word);
		var antonymURL = "http://api.wordnik.com:80/v4/word.json/" + adj.word + "/relatedWords?useCanonical=true&relationshipTypes=antonym&limitPerRelationshipType=10&api_key=" + wordnikKey;
		request(antonymURL, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var json = JSON.parse(body);
				// console.log(json[0].words);
				// console.log(json[0]);
				if (json[0] != undefined) {
					botData.adjective = adj.word;
					botData.antonym = json[0].words[0];
					// cb(null, botData);
					console.log("Buy " + botData.adjective + ". Sell " + botData.antonym + ". Profit.");
					var adjective = adj.word;
					var antonym = json[0].words[0];
				};
			} else {
				console.log("there was a problem with the antonym" + error);
			};
		})
	});
	// console.log("Buy " + botData.adjective + ". Sell " + botData.antonym + ". Profit.");
	console.log(adjective + " " + antonym);
	if (botData.adjective != undefined) {
		cb(null, botData);
	};
}


// format the tweet
formatTweet = function (botData, cb) {
	console.log("formatTweet: " + botData.adjective + " " + botData.antonym);
	console.log("made it to formatTweet");
	// cb(null, botData);
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
		getAntonyms,
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