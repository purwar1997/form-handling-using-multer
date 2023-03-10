const express = require('express');
const multer = require('multer');
const config = require('./config/config');

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, './uploads');
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '.' + file.mimetype.replace('image/', '');
    cb(null, file.fieldname + '_' + uniqueSuffix);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (_req, file, cb) {
    if (file.mimetype.includes('image')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

const app = express();

app.set('view-engine', 'ejs');
app.use(express.json());

app.get('/api', (_req, res) => {
  res.status(200).render('form.ejs');
});

app.post('/api/upload', upload.array('profilePhotos', 5), (req, res) => {
  try {
    console.log(req.body, req.files);

    if (!req.body || Object.keys(req.body).length === 0) {
      throw new Error('No field values were provided');
    }

    const { name, email, password } = req.body;

    if (!(name && email && password)) {
      throw new Error('Please provide all the details');
    }

    if (!req.files || req.files.length === 0) {
      throw new Error('No files were uploaded');
    }

    res.status(200).json({
      success: true,
      data: {
        name,
        email,
        password,
        profilePhotos: req.files,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.listen(config.PORT, () => console.log(`Server is running on http://localhost:${config.PORT}`));
