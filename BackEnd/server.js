require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('./db'); // connect to Neon

const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve all static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'HTML', 'index.html')); // Serve main page
});

/* =========================
   SIGNUP
========================= */
app.post('/api/signup', async (req, res) => {
  let { username, firstName, lastName, email, password } = req.body;

  // basic presence
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password required' });
  }

  // length limits
  if (username.length > 20 || (firstName && firstName.length > 20) || (lastName && lastName.length > 20)) {
    return res.status(400).json({ error: 'Fields cannot exceed 20 characters' });
  }

  // profanity filter (simple list)
  const badWords = ['shit', 'pussy', 'ass', 'dick', 'cunt', 'whore', 'fuck', 'slut', 'nigga', 'nigger', 'motherfucker', 'damn','bitch','asshole','bastard'];
  const checkProfane = str => {
    if (!str) return false;
    const lower = str.toLowerCase();
    return badWords.some(w => new RegExp(`\\b${w}\\b`,`i`).test(lower));
  };
  if (checkProfane(username) || checkProfane(firstName) || checkProfane(lastName)) {
    return res.status(400).json({ error: 'Please avoid using offensive words' });
  }

  // normalize names
  firstName = firstName ? firstName.trim() : '';
  lastName = lastName ? lastName.trim() : '';
  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  if (firstName) firstName = capitalize(firstName);
  if (lastName) lastName = capitalize(lastName);
  username = username.trim();
  email = email.trim().toLowerCase();

  try {
    // Check username
    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Check email
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (username, first_name, last_name, email, password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username`,
      [username, firstName, lastName, email, hashed]
    );
    console.log('New user created:', result.rows[0]);
    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

/* =========================
   CHECK USERNAME
========================= */
app.get('/api/check-username', async (req, res) => {
  const username = (req.query.username || '').trim();

  if (!username) return res.json({ available: false });

  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    res.json({ available: result.rows.length === 0 });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

/* =========================
   CHECK EMAIL
========================= */
app.get('/api/check-email', async (req, res) => {
  const email = (req.query.email || '').trim();

  if (!email) return res.json({ available: false });

  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    res.json({ available: result.rows.length === 0 });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

/* =========================
   LOGIN
========================= */
app.post('/api/login', async (req, res) => {
  const { email, username, password } = req.body;

  if ((!email && !username) || !password) {
    return res.status(400).json({ error: 'email/username and password required' });
  }

  try {
    let result;
    if (email) {
      console.log('Login attempt with email:', email);
      result = await pool.query(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
        [email]
      );
    } else {
      console.log('Login attempt with username:', username);
      result = await pool.query(
        'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
        [username]
      );
    }

    console.log('Query returned', result.rows.length, 'rows');

    if (result.rows.length === 0) {
      console.log('No user found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('User found:', user.username, user.email);

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      console.log('Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Login successful for:', user.username);
    res.json({
      success: true,
      user: { 
        id: user.id, 
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/* =========================
   NEWS FETCHING - Guardian
========================= */
// Node 18+ provides global fetch; no need for node-fetch import
// if running on an older runtime you could uncomment the following line:
// const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

app.get('/api/news', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 20;

  if (!process.env.GUARDIAN_API_KEY) {
    return res.status(500).json({ error: 'Guardian API key missing' });
  }

  try {
    // Guardian API base URL - only environment and science sections
    let url = `https://content.guardianapis.com/search?section=environment|science&order-by=newest&page-size=${pageSize}&page=${page}&show-fields=trailText,thumbnail,body&api-key=${process.env.GUARDIAN_API_KEY}`;

    // Optional user search query and category term
    let queryParts = [];
    if (req.query.category) {
      const cat = req.query.category.trim().toLowerCase();
      if (cat && cat !== 'all') {
        queryParts.push(cat);
      }
    }
    if (req.query.q) {
      const term = req.query.q.trim();
      if (term && term.toLowerCase() !== 'all') {
        queryParts.push(term);
      }
    }
    if (queryParts.length > 0) {
      // join with space so Guardian treats as AND
      url += `&q=${encodeURIComponent(queryParts.join(' '))}`;
    }

    // use global fetch
    const resp = await fetch(url);
    const data = await resp.json();

    if (!data.response || !data.response.results) {
      return res.status(500).json({ error: 'Invalid Guardian response' });
    }

    // Strong environmental keywords
    const strongKeywords = [
      "climate", "climate change", "sustainability", "renewable", "pollution",
      "biodiversity", "deforestation", "carbon", "emissions", "microplastics",
      "ocean", "waste", "recycling", "compost", "electric vehicle", "green tech",
      "biogas", "solar", "wind", "vertical farming", "sustainable agriculture"
    ];

    // Exclude unrelated keywords
    const excludeKeywords = ["football", "soccer", "NBA", "celebrity", "movie", "music", "gaming", "fashion"];

    // Filter articles
    const filtered = data.response.results.filter(article => {
      const text = (article.webTitle + " " + (article.fields?.trailText || "")).toLowerCase();
      const hasStrong = strongKeywords.some(word => text.includes(word));
      const hasExcluded = excludeKeywords.some(word => text.includes(word));
      // if the client explicitly requested a specific category (not 'all'),
      // require one of the strong keywords too; otherwise just drop excluded terms.
      if (req.query.category && req.query.category.trim().toLowerCase() !== 'all') {
        return hasStrong && !hasExcluded;
      } else {
        return !hasExcluded;
      }
    });

    // Return clean JSON for frontend
    res.json({
      totalResults: filtered.length,
      articles: filtered.map(a => ({
        id: a.id,
        title: a.webTitle,
        url: a.webUrl,
        thumbnail: a.fields?.thumbnail || null,
        snippet: a.fields?.trailText || null,
        section: a.sectionName,
        date: a.webPublicationDate
      }))
    });

  } catch (err) {
    console.error('Guardian fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch Guardian news' });
  }
});
/* =========================
   START SERVER
========================= */


// ensure users table exists
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        first_name TEXT,
        last_name TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);
    console.log('Verified users table exists');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

const port = process.env.PORT || 3000;
initDb().then(() => {
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
});