// 1. Import the Express.js package
const express = require('express');

// 2. Create an instance of the Express application
const app = express();

// 3. Define the port number the server will listen on
// process.env.PORT is used by hosting services like Render
// || 3000 means if process.env.PORT is not set (like on your computer), use 3000
const port = process.env.PORT || 3000;

// 4. Define a "route" - how the server responds to a specific web address (path) and method (like GET)

// This route handles GET requests to the root path ('/')
app.get('/', (req, res) => {
  // When someone visits the root path, send this text as the response
  res.send('Hello from your first Express!');
});

// 5. Start the server - tell it to listen for incoming requests on the defined port
app.listen(port, () => {
  // This function runs once the server has successfully started
  console.log(`Server is running at http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop the server.');
});