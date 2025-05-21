const express = require('express');
const app = express();
const path = require('path');
const db = require('./models'); // Your database models setup (from Day 6)
const bcrypt = require('bcryptjs'); // Day 7: Import bcryptjs for password hashing

// Day 8: Session Management Imports
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store); // Import and initialize

// --- MIDDLEWARE ---

// Middleware to parse URL-encoded bodies (from HTML forms)
// This is essential to access form data via req.body
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies (useful for API endpoints)
app.use(express.json());

// Set EJS as the templating engine
app.set('view engine', 'ejs');
// Specify the directory where your EJS views are located
app.set('views', path.join(__dirname, 'views'));

// Serve static files (like CSS, images, client-side JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// Day 8: Configure Sequelize Store for sessions
const sessionStore = new SequelizeStore({
    db: db.sequelize, // Use your existing Sequelize connection
    tableName: 'Sessions' // The table you created in Task 3
});

// Day 8: Configure and use express-session middleware
app.use(session({
    secret: 'YOUR_VERY_STRONG_RANDOM_SECRET_KEY_HERE', // <--- IMPORTANT: REPLACE THIS!
    // Example: 'df12b6a9c7e0f8d1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5' (a long random string)
    store: sessionStore, // Use the Sequelize store for persistence
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // Session expires in 24 hours (in milliseconds)
        // You might want to add 'secure: true' in production for HTTPS
    }
}));

// Day 8: Sync the session store (creates the Sessions table if it doesn't exist)
// This line can be kept, but the migration in Task 3 is the primary way we create the table.
sessionStore.sync();

// Day 8: Authentication Middleware (from Task 6)
function isAuthenticated(req, res, next) {
    if (req.session.userId) { // Check if user ID exists in the session
        next(); // User is authenticated, proceed to the next middleware/route handler
    } else {
        console.log('Unauthorized access. Redirecting to login.');
        // Redirect to login, adding a query param to inform the login page
        res.redirect('/login?auth_required=true');
    }
}

// --- ROUTES ---

// GET route for the home page (Updated for Day 8, Task 9 anticipation)
app.get('/', (req, res) => {
  res.render('home', {
      // Pass loggedIn and username to the EJS template for conditional rendering
      loggedIn: req.session.userId ? true : false,
      username: req.session.username || 'Guest' // Default to 'Guest' if not logged in
  });
});

// GET route for the registration page (Day 5/6 setup)
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// POST route for user registration (Day 7, Task 4: Password Hashing)
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.User.create({
      username,
      email,
      passwordHash: hashedPassword,
    });

    console.log('User registered successfully:', newUser.username);
    res.redirect('/login?registered=true'); // Redirect to login with a flag

  } catch (error) {
    console.error('Error during user registration:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.render('register', { error: 'Username or email already exists. Please choose another.' });
    } else {
      res.render('register', { error: 'An error occurred during registration. Please try again.' });
    }
  }
});

// GET route for the login page (Day 7, Task 5)
app.get('/login', (req, res) => {
  const registered = req.query.registered === 'true'; // Check if redirected from successful registration
  const authRequired = req.query.auth_required === 'true'; // Check if redirected for authentication
  let errorMessage = null;

  if (authRequired) {
      errorMessage = 'Please log in to access this page.';
  } else if (req.query.error) {
      errorMessage = req.query.error; // Generic error from login attempt
  }

  res.render('login', { error: errorMessage, registered: registered });
});

// POST route for user login (Day 7, Task 6 & Day 8, Task 5: Session Storage)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { username: username },
          { email: username }
        ]
      }
    });
 console.log("DEBUG: User object retrieved from DB:", user);

    if (!user) {
      console.log(`Login failed: User '${username}' not found.`);
      return res.render('login', { error: 'Invalid username or password.', registered: false });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (passwordMatch) {
      console.log(`Login successful for user: ${user.username}`);

      // Day 8, Task 5: Store user information in the session
      req.session.userId = user.id;
      req.session.username = user.username; // Store username for display

      console.log("DEBUG LOGIN: User data stored in session:");
      console.log("DEBUG LOGIN: req.session.userId =", req.session.userId);
      console.log("DEBUG LOGIN: req.session.username =", req.session.username);
      // It's good practice to save the session explicitly before redirecting
     
      req.session.save((err) => {
          if (err) {
              console.error('Error saving session:', err);
              // Handle session save error, e.g., redirect to login with error
              return res.render('login', { error: 'Login failed due to session issue.', registered: false });
          }
          res.redirect('/dashboard'); // Redirect to the dashboard on success
      });

    } else {
      console.log(`Login failed: Incorrect password for user: ${user.username}`);
      return res.render('login', { error: 'Invalid username or password.', registered: false });
    }

  } catch (error) {
    console.error('Error during user login:', error);
    res.render('login', { error: 'An error occurred during login. Please try again.', registered: false });
  }
});

// GET route for the dashboard page (Day 7, Task 7 & Day 8, Task 7: Protected Route)
// 'isAuthenticated' middleware ensures only logged-in users can access this
app.get('/dashboard', isAuthenticated, (req, res) => {
 console.log("DEBUG: Accessing /dashboard route.");
 console.log("DEBUG: req.session.userId:", req.session.userId);
 console.log("DEBUG: req.session.username:", req.session.username); // Check if username exists
 console.log("DEBUG: Data being passed to dashboard.ejs:", { username: req.session.username || 'User' });
  // We can access req.session.username here because it was stored during login
  res.render('dashboard', { username: req.session.username || 'User' });
});

// NEW: GET route for logout (Day 8, Task 8)
app.get('/logout', (req, res) => {
    // Destroy the session data from the store
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            // If there's an error, maybe just redirect to home/login without clearing cookie
            return res.redirect('/dashboard');
        }
        // Clear the session cookie from the user's browser
        // 'connect.sid' is the default name for the session cookie
        res.clearCookie('connect.sid');
        console.log('User logged out successfully.');
        res.redirect('/'); // Redirect to the home page after logout
    });
});


// --- SERVER STARTUP AND DATABASE SYNCHRONIZATION ---

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Sync database models (creates tables if they don't exist)
  // For production, you typically run migrations explicitly.
  db.sequelize.sync()
    .then(() => {
      console.log('Database synced successfully');
    })
    .catch(err => {
      console.error('Error syncing database:', err);
    });
});