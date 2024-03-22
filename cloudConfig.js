const cloudinary = require("cloudinary").v2;
const {CloudinaryStorage} = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name:"dgjbnesrx",
    api_key:195211865949623,
    api_secret:"BdKeRlFby-fwizV48mO7R3ISIxs",
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'JourneyEase_DEV',
      allowedFormats: ["png", "jpg", "jpeg", "heic"],
      maxFileSize: 10 * 1024 * 1024, // 10 MB 
    },
  });


  module.exports = {
    cloudinary,
    storage,
};
  