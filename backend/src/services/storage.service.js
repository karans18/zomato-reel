const ImageKit = require("imagekit");

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadFile(file, fileName) {
    try {
        const result = await imagekit.upload({
            file: file,
            fileName: fileName,
            folder: "/food-videos"
        });
        return result;
    } catch (err) {
        console.error("ImageKit upload error:", err);
        throw new Error("File upload failed. Please try again.");
    }
}

module.exports = {
    uploadFile
};
