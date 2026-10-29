
require('dotenv').config();

console.log('BANK_ID:', process.env.BANK_ID);
console.log('BANK_ACCOUNT_NO:', process.env.BANK_ACCOUNT_NO);
console.log('BANK_ACCOUNT_NAME:', process.env.BANK_ACCOUNT_NAME);

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Các routes cũ
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Các routes mới
const paymentRoutes = require('./routes/paymentRoutes');
const aiRoutes = require('./routes/aiRoutes');
const shippingRoutes = require('./routes/shippingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Kết nối MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kiểm tra server
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Hệ thống Quản lý Đơn hàng hoạt động ổn định!'
  });
});

// Đăng ký các routes cũ
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Đăng ký các routes mới
app.use('/api/payment', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/shipping', shippingRoutes);

// Xử lý đường dẫn không tồn tại
// PHẢI đặt sau tất cả routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại!`
  });
});

// Khởi động server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`🛒 Test Đặt hàng: POST http://localhost:${PORT}/api/orders`);
  console.log(`📋 Test Danh sách đơn: GET http://localhost:${PORT}/api/orders`);
  console.log(`🤖 Chatbot AI: POST http://localhost:${PORT}/api/ai/chat`);
  console.log('====================================================');
});
