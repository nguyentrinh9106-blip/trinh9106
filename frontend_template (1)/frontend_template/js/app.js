function escapeQuotes(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
}/**
 * LOGIC TƯƠNG TÁC GIAO DIỆN BÁN HÀNG TMĐT (FRONTEND TEMPLATE)
 */
// Hàm escape dấu nháy để tránh lỗi khi đưa vào onclick
function setupEventListeners() {
  // Đóng modal khi bấm nút X
  document.addEventListener('click', function(e) {
    // Đóng modal thanh toán khi bấm nút X
    if (e.target.closest('.modal-close') || e.target.classList.contains('close-modal')) {
      const modal = e.target.closest('.modal') || document.querySelector('.modal');
      if (modal) modal.remove();
    }

    // Đóng modal khi bấm nút "Tôi Đã Hoàn Tất Chuyển Khoản"
    if (e.target.closest('.btn-confirm-payment') || e.target.textContent.includes('Tôi Đã Hoàn Tất')) {
      const modal = e.target.closest('.modal') || document.querySelector('.modal');
      if (modal) {
        modal.remove();
        // Có thể thêm thông báo thành công ở đây nếu muốn
        alert('Cảm ơn bạn đã thanh toán! Đơn hàng đang được xử lý.');
      }
    }
  });
}

// Trạng thái ứng dụng
let currentCategory = '';
let currentSearch = '';
let currentSort = '';
let cart = JSON.parse(localStorage.getItem('LHU_CART') || '[]');

// Khi trang load xong
document.addEventListener('DOMContentLoaded', () => {
  initCategories();
  loadProducts();
  updateCartUI();
  setupEventListeners();
});

// 1. Khởi tạo danh mục
async function initCategories() {
  const catList = document.getElementById('categoryPills');
  if (!catList) return;

  const res = await API.getCategories();
  if (res.success && Array.isArray(res.data)) {
    let html = `<button class="cat-pill active" data-id="">Tất cả</button>`;
    res.data.forEach(cat => {
      html += `<button class="cat-pill" data-id="${cat._id}">${cat.name}</button>`;
    });
    catList.innerHTML = html;

    // Gán sự kiện click lọc danh mục
    catList.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        catList.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.getAttribute('data-id');
        loadProducts();
      });
    });
  }
}

