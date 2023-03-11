const express = require('express');
const multer = require('multer');
const cloudinary = require('./config/cloudinary.config');
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

app.post('/api/upload', upload.array('profilePhotos', 5), async (req, res) => {
  try {
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

    let images;

    try {
      images = await Promise.all(
        req.files.map(async file => {
          const res = await cloudinary.uploader.upload(file.path, {
            folder: 'users',
            use_filename: true,
            unique_filename: false,
            overwrite: true,
            resource_type: 'image',
            tags: 'profileImages',
          });

          return { id: res.public_id, url: res.secure_url };
        })
      );
    } catch (err) {
      throw new Error('Failure uploading files to the cloudinary');
    }

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        name,
        email,
        password,
        images,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.get('/api/fetch/all', async (_req, res) => {
  try {
    const response = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload',
      prefix: 'users',
    });

    const images = response.resources.map(resource => {
      return { id: resource.public_id, url: resource.secure_url };
    });

    res.status(200).json({
      success: true,
      message: 'Images successfully fetched',
      images,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.get('/api/fetch', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      throw new Error('Please provide public ID of image');
    }

    const response = await cloudinary.api.resource(id, {
      resource_type: 'image',
    });

    const image = { id: response.public_id, url: response.secure_url };

    res.status(200).json({
      success: true,
      message: 'Image successfully fetched',
      image,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.delete('/api/delete/all', async (_req, res) => {
  try {
    await cloudinary.api.delete_resources_by_prefix('users', { resource_type: 'image' });

    res.status(200).json({
      success: true,
      message: 'Images successfully deleted',
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.delete('/api/delete', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      throw new Error('Please provide public ID of image');
    }

    await cloudinary.uploader.destroy(id, { resource_type: 'image' });

    res.status(200).json({
      success: true,
      message: 'Image successfully deleted',
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.listen(config.PORT, () => console.log(`Server is running on http://localhost:${config.PORT}`));
