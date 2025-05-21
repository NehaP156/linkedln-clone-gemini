const express = require('express');
const app = express();
const path = require('path');
const db = require('./models'); // Your database models setup (from Day 6)
const bcrypt = require('bcryptjs'); // Day 7: Import bcryptjs for password hashing

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

// --- ROUTES ---

// GET route for the home page
app.get('/', (req, res) => {
  res.render('home'); // Assuming you have a views/home.ejs file
});

// GET route for the registration page (Day 5/6 setup)
app.get('/register', (req, res) => {
  res.render('register', { error: null }); // Pass null for error initially
});

// POST route for user registration (Day 7, Task 4: Password Hashing)
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body; // Extract username, email, and plain text password

  try {
    // 1. Generate a salt (a random string for password hashing)
    // The '10' is the number of salt rounds (cost factor). Higher is slower but more secure.
    const salt = await bcrypt.genSalt(10);

    // 2. Hash the password with the generated salt
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the user in the database using the HASHED password
    // Ensure 'password' here matches your database column name (likely 'password' from migration)
    const newUser = await db.User.create({
      username,
      email,
      passwordHash: hashedPassword, // Store the hashed password here
    });

    console.log('User registered successfully:', newUser.username);
    // Redirect to the login page, signaling successful registration via query param
    res.redirect('/login?registered=true');

  } catch (error) {
    console.error('Error during user registration:', error);
    // Handle specific error types, e.g., unique constraint violation for username/email
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.render('register', { error: 'Username or email already exists. Please choose another.' });
    } else {
      res.render('register', { error: 'An error occurred during registration. Please try again.' });
    }
  }
});

// GET route for the login page (Day 7, Task 5: Display Login Form)
app.get('/login', (req, res) => {
  // Check if we were redirected from a successful registration (via query param)
  const registered = req.query.registered === 'true';
  res.render('login', { error: null, registered: registered });
});

// POST route for user login (Day 7, Task 6: Implement Login Logic)
app.post('/login', async (req, res) => {
  const { username, password } = req.body; // Get username/email and plain text password from the form

  try {
    // 1. Find the user by username or email in the database
    const user = await db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: [ // Use Sequelize.Op.or to search by either username OR email
          { username: username },
          { email: username }
        ]
      }
    });

    // 2. Check if user exists
    if (!user) {
      console.log(`Login failed: User '${username}' not found.`);
      // Render login page with an error message
      return res.render('login', { error: 'Invalid username or password.', registered: false });
    }

 // --- ADD THESE LINES FOR DEBUGGING ---
    console.log("DEBUG: Plain text password (from req.body):", password);
    console.log("DEBUG: Type of plain text password:", typeof password);
    console.log("DEBUG: Stored user object from DB:", user);
    console.log("DEBUG: Type of user.password (from DB):", typeof user.password);
    console.log("DEBUG: Value of user.password (from DB):", user.password);
    // --- END DEBUGGING LINES ---

    // 3. Compare the provided plain password with the stored hashed password
    // bcrypt.compare() automatically handles salting and hashing internally.
    const passwordMatch = await bcrypt.compare(password, user.passwordHash); // 'user.password' is the stored hash

    if (passwordMatch) {
      console.log(`Login successful for user: ${user.username}`);
      // TODO (Future Day): In a real application, you would set up a session here
      // (e.g., using 'express-session') to keep the user logged in across requests.
      // For now, we'll just redirect to a simple dashboard page.
      res.redirect('/dashboard');
    } else {
      console.log(`Login failed: Incorrect password for user: ${user.username}`);
      // Render login page with an error message
      return res.render('login', { error: 'Invalid username or password.', registered: false });
    }

  } catch (error) {
    console.error('Error during user login:', error);
    res.render('login', { error: 'An error occurred during login. Please try again.', registered: false });
  }
});

// GET route for the dashboard page (Day 7, Task 7: Simple Dashboard)
app.get('/dashboard', (req, res) => {
  // In a real app, you'd protect this route and pass user-specific data
  res.render('dashboard'); // Renders your views/dashboard.ejs file
});


// --- SERVER STARTUP AND DATABASE SYNCHRONIZATION ---

// Define the port the server will listen on
const PORT = process.env.PORT || 3000;

// Start the server and synchronize database models (creates tables if they don't exist)
// Note: For production deployments, you typically run migrations explicitly,
// but for development, db.sequelize.sync() is convenient.
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