// 2. Tải và hiển thị sản phẩm
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  const countEl = document.getElementById('productCount');
  if (!grid) return;

  grid.innerHTML = `<div class="state-box"><h3>⏳ Đang tải sản phẩm từ máy chủ API...</h3><p>Vui lòng đảm bảo Backend đã bật tại http://localhost:5000</p></div>`;

  const res = await API.getProducts({
    category: currentCategory,
    search: currentSearch,
    sort: currentSort
  });

  if (res.success && Array.isArray(res.data) && res.data.length > 0) {
    if (countEl) countEl.innerText = `Hiển thị ${res.data.length} sản phẩm`;
    
    grid.innerHTML = res.data.map(p => {
      const discount = p.originalPrice > p.salePrice ? Math.round(((p.originalPrice - p.salePrice) / p.originalPrice) * 100) : 0;
      const catName = p.category ? (p.category.name || p.category) : 'Sản phẩm';
      const imgUrl = p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

      return `
        <div class="product-card">
          <div class="product-thumb-wrap">
            <img src="${imgUrl}" alt="${p.name}" class="product-thumb" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'">
            ${discount > 0 ? `<span class="discount-tag">-${discount}%</span>` : ''}
          </div>
          <div class="product-details">
            <span class="product-category-name">${catName}</span>
            <h4 class="product-name" title="${p.name}">${p.name}</h4>
            <div class="product-rating">★ ${p.rating || 5.0} (Đã bán ${p.stock ? Math.floor(p.stock * 0.4) : 10}+)</div>
<div class="price-container">
              <span class="sale-price">${Number(p.salePrice).toLocaleString('vi-VN')} đ</span>
              ${p.originalPrice > p.salePrice ? `<span class="original-price">${Number(p.originalPrice).toLocaleString('vi-VN')} đ</span>` : ''}
            </div>
            <div class="card-actions">
              <button class="btn-add-cart" onclick="addToCart('${p._id}', '${escapeQuotes(p.name)}', ${p.salePrice}, '${imgUrl}')">
                🛒 Thêm giỏ
              </button>
              <button class="btn-view-quick" onclick="viewProductDetail('${p._id}')" title="Xem chi tiết">
                👁️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    if (countEl) countEl.innerText = '0 sản phẩm';
    grid.innerHTML = `
      <div class="state-box">
        <h3>🔍 Không tìm thấy sản phẩm nào!</h3>
        <p>Thử tìm với từ khóa khác hoặc bấm nút "Tất cả" danh mục nhé.</p>
      </div>
    `;
  }
}

// 3. Quản lý Giỏ hàng (Shopping Cart)
function addToCart(id, name, price, image) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, name, price, image, quantity: 1 });
  }
  saveCart();
  updateCartUI();
  openCartDrawer();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
  updateCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('LHU_CART', JSON.stringify(cart));
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const badge = document.getElementById('cartBadge');
  if (badge) badge.innerText = totalCount;

  const body = document.getElementById('cartItemsBody');
  const subtotal = document.getElementById('cartSubtotal');

  if (subtotal) subtotal.innerText = `${totalPrice.toLocaleString('vi-VN')} đ`;

  if (body) {
    if (cart.length === 0) {
      body.innerHTML = `<div style="text-align: center; padding: 40px 10px; color: #94a3b8;"><p style="font-size: 36px; margin-bottom: 8px;">🛒</p><p>Giỏ hàng đang trống!</p></div>`;
    } else {
      body.innerHTML = cart.map(i => `
        <div class="cart-item">
          <img src="${i.image}" class="cart-item-img" alt="${i.name}">
          <div class="cart-item-info">
            <h5 class="cart-item-name">${i.name}</h5>
            <div class="cart-item-price">${(i.price * i.quantity).toLocaleString('vi-VN')} đ</div>
            <div class="qty-control">
              <button class="qty-btn" onclick="changeQty('${i.id}', -1)">-</button>
<span class="qty-val">${i.quantity}</span>
              <button class="qty-btn" onclick="changeQty('${i.id}', 1)">+</button>
            </div>
          </div>
          <button class="btn-item-del" onclick="removeFromCart('${i.id}')" title="Xóa món này">✕</button>
        </div>
      `).join('');
    }
  }
}

// 4. Mở/Đóng Cart Drawer
function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (drawer && backdrop) {
    backdrop.style.display = 'block';
    setTimeout(() => drawer.classList.add('open'), 10);
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('open');
    setTimeout(() => { backdrop.style.display = 'none'; }, 300);
  }
}

// 5. Checkout & Tạo đơn hàng
function openCheckoutModal() {
  if (cart.length === 0) {
    alert('Giỏ hàng trống! Vui lòng chọn mua sản phẩm trước khi thanh toán.');
    return;
  }
  closeCartDrawer();
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.remove('hidden');
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.add('hidden');
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('btnSubmitOrder');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = '⏳ Đang xử lý đơn hàng...';
  }

  const customerName = form.customerName.value.trim();
  const customerPhone = form.customerPhone.value.trim();
  const customerEmail = form.customerEmail.value.trim();
  const shippingAddress = form.shippingAddress.value.trim();
  const paymentMethod = form.paymentMethod.value;
  const note = form.note ? form.note.value.trim() : '';
  
  // Lưu tổng tiền trước khi xóa giỏ hàng
  const shippingFee = 25000;

  const cartItemsSnapshot = cart.map(i => ({
    productId: i.id,
    name: i.name,
    quantity: Number(i.quantity) || 1,
    price: Number(i.price) || 0
  }));

  const cartSubtotal = cartItemsSnapshot.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const checkoutTotal = cartSubtotal + shippingFee;


  const orderData = {
    customerName,
    customerPhone,
    customerEmail,
    shippingAddress,
    paymentMethod,
    note,
    
    items: cartItemsSnapshot,
    shippingFee: shippingFee,
    totalAmount: checkoutTotal
  };

  const res = await API.createOrder(orderData);
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Xác Nhận Đặt Hàng';
  }

  
  if (res.success && res.data) {
    const apiOrder = res.data.order || res.data;

    const createdOrder = {
      ...apiOrder,
      items: Array.isArray(apiOrder.items) && apiOrder.items.length
        ? apiOrder.items
        : cartItemsSnapshot,
      shippingFee: Number(
        apiOrder.shippingFee ?? apiOrder.shipping_fee ?? shippingFee
      ),
      totalAmount: Number(
        apiOrder.totalAmount ??
        apiOrder.totalPrice ??
        apiOrder.finalAmount ??
        apiOrder.amount ??
        checkoutTotal
      )
    };

    
if (paymentMethod === 'VIETQR' || paymentMethod === 'MOMO_QR') {
  console.log('ORDER DATA:', createdOrder);
  showQRModal(createdOrder, paymentMethod);
} else {
  alert(`🎉 Đặt hàng thành công!\nMã đơn hàng: #${createdOrder.orderCode || createdOrder._id}`);
}

// Xóa giỏ hàng sau khi đặt hàng thành công
cart = [];
saveCart();
updateCartUI();

} else {
  alert(`❌ Đặt hàng thất bại: ${res.message || 'Lỗi không xác định'}`);
}

}
// 6. Hiển thị Modal Thanh Toán QR (VietQR / MoMo)
function showQRModal(order, method) {
 console.log('ORDER DATA:', order);   // ← đặt đúng chỗ này
 

  const modal = document.getElementById('qrModal');
  const qrImg = document.getElementById('qrImage');
  const orderCodeEl = document.getElementById('qrOrderCode');
  const totalEl = document.getElementById('qrTotalAmount');
  const infoEl = document.getElementById('qrNoteInfo');

 
const safeOrder = order && typeof order === 'object'
  ? order
  : {};

const orderCode =
  safeOrder.orderCode ||
  safeOrder.order_code ||
  (safeOrder._id
    ? String(safeOrder._id).slice(-8).toUpperCase()
    : 'XXXXXX');


let totalAmount = Number(
  safeOrder.totalAmount ??
  safeOrder.totalPrice ??
  safeOrder.finalAmount ??
  safeOrder.amount ??
  safeOrder.total ??
  0
);

if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
  const orderItems = Array.isArray(safeOrder.items)
    ? safeOrder.items
    : [];

  const itemsTotal = orderItems.reduce((sum, item) => {
    return sum +
      Number(item.price || 0) * Number(item.quantity || 1);
  }, 0);

  const fee = Number(
    safeOrder.shippingFee ??
    safeOrder.shipping_fee ??
    25000
  );

  totalAmount = itemsTotal + fee;
}



