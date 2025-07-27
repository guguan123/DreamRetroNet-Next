const express = require('express');
const mysql = require('mysql2/promise');
const handlebars = require('express-handlebars');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const app = express();

// MySQL 连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'app_store'
};

// Multer 配置用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'icon') {
      cb(null, 'public/uploads/icons/');
    } else if (file.fieldname === 'screenshots') {
      cb(null, 'public/uploads/screenshots/');
    } else if (file.fieldname === 'appFile') {
      cb(null, 'public/uploads/apps/');
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 中间件
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));
app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// 数据库初始化
async function initDb() {
  const connection = await mysql.createConnection({ ...dbConfig, database: null });
  await connection.query('CREATE DATABASE IF NOT EXISTS app_store');
  await connection.end();

  const db = await mysql.createConnection(dbConfig);
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS apps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      icon VARCHAR(255),
      screenshots JSON,
      file VARCHAR(255) NOT NULL,
      user_id INT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  return db;
}

// 路由
const routes = require('./routes/index');
app.use('/', routes);

// 启动服务器
const PORT = 3000;
initDb().then(db => {
  app.locals.db = db;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => console.error('Database initialization failed:', err));
