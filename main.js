const http = require('http');
const app = require('./app');
const PORT = process.env.PORT || 12345;

const server = http.createServer(app);

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

