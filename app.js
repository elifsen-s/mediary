require('dotenv').config({ path: 'config.env' });
const express = require('express');
const path = require('path');
const { initDb } = require('./db/pool');
const { getUser } = require('./helpers');

const app = express();
const PORT = process.env.PORT || 3000;

// --- GLOBAL STATE (Simple variable instead of session) ---
let CURRENT_USER_ID = null;
const getCurrentUserId = () => CURRENT_USER_ID;
const setCurrentUserId = (id) => { CURRENT_USER_ID = id; };

// --- INITIALIZE DATABASE ---
initDb();

// --- MIDDLEWARE & VIEW ENGINE ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach current user to every response
app.use(async (req, res, next) => {
    res.locals.currentUserId = CURRENT_USER_ID;
    const user = await getUser(CURRENT_USER_ID);
    res.locals.loggedInUser = user;
    res.locals.user = user;
    res.locals.showLogin = req.query.auth === 'login' || req.query.error === '1';
    res.locals.loginError = req.query.error === '1' ? 'Incorrect username or password!' : null;
    next();
});

// --- BIND ROUTES ---
app.use('/', require('./routes/auth')(getCurrentUserId, setCurrentUserId));
app.use('/', require('./routes/feed')(getCurrentUserId));
app.use('/', require('./routes/content')(getCurrentUserId));
app.use('/', require('./routes/user')(getCurrentUserId));

// --- START SERVER ---
app.listen(PORT, () => console.log(`>>> Mediary server running at http://localhost:${PORT}`));