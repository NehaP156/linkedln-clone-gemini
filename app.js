const express = require('express');
const app = express();
const path = require('path');
const db = require('./models'); // Your database models setup
const bcrypt = require('bcryptjs'); // For password hashing

// Session Management Imports
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

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


// Configure Sequelize Store for sessions
const sessionStore = new SequelizeStore({
    db: db.sequelize, // Use your existing Sequelize connection
    tableName: 'Sessions' // The table you created for sessions
});

// Configure and use express-session middleware
app.use(session({
    secret: '78965', // <--- IMPORTANT: REPLACE THIS!
    // Example: 'df12b6a9c7e0f8d1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5' (a long random string)
    store: sessionStore, // Use the Sequelize store for persistence
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // Session expires in 24 hours (in milliseconds)
        // You might want to add 'secure: true' in production for HTTPS
    }
}));

// Sync the session store (creates the Sessions table if it doesn't exist)
sessionStore.sync();

// Authentication Middleware
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

// GET route for the home page
app.get('/', (req, res) => {
  res.render('home', {
      // Pass loggedIn and username to the EJS template for conditional rendering
      loggedIn: req.session.userId ? true : false,
      username: req.session.username || 'Guest' // Default to 'Guest' if not logged in
  });
});

// GET route for the registration page
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// POST route for user registration
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.User.create({
      username,
      email,
      passwordHash: hashedPassword, // Using passwordHash to match database
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

// GET route for the login page
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

// POST route for user login
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

    if (!user) {
      console.log(`Login failed: User '${username}' not found.`);
      return res.render('login', { error: 'Invalid username or password.', registered: false });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (passwordMatch) {
      console.log(`Login successful for user: ${user.username}`);

      req.session.userId = user.id;
      req.session.username = user.username; // Store username for display

      req.session.save((err) => {
          if (err) {
              console.error('Error saving session:', err);
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

// GET route for the dashboard page
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', { username: req.session.username || 'User' });
});

// GET route for the User Profile page
app.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await db.User.findByPk(req.session.userId);

        if (!user) {
            console.warn('User not found for session ID:', req.session.userId);
            req.session.destroy(err => {
                if (err) console.error('Error destroying session:', err);
                res.redirect('/login?error=Invalid session, please log in again.');
            });
            return;
        }

        res.render('profile', { user: user });

    } catch (error) {
        console.error('Error loading user profile:', error);
        res.render('profile', { user: null, error: 'Could not load profile data.' });
    }
});

// GET route for the Edit Profile form
app.get('/profile/edit', isAuthenticated, async (req, res) => {
    try {
        const user = await db.User.findByPk(req.session.userId);

        if (!user) {
            req.session.destroy(err => {
                if (err) console.error('Error destroying session:', err);
                res.redirect('/login?error=Session invalid, please log in again.');
            });
            return;
        }

        res.render('edit-profile', { user: user, error: null, success: null });

    } catch (error) {
        console.error('Error loading edit profile form:', error);
        res.render('edit-profile', { user: null, error: 'Could not load profile for editing.' });
    }
});

// POST route to handle profile updates
app.post('/profile/edit', isAuthenticated, async (req, res) => {
    const { username, email, newPassword, confirmNewPassword } = req.body;
    const userId = req.session.userId;
    let errors = [];

    try {
        const user = await db.User.findByPk(userId);

        if (!user) {
            console.error('Attempted to edit profile for non-existent user:', userId);
            req.session.destroy(err => {
                if (err) console.error('Error destroying session:', err);
                res.redirect('/login?error=Session invalid, please log in again.');
            });
            return;
        }

        // --- Server-Side Validation ---
        if (!username || username.trim() === '') {
            errors.push('Username cannot be empty.');
        }
        if (!email || email.trim() === '') {
            errors.push('Email cannot be empty.');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Please enter a valid email address.');
        }

        if (username && username !== user.username) {
            const existingUserWithUsername = await db.User.findOne({ where: { username: username } });
            if (existingUserWithUsername && existingUserWithUsername.id !== user.id) {
                errors.push('This username is already taken by another user.');
            }
        }

        if (email && email !== user.email) {
            const existingUserWithEmail = await db.User.findOne({ where: { email: email } });
            if (existingUserWithEmail && existingUserWithEmail.id !== user.id) {
                errors.push('This email is already registered to another account.');
            }
        }

        let hashedPassword = user.passwordHash;

        if (newPassword) {
            if (newPassword.length < 6) {
                errors.push('New password must be at least 6 characters long.');
            }
            if (newPassword !== confirmNewPassword) {
                errors.push('New password and confirmation do not match.');
            } else {
                const salt = await bcrypt.genSalt(10);
                hashedPassword = await bcrypt.hash(newPassword, salt);
            }
        } else if (confirmNewPassword) {
            errors.push('Please enter your new password in both fields, or leave both blank.');
        }

        // --- If Validation Fails ---
        if (errors.length > 0) {
            return res.render('edit-profile', {
                user: user,
                error: errors.join('<br>'),
                success: null
            });
        }

        // --- If Validation Passes ---
        user.username = username;
        user.email = email;

        if (newPassword && newPassword === confirmNewPassword) {
            user.passwordHash = hashedPassword;
        }

        await user.save();

        if (req.session.username !== user.username) {
            req.session.username = user.username;
        }

        console.log(`User ${user.username} profile updated successfully.`);
        res.render('edit-profile', {
            user: user,
            success: 'Profile updated successfully!',
            error: null
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.render('edit-profile', {
            user: req.session.userId ? await db.User.findByPk(req.session.userId) : null,
            error: 'An unexpected error occurred while updating your profile. Please try again.',
            success: null
        });
    }
});


// GET route for logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid');
        console.log('User logged out successfully.');
        res.redirect('/');
    });
});


