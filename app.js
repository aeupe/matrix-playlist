const 	sdk = require('matrix-js-sdk'),
	urlParser = require('js-video-url-parser'),
	express = require('express'),
	config = require('./config')

	client = sdk.createClient(config.HOMESERVER),
	app = express()

console.log('Logging in and starting the client...')

client.login(
	'm.login.password', {
		'user': config.USER,
		'password': config.PASS
	}
).then(res => {
	
	const eventFilter = e =>
		e.event.type == 'm.room.message' &&
		e.event.content.body && e.event.content.body.length &&
		e.event.room_id == config.ROOM_ID,
	getId = e => {
		const obj = urlParser.parse(e.event.content.body)
		return obj && obj.provider == 'youtube' && obj.id
			? obj.id
			: null
	},
	getYouTubeUrl = ids => `https://www.youtube.com/watch_videos?video_ids=${ids.join(',')}`,
	ids = []

	client.once('sync', (state, prevState, res) => {
		console.log(`Sync: ${state}`)
		switch (state) {
			case 'PREPARED':
				console.log('Initializing Express...')
				app.get('/', (req, res) => {
					res.redirect(getYouTubeUrl(ids))
				})
				app.listen(config.LOCAL_PORT, () => {
					console.log(`Express is listening on port ${config.LOCAL_PORT}`)
				})
		}
	})

	client.on('Room.timeline', (event, room, toStartOfTimeline) => {
		if ( eventFilter(event) && ( id = getId(event) ) ) {
			if ( config.ASC_ORDER ) ids.push(id)
			else ids.unshift(id)
			console.log(`${new Date().toString()} ${id}`)
		}
	})

	client.startClient({
		initialSyncLimit: config.INIT_SYNC_LIMIT
	})

})
