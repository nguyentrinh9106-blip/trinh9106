
const Order = require('../models/Order');

// [POST] /api/payment/create-qr
// Tạo mã QR thanh toán động
exports.createPaymentQR = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng!'
      });
    }

    const totalAmount = order.totalAmount;
    const orderCode = order.orderCode;
    let qrUrl = '';

    if (paymentMethod === 'VIETQR' || !paymentMethod) {
      const bankId = process.env.BANK_ID;
      const accountNo = process.env.BANK_ACCOUNT_NO;
      const accountName = process.env.BANK_ACCOUNT_NAME;

      if (!bankId || !accountNo || !accountName) {
        return res.status(500).json({
          success: false,
          message: 'Thiếu cấu hình tài khoản VietQR trong file .env'
        });
      }

      const addInfo = encodeURIComponent(`DH ${orderCode}`);
      const encodedName = encodeURIComponent(accountName);

      qrUrl =
        `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png` +
        `?amount=${totalAmount}` +
        `&addInfo=${addInfo}` +
        `&accountName=${encodedName}`;
    } else if (paymentMethod === 'MOMO_QR') {
      const momoPhone = process.env.MOMO_PHONE;

      if (!momoPhone) {
        return res.status(500).json({
          success: false,
          message: 'Thiếu cấu hình MOMO_PHONE trong file .env'
        });
      }

      const momoName = encodeURIComponent('LHU STORE');
      const momoData = encodeURIComponent(
        `2|99|${momoPhone}|${momoName}||0|0|${totalAmount}|DH ${orderCode}|transfer_myqr`
      );

      qrUrl =
        `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${momoData}`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán không hợp lệ!'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tạo mã thanh toán QR thành công',
      data: {
        orderId: order._id,
        orderCode: order.orderCode,
        totalAmount,
        paymentMethod: paymentMethod || 'VIETQR',
        qrUrl,
        transferNote: `DH ${orderCode}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// [POST] /api/payment/confirm-paid
// Xác nhận thanh toán
exports.confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng!'
      });
    }

    // Lưu ý: Chỉ xác nhận PAID sau khi đã xác minh nhận được tiền.
    order.paymentStatus = 'PAID';
    order.orderStatus = 'CONFIRMED';

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Xác nhận thanh toán thành công!',
      data: order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