if (!totalAmount && Array.isArray(order.items)) {
  const itemsTotal = order.items.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 1);
  }, 0);

  totalAmount = itemsTotal + Number(
    order.shippingFee ?? order.shipping_fee ?? 25000
  );
}

  // Nếu vẫn 0 thì lấy từ giỏ hàng hiện tại (backup)
  if (!totalAmount || totalAmount === 0) {
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalAmount = cartTotal + 25000;
  }

  // Cập nhật giao diện
  if (orderCodeEl) orderCodeEl.innerText = `#${orderCode}`;
  if (totalEl) totalEl.innerText = `${Number(totalAmount).toLocaleString('vi-VN')} đ`;
  if (infoEl) infoEl.innerText = `Chuyển khoản thanh toán ĐH #${orderCode}`;

  // Tạo mã QR
  if (qrImg) {
    if (method === 'VIETQR') {
      const bankId = 'VCB';
      const accountNo = '1050921205';
      const accountName = 'NGUYEN LE PHUONG TRINH';
      const addInfo = encodeURIComponent(`DH ${orderCode}`);
      const encodedName = encodeURIComponent(accountName);

      qrImg.src =
        `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png` +
        `?amount=${totalAmount}` +
        `&addInfo=${addInfo}` +
        `&accountName=${encodedName}`;
    } else {
      const momoPhone = '0388145357';
      const momoData = encodeURIComponent(
        `2|99|${momoPhone}|NGUYENLEPHUONGTRINH||0|0|${totalAmount}|DH ${orderCode}|transfer_myqr`
      );
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${momoData}`;
    }
  }

  // Hiện modal
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}

// 7. Xem chi tiết sản phẩm Modal
async function viewProductDetail(id) {
  const modal = document.getElementById('productDetailModal');
  const content = document.getElementById('productDetailContent');
  if (!modal || !content) return;

  content.innerHTML = `<p style="text-align:center; padding:30px;">⏳ Đang tải thông tin...</p>`;
  modal.classList.remove('hidden');

  const res = await API.getProductById(id);
  if (res.success && res.data) {
    console.log('KẾT QUẢ TẠO ĐƠN:', res);
    const p = res.data;
    const catName = p.category ? (p.category.name || p.category) : 'Sản phẩm';
    const imgUrl = p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

    content.innerHTML = `
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <img src="${imgUrl}" style="width: 100%; max-width: 220px; height: 220px; object-fit: cover; border-radius: 8px;">
        <div style="flex: 1; min-width: 200px;">
          <span style="font-size: 12px; color: #2563eb; font-weight: bold; text-transform: uppercase;">${catName}</span>
          <h3 style="font-size: 18px; margin: 6px 0 10px 0;">${p.name}</h3>
          <div style="font-size: 22px; font-weight: bold; color: #ef4444; margin-bottom: 12px;">
            ${Number(p.salePrice).toLocaleString('vi-VN')} đ
          </div>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 16px;">${p.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}</p>
          <div style="font-size: 13px; color: #0f172a; margin-bottom: 16px;">
            📦 Kho: <strong>${p.stock || 0}</strong> sản phẩm | ⭐ Đánh giá: <strong>${p.rating || 5.0} / 5.0</strong>
          </div>
          <button class="btn-checkout-start" onclick="addToCart('${p._id}', '${escapeQuotes(p.name)}', ${p.salePrice}, '${imgUrl}'); closeProductDetailModal();">
            🛒 Thêm Vào Giỏ Hàng
          </button>
        </div>
      </div>
    `;
  }
}

function closeProductDetailModal() {
  const modal = document.getElementById('productDetailModal');
  if (modal) modal.classList.add('hidden');
}

// Lắng nghe sự kiện tìm kiếm & sắp xếp
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        loadProducts();
      }, 350);
    });
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      loadProducts();
    });
  }
}

function escapeQuotes(str) {
  if (!str) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}
// ====================== ĐÓNG MODAL QR ======================
function closeQRModal() {
  const modal = document.getElementById('qrModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  alert('Cảm ơn bạn! Đơn hàng của bạn sẽ được nhân viên duyệt ngay sau khi hệ thống nhận được thông báo chuyển khoản.');
}