// Day 10: GET route for discovering other users (Task 1 & 2)
app.get('/users', isAuthenticated, async (req, res) => {
    try {
        // First, fetch the currently logged-in user with their 'Following' association
        const loggedInUser = await db.User.findByPk(req.session.userId, {
            include: [{
                model: db.User,
                as: 'Following',       // This alias matches the 'as' in models/user.js
                attributes: ['id']     // We only need the IDs of users they are following
            }]
        });

        if (!loggedInUser) {
            req.session.destroy(err => {
                if (err) console.error('Error destroying session:', err);
                res.redirect('/login?error=Session invalid, please log in again.');
            });
            return;
        }

        // Extract IDs of users the logged-in user is currently following
        const followingIds = loggedInUser.Following.map(user => user.id);

        // Fetch all other users from the database EXCEPT the current logged-in user
        const allUsers = await db.User.findAll({
            where: {
                id: {
                    [db.Sequelize.Op.ne]: req.session.userId // Op.ne stands for "not equal"
                }
            },
            attributes: ['id', 'username', 'email', 'createdAt'], // Only fetch necessary attributes
            order: [['username', 'ASC']] // Optional: Order users by username
        });

        // Render the users.ejs template and pass the data
        res.render('users', {
            users: allUsers,
            loggedInUserId: req.session.userId, // Pass current user's ID
            followingIds: followingIds,         // Pass the list of IDs they are following
            error: req.query.error || null,     // Pass error messages from redirects
            success: req.query.success || null  // Pass success messages from redirects
        });

    } catch (error) {
        console.error('Error fetching users for discovery:', error);
        res.render('users', {
            users: [], // Pass an empty array on error
            loggedInUserId: req.session.userId,
            followingIds: [], // Ensure an empty array on error
            error: 'Could not load users at this time.',
            success: null
        });
    }
});


// Day 10: POST route to handle follow/unfollow actions (Task 4)
app.post('/users/toggle-follow', isAuthenticated, async (req, res) => {
    const { targetUserId } = req.body; // ID of the user being followed/unfollowed
    const followerId = req.session.userId; // ID of the currently logged-in user

    // Basic validation for targetUserId
    if (!targetUserId || isNaN(targetUserId)) {
        console.error('Invalid targetUserId received for toggle-follow:', targetUserId);
        return res.redirect('/users?error=Invalid user specified.');
    }

    try {
        // Fetch the follower (current logged-in user) with their current following list
        const follower = await db.User.findByPk(followerId, {
            include: [{
                model: db.User,
                as: 'Following',
                attributes: ['id'] // Only need IDs for checking existing relationship
            }]
        });

        // Fetch the user being followed/unfollowed
        const following = await db.User.findByPk(targetUserId);

        // Check if both users exist
        if (!follower || !following) {
            console.error(`Follower (ID: ${followerId}) or Following (ID: ${targetUserId}) user not found.`);
            return res.redirect('/users?error=User not found for action.');
        }

        // Prevent a user from following themselves
        if (follower.id === following.id) {
            console.warn('User attempted to follow themselves.');
            return res.redirect('/users?error=You cannot follow yourself.');
        }

        // Determine if the follower is currently following the target user
        // .some() checks if any element in the Following array satisfies the condition
        const isCurrentlyFollowing = follower.Following.some(user => user.id === following.id);

        if (isCurrentlyFollowing) {
            // If already following, then unfollow
            await follower.removeFollowing(following); // Sequelize method to remove association
            console.log(`User ${follower.username} unfollowed ${following.username}`);
            res.redirect('/users?success=User unfollowed!');
        } else {
            // If not following, then follow
            await follower.addFollowing(following); // Sequelize method to add association
            console.log(`User ${follower.username} followed ${following.username}`);
            res.redirect('/users?success=User followed!');
        }

    } catch (error) {
        console.error('Error toggling follow status:', error);
        res.redirect('/users?error=An unexpected error occurred while updating follow status.');
    }
});


// --- SERVER STARTUP AND DATABASE SYNCHRONIZATION ---

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  db.sequelize.sync()
    .then(() => {
      console.log('Database synced successfully');
    })
    .catch(err => {
      console.error('Error syncing database:', err);
    });
});