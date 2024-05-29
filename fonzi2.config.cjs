/** @type {import('fonzi2').Config} */
module.exports = {
	logger: {
		enabled: true,
		levels: 'all',
		remote: {
			enabled: process.env['NODE_ENV'] === 'production',
			levels: 'all',
		},
		file: {
			enabled: false,
			levels: 'all',
			path: 'logs/',
		},
	},
};
