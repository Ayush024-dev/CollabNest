import multer from 'multer';

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/assets/upload'); 
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); 
  }
});
const upload = multer({ storage: storage });

export default upload