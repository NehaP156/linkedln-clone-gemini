// app.js - Complete Code at the End of Day 5 (without explanations)

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const db = require('./models'); // This automatically loads models/index.js
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
// app.use(express.json()); // Optional JSON body parser

app.get('/', (req, res) => {
  res.render('home', { userName: 'New User', pageTitle: 'Homepage' });
});

app.get('/register', (req, res) => {
  res.render('register', { pageTitle: 'Register' });
});

app.post('/register', async (req, res) => {
// Inside app.post('/register', async (req, res) => { ... }
const username = req.body.username;
const password = req.body.password; // We'll hash this on Day 7

try {
    // 1. Check if a user with this username already exists (async operation, use await)
    const existingUser = await db.User.findOne({ // 'await' pauses here until the database query is done
        where: { // 'where' is how Sequelize specifies conditions (like a WHERE clause in SQL)
            username: username // Look for a user where the 'username' column matches the 'username' variable from the form
        }
    });

    // 2. If a user was found (meaning the username is taken)
    if (existingUser) {
        console.log("Registration failed: Username already exists:", username); // Log error to terminal
        // On a future day, we'll add user-facing error messages (flash messages)
        return res.redirect('/register'); // Redirect back to the registration page
    }

    // 3. If no existing user was found, create a new user record (async operation, use await)
    const newUser = await db.User.create({ // 'await' pauses here until the user record is created in the DB
        username: username,          // Set the username column to the username from the form
        passwordHash: password       // TEMPORARILY save the plain password here (FIX THIS ON DAY 7!)
        // Sequelize will automatically add id, createdAt, and updatedAt
    });

    // 4. If the creation was successful
    console.log("Registration successful for user:", newUser.username); // Log success to terminal
    // On Day 7, we will redirect the user to the login page
    res.redirect('/login'); // Redirect to the login page (we'll create a placeholder for this next)

} catch (error) {
    // 5. If any error occurred during the try block (e.g., database connection issue)
    console.error("Error during registration:", error); // Log the error to the terminal
    // On a future day, we'll add user-facing error messages
    res.redirect('/register'); // Redirect back to registration or an error page
}
});
// ... (keep existing routes) ...

// Route to handle GET requests for the login page
app.get('/login', (req, res) => {
    // Render the 'login.ejs' template (we'll create this next)
    res.render('login', { pageTitle: 'Login' });
});

// ... (keep app.listen) ...
// Placeholder routes for future days (can be added now or later)
/*
app.get('/login', (req, res) => { res.render('login', { pageTitle: 'Login' }); });
app.post('/login', (req, res) => { });
app.get('/logout', (req, res) => { });
app.get('/profile', (req, res) => { res.render('profile', { pageTitle: 'Profile', user: {} }); });
app.get('/users', (req, res) => { res.render('user_list', { pageTitle: 'Users', users: [] }); });
app.get('/users/:username', (req, res) => { res.render('profile_public', { pageTitle: 'User Profile', user: {} }); });
app.get('/profile/edit', (req, res) => { res.render('edit_profile', { pageTitle: 'Edit Profile', user: {} }); });
app.post('/profile/edit', (req, res) => { });
*/


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop the server.');
});