require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const session = require('express-session');

const app = express();
const PORT = 3000;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

const AVAILABLE_CATEGORIES = ['General', 'Technology', 'Lifestyle', 'Academic'];

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

app.post('/signup', async (req, res) => {
  const { user_id, password, name } = req.body;
  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (existingUser.rows.length > 0) {
      return res.render('signup', { error: 'User ID is already taken. Please choose another.' });
    }

    await pool.query('INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)', [
      user_id,
      password,
      name,
    ]);
    res.redirect('/signin');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error during Signup');
  }
});

app.get('/signin', (req, res) => {
  res.render('signin', { error: null });
});

app.post('/signin', async (req, res) => {
  const { user_id, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1 AND password = $2', [
      user_id,
      password,
    ]);

    if (result.rows.length === 0) {
      return res.render('signin', { error: 'Invalid User ID or Password. Please try again.' });
    }

    req.session.user = {
      user_id: result.rows[0].user_id,
      name: result.rows[0].name,
    };

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error during Sign-in');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/signin');
  });
});

app.get('/', async (req, res) => {
  const activeCategory = req.query.cat || 'ALL';
  try {
    let query = 'SELECT * FROM blogs';
    let params = [];

    if (activeCategory !== 'ALL') {
      query += ' WHERE category = $1';
      params.push(activeCategory);
    }
    query += ' ORDER BY date_created DESC';

    const postsResult = await pool.query(query, params);

    res.render('index', {
      posts: postsResult.rows,
      categories: AVAILABLE_CATEGORIES,
      currentFilter: activeCategory,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading blog feed');
  }
});

app.post('/create-post', async (req, res) => {
  if (!req.session.user) return res.redirect('/signin');

  const { postTitle, postCategory, postContent } = req.body;
  const { user_id, name } = req.session.user;

  try {
    await pool.query(
      'INSERT INTO blogs (creator_name, creator_user_id, title, body, category) VALUES ($1, $2, $3, $4, $5)',
      [name, user_id, postTitle, postContent, postCategory]
    );
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating post');
  }
});

app.get('/edit-post/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/signin');

  const targetId = req.params.id;
  const currentUserId = req.session.user.user_id;

  try {
    const postResult = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [targetId]);
    if (postResult.rows.length === 0) {
      return res.status(404).send('Blog Post Not Found');
    }

    const post = postResult.rows[0];

    if (post.creator_user_id !== currentUserId) {
      return res.status(403).send('Unauthorized: You can only edit your own posts.');
    }

    res.render('edit', { post, categories: AVAILABLE_CATEGORIES });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading edit page');
  }
});

app.post('/update-post/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/signin');

  const targetId = req.params.id;
  const currentUserId = req.session.user.user_id;
  const { postTitle, postCategory, postContent } = req.body;

  try {
    const postResult = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [targetId]);
    if (postResult.rows.length === 0) return res.status(404).send('Post not found');

    if (postResult.rows[0].creator_user_id !== currentUserId) {
      return res.status(403).send('Unauthorized action.');
    }

    await pool.query(
      'UPDATE blogs SET title = $1, body = $2, category = $3 WHERE blog_id = $4',
      [postTitle, postContent, postCategory, targetId]
    );

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating post');
  }
});

app.post('/delete-post/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/signin');

  const targetId = req.params.id;
  const currentUserId = req.session.user.user_id;

  try {
    const postResult = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [targetId]);
    if (postResult.rows.length === 0) return res.status(404).send('Post not found');

    if (postResult.rows[0].creator_user_id !== currentUserId) {
      return res.status(403).send('Unauthorized action.');
    }

    await pool.query('DELETE FROM blogs WHERE blog_id = $1', [targetId]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting post');
  }
});

app.listen(PORT, () => {
  console.log(`Blog server listening on port ${PORT}`);
});