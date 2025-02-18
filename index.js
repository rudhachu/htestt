const client = require('./lib/Client')

const connect = async () => {
	try {
		await client.initialize()
	} catch (error) {
		console.error(error)
	}
}

connect();
