const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');

// 文件上传配置
const upload = multer({
  dest: 'public/uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// 首页 - 显示所有应用
router.get('/', async (req, res) => {
  const [apps] = await req.app.locals.db.query('SELECT * FROM apps');
  res.render('home', {
    layout: 'main',
    apps,
    user: req.session.user
  });
});

// 应用详情页
router.get('/app/:id', async (req, res) => {
  const [apps] = await req.app.locals.db.query('SELECT * FROM apps WHERE id = ?', [req.params.id]);
  if (apps.length === 0) {
    return res.status(404).send('App not found');
  }
  res.render('app-detail', {
    layout: 'main',
    app: apps[0],
    user: req.session.user
  });
});

// 应用上传页面
router.get('/upload', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('upload', { layout: 'main', user: req.session.user });
});

// 处理应用上传
router.post('/upload', upload.fields([
  { name: 'icon', maxCount: 1 },
  { name: 'screenshots', maxCount: 5 }
]), async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const { name, description } = req.body;
  const icon = req.files['icon'] ? req.files['icon'][0].filename : null;
  const screenshots = req.files['screenshots'] ? req.files['screenshots'].map(f => f.filename) : [];
  
  await req.app.locals.db.query(
    'INSERT INTO apps (name, description, icon, screenshots, user_id) VALUES (?, ?, ?, ?, ?)',
    [name, description, icon, JSON.stringify(screenshots), req.session.user.id]
  );
  res.redirect('/');
});

// 登录页面
router.get('/login', (req, res) => {
  res.render('login', { layout: 'main' });
});

// 处理登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const [users] = await req.app.locals.db.query('SELECT * FROM users WHERE username = ?', [username]);
  if (users.length === 0 || !await bcrypt.compare(password, users[0].password)) {
    return res.render('login', { layout: 'main', error: 'Invalid credentials' });
  }
  req.session.user = users[0];
  res.redirect('/');
});

// 注册页面
router.get('/register', (req, res) => {
  res.render('register', { layout: 'main' });
});

// 处理注册
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await req.app.locals.db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.redirect('/login');
  } catch (err) {
    res.render('register', { layout: 'main', error: 'Username already exists' });
  }
});

// 登出
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
