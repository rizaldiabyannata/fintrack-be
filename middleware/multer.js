const multer = require("multer");
const path = require("path");
const logger = require("../utils/logUtils"); // Path ke file logger.js

// Konfigurasi storage untuk Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Menentukan folder penyimpanan file upload
    cb(null, "uploads/"); // Pastikan folder 'uploads' sudah ada
    logger.info(`Uploading file to 'uploads/' folder`); // Log informasi upload
  },
  filename: function (req, file, cb) {
    // Menentukan nama file yang disimpan (menggunakan timestamp untuk mencegah nama file duplikat)
    const filename = Date.now() + path.extname(file.originalname);
    cb(null, filename);
    logger.info(`File will be saved as: ${filename}`); // Log nama file yang akan disimpan
  },
});

// Filter untuk hanya menerima file dengan ekstensi tertentu
const fileFilter = (req, file, cb) => {
  // Membatasi jenis file yang dapat di-upload (misalnya, hanya gambar)
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    logger.info(`File type accepted: ${file.mimetype}`); // Log jika file type diterima
    return cb(null, true); // Izinkan file
  } else {
    logger.error(`File type rejected: ${file.mimetype}`); // Log jika file type ditolak
    cb(new Error("File type is not allowed"), false); // Tolak file jika tidak sesuai
  }
};

// Ukuran file maksimal (misalnya 2MB)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // Batasan ukuran file 2MB
});

// Middleware untuk upload satu file (misalnya file gambar)
const uploadSingle = (req, res, next) => {
  upload.single("file")(req, res, function (err) {
    if (err) {
      logger.error(`Error uploading file: ${err.message}`); // Log error saat upload gagal
      return res.status(400).json({ message: err.message });
    }
    logger.info(`File uploaded successfully: ${req.file?.path}`); // Log jika upload berhasil
    next();
  });
};

// Middleware untuk upload banyak file (misalnya beberapa gambar)
const uploadMultiple = (req, res, next) => {
  upload.array("files", 5)(req, res, function (err) {
    // Maksimal 5 file
    if (err) {
      logger.error(`Error uploading files: ${err.message}`); // Log error saat upload gagal
      return res.status(400).json({ message: err.message });
    }
    logger.info(`Files uploaded successfully: ${req.files.length} files`); // Log jika upload banyak file berhasil
    next();
  });
};

module.exports = {
  uploadSingle,
  uploadMultiple,
};
