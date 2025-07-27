const multer = require('multer');

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

// 导出 upload 中间件供 routes 使用
module.exports = { upload };
