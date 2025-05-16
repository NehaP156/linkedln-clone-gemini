// app.js - Complete Code at the End of Day 5 (without explanations)

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

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

app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    console.log('--- Received Registration Data ---');
    console.log('Username is:', username);
    console.log('Password is:', password);
    console.log('------------------------------------');

    res.redirect('/');
});

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