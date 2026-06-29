import multer from 'multer';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  const error = new Error('Only image files are allowed');
  error.statusCode = 400;
  cb(error);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
});

export default upload;
