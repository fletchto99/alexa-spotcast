const alexa = require('alexa-app');
const express = require('express');
const util = require('util');

const Cast = require('./cast');
const Spotify = require('./spotify');

// A generic error message indicating the app needs a spotify authorization
const PLEASE_LOGIN = `Before songs can be played you must authorize spotcast to access your spotify account. Please authorize it at ${process.env.SPOTIFY_CALLBACK_HOST}.`;

let alexaApp = new alexa.app('spotcast');
let app = express();
let spotify = new Spotify();
let loaded = false;

//Ensure we were able to log into spotify successfully
spotify.on('loaded', () => {
	console.log("You're ready to rock!");
	loaded = true;
});

alexaApp.express({
	expressApp: app,
	checkCert: true,
	debug: false
});

// An endpoint to display information
app.set('json spaces', 4);
app.get("/", ({}, response) => {
	if (loaded) {
		response.json(JSON.parse(alexaApp.schemas.skillBuilder()));
	} else {
		response.json({
			error: `Please go to ${process.env.SPOTIFY_CALLBACK_HOST} to authorize spotify.`
		});
	}
});

// Have the API listen on ${host}/spotcast
app.listen(process.env.ALEXA_API_PORT, () => {
	console.log(`Please go to ${process.env.SPOTIFY_CALLBACK_HOST} to authorize spotify.`);
});

// A generic "chromecast" command handler
alexaApp.launch(({}, response) => {
	if (loaded) {
		response.say('I can cast Spotify tracks, albums, artists and playlists to your chromecast.');
	} else {
		response.say(PLEASE_LOGIN).shouldEndSession(true).send();
	}
});

// Handle errors as gracefully as possible
alexaApp.error = ({}, {}, response) => {
	if (loaded) {
		response.say("An error occurred and the previous request could not be completed. Please try again.").shouldEndSession(true).send();
	} else {
		response.say(PLEASE_LOGIN).shouldEndSession(true).send();
	}
};

// Tells the chromecast to play the specified media
let play = (response, media, title) => {
	if (loaded) {
		console.log(`Now playing ${title}`);

		Cast.play(media);

		response.card({
			type: 'Standard',
			title: title,
			text: '',
			image: {
				smallImageUrl: media.image
			}
		});
		response.say(`Now playing ${title}`).shouldEndSession(true).send();
	} else {
		response.say(PLEASE_LOGIN).shouldEndSession(true).send();
	}
}

// Register intents
alexaApp.intent('PlayTrackIntent', {
	'slots': {
		'track': 'AMAZON.MusicRecording'
	},
	'utterances': [
		'play the song {-|track}',
		'play song {-|track}',
		'play {-|track}'
	]
}, (request, response) => {
	console.log(`PlayTrackIntent with params track:${request.slot('track')}`);
	return spotify.searchTracks(request.slot('track'))
		.then(data => {
			play(response, data, `${data.title} by ${data.artist}`);
		}).catch(error => {
			console.log(error);
			response.say(error.message).shouldEndSession(true).send()
		});
});

alexaApp.intent('PlayTrackByArtistIntent', {
	'slots': {
		'track': 'AMAZON.MusicRecording',
		'artist': 'AMAZON.MusicGroup'
	},
	'utterances': [
		'play the song {-|track} by {-|artist}',
		'play song {-|track} by {-|artist}',
		'play {-|track} by {-|artist}'
	]
}, (request, response) => {
	console.log(`PlayTrackByArtistIntent with params track:${request.slot('track')} artist:${request.slot('artist')}`);
	return spotify.searchTracks(`${request.slot('track')} ${request.slot('artist')}`)
		.then(data => {
			play(response, data, `${data.title} by ${data.artist}`)
		}).catch(error => {
			console.log(error);
			response.say(error.message).shouldEndSession(true).send()
		});
});

alexaApp.intent('StartPlaylistIntent', {
	'slots': {
		'playlist': 'AMAZON.MusicPlaylist'
	},
	'utterances': [
		'play {-|playlist} playlist',
		'playlist {-|playlist}',
		'play playlist {-|playlist}',
		'play songs from my {-|playlist}'
	]
}, (request, response) => {
	console.log(`StartPlaylistIntent with params playlist:${request.slot('playlist')}`);
	return spotify.searchPlaylists(request.slot('playlist'))
		.then(data => {
			play(response, data, `Songs from ${data.title}`)
		}).catch(error => {
			console.log(error);
			response.say(error.message).shouldEndSession(true).send()
		});
});

alexaApp.intent('StartArtistIntent', {
	'slots': {
		'artist': 'AMAZON.MusicGroup'
	},
	'utterances': [
		'play artist {-|artist}',
		'play songs by {-|artist}',
		'play top songs by {-|artist}',
		'play top tracks by {-|artist}',
		'play music by {-|artist}',
		'play tracks by {-|artist}',
	]
}, (request, response) => {
	console.log(`StartArtistIntent with params artist:${request.slot('artist')}`);
	return spotify.searchArtists(request.slot('artist'))
		.then(data => {
			play(response, data, `Songs by ${data.title}`)
		}).catch(error => {
			console.log(error);
			response.say(error.message).shouldEndSession(true).send()
		});
});

//TODO: Add artist slot
alexaApp.intent('StartAlbumIntent', {
	'slots': {
		'album': 'AMAZON.MusicAlbum'
	},
	'utterances': [
		'play the album {-|album}',
		'play album {-|album}'
	]
}, (request, response) => {
	console.log(`StartAlbumIntent with params album:${request.slot('album')}`);
	return spotify.searchAlbums(request.slot('album'))
		.then(data => {
			play(response, data, `${data.title} by ${data.artist}`)
		}).catch(error => {
			console.log(error);
			response.say(error.message).shouldEndSession(true).send()
		});
});

alexaApp.intent('AMAZON.StopIntent', {
	'slots': {},
	'utterances': []
}, (request, response) => {
	Cast.stop();
	response.say('Stopping music').shouldEndSession(true).send();
});

module.exports = alexaApp;
