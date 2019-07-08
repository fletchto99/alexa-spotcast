const Client = require('castv2-client').Client;
const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;

module.exports = {
	play: media => {
		let client = new Client();

		//TODO: Stop current track first (this was cauing weird problems)
		//TODO: Gapless playback? Takes a few seconds to load, not sure why
		client.connect(process.env.CHROMECAST_IP, () => {
			client.launch(DefaultMediaReceiver, (error, player) => {
				if (error) {
					console.log(error);
				} else {
					console.log(`loading media "${process.env.SPOTIFY_CALLBACK_HOST}/${media.type}/${media.url}"`)
					player.load({
						contentId: `${process.env.SPOTIFY_CALLBACK_HOST}/${media.type}/${media.url}`,
						contentType: 'audio/mpeg',
						streamType: 'BUFFERED',
						metadata: {
							metadataType: 3,
							title: media.title,
							artist: media.artist || '',
							albumName: media.album || '',
							images: [{ url: media.image }]
						}
					}, {
						autoplay: true
					}, error =>{
						if (error) {
							console.log(error)
						}
					});
				}
			});
		});

		client.on('error', error => {
			if (error) {
				console.log(error);
				client.close();
			}
		});
	},

	stop: () => {
		let client = new Client();

		client.connect(process.env.CHROMECAST_IP, function() {
			client.getSessions((error, sessions) => {
				if (error) {
					console.log(error)
				} else if (sessions.length > 0) {
					client.join(sessions[0], DefaultMediaReceiver, (error, casted) => {
						if (error) {
							console.log("Error joining existing session to stop music")
							console.log(error)
						} else {
							client.stop(casted, (error, response) => {
								if (error) {
									console.log("Error stopping music");
									console.log(error);
								} else {
									console.log("Music stopped!");
								}
							});
						}
					});
				}
			});
		});

		client.on('error', error => {
			if (error) {
				console.log(error);
				client.close();
			}
		});
	}
}
