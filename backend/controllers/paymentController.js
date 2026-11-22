const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const BatchEnrollment = require('../models/BatchEnrollment');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { courseId, batchId } = req.body;

    if (!courseId || !batchId) {
        return res.status(400).json({ success: false, message: 'Course ID and Batch ID are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    if (batch.course?.toString() !== course._id.toString()) {
        return res.status(400).json({ success: false, message: 'This batch does not belong to the selected course' });
    }

    // Use batch price if set, otherwise fall back to course price
    const amount = batch.batchPrice > 0 ? batch.batchPrice : course.price;

    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: 'Some error occured' });
    }

    // Remember who this order is for and what it buys, so verify-payment can use
    // these server-side values instead of trusting courseId/batchId from the client.
    await Payment.create({
      razorpay_order_id: order.id,
      amount,
      user: req.user.id,
      course: course._id,
      batch: batch._id,
      status: 'created'
    });

    res.json({
      success: true,
      data: order,
      key_id: process.env.RAZORPAY_KEY_ID 
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify-payment
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const received = Buffer.from(String(razorpay_signature));
    const expected = Buffer.from(expectedSignature);
    const isAuthentic = received.length === expected.length && crypto.timingSafeEqual(received, expected);

    if (isAuthentic) {
      // Payment Successful. The course, batch and amount come from the order this user
      // created (see createOrder), never from the request body; otherwise a user could pay
      // for a cheap batch and send the id of an expensive one here.
      const payment = await Payment.findOne({ razorpay_order_id, user: req.user.id });
      if (!payment || !payment.batch) {
        return res.status(400).json({ success: false, message: 'Order not found for this account' });
      }

      const batch = await Batch.findById(payment.batch);
      if (!batch) {
        return res.status(404).json({ success: false, message: 'Selected batch not found' });
      }
      const courseId = payment.course;
      const amount = payment.amount;

      // 1. Mark the payment as successful
      if (payment.status !== 'success') {
        payment.razorpay_payment_id = razorpay_payment_id;
        payment.razorpay_signature = razorpay_signature;
        payment.status = 'success';
        await payment.save();
      }

      // 2. Enroll User in selected Batch
      const existingEnrollment = await BatchEnrollment.findOne({ student: req.user.id, batch: batch._id });
      
      if (!existingEnrollment) {
          await BatchEnrollment.create({
              student: req.user.id,
              batch: batch._id,
              course: courseId,
              enrollmentStatus: 'active',
              paymentStatus: 'paid',
              paymentAmount: amount
          });
          
          // Add student to batch.enrolledStudents array
          batch.enrolledStudents.push(req.user.id);
          const savedBatch = await batch.save();
          console.log("Enrolled user in batch:", savedBatch.name);
      }

      res.json({
        success: true,
        message: 'Payment verified and Enrolled successfully',
        batchId: batch._id // Return batchId for frontend redirect
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
  } catch (error) {
     console.error("Razorpay Verify Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
