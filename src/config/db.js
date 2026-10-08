const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Đã kết nối MongoDB Atlas.');
    } catch (error) {
        console.error('❌ Lỗi kết nối CSDL:', error.message);
    }
};

module.exports = connectDB;