
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

async function addProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    const categories = [
      { name: 'Thời Trang Nam', slug: 'thoi-trang-nam' },
      { name: 'Thời Trang Nữ', slug: 'thoi-trang-nu' }
    ];

    const categoryIds = [];

    for (const category of categories) {
      let existing = await Category.findOne({ slug: category.slug });

      if (!existing) {
        existing = await Category.create(category);
      }

      categoryIds.push(existing._id);
    }

    const products = [
      {
        name: 'Áo Thun Polo LHU Cao Cấp',
        category: categoryIds[0],
        brand: 'LHU Fashion',
        originalPrice: 250000,
        salePrice: 199000,
        stock: 50,
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500',
        description: 'Chất liệu cotton 100% thoáng mát.',
        rating: 4.9,
        isFeatured: true
      },
      {
        name: 'Đầm Xòe Nữ Phong Cách Hàn Quốc',
        category: categoryIds[1],
        brand: 'Korean Style',
        originalPrice: 420000,
        salePrice: 349000,
        stock: 25,
        image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=500',
        description: 'Thiết kế thanh lịch, nhẹ nhàng.',
        rating: 5.0,
        isFeatured: true
      }
    ];

    for (const product of products) {
      const existing = await Product.findOne({ name: product.name });

      if (!existing) {
        await Product.create(product);
        console.log('✅ Đã thêm:', product.name);
      } else {
        console.log('⏭️ Đã tồn tại:', product.name);
      }
    }

    console.log('🎉 Hoàn tất bổ sung sản phẩm!');
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

addProducts();
