import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/OrderTracking.css';
import { orders as ordersApi } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const OrderTrackingPage = ({ user, onLogout }) => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to get all orders
      const { data } = await ordersApi.getAll();
      const foundOrder = data.find(o => o._id === orderId);
      
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setError('Order not found');
        toast.error('Order not found');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details. Please try again later.');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#ffc107',
      'Processing': '#17a2b8',
      'Shipped': '#007bff',
      'Delivered': '#28a745',
      'Cancelled': '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusStep = (status) => {
    const steps = {
      'Pending': 1,
      'Processing': 2,
      'Shipped': 3,
      'Delivered': 4,
      'Cancelled': 0
    };
    return steps[status] || 0;
  };

  // Format price with commas and 2 decimal places
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  return (
    <>
      <Navbar user={user} onLogout={onLogout} />
      <div className="tracking-page-container">
        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading order details...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h2>Error Loading Order</h2>
            <p>{error}</p>
            <button onClick={fetchOrderDetails} className="retry-btn">
              Try Again
            </button>
            <Link to="/" className="back-home-btn">
              Return to Home
            </Link>
          </div>
        ) : order ? (
          <div className="order-tracking-container">
            <h1>Track Your Order</h1>
            <div className="order-id-section">
              <h2>Order #{order._id}</h2>
              <p>Placed on {formatDate(order.createdAt)}</p>
            </div>
            
            <div className="order-status-section">
              <h3>Order Status</h3>
              <div 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(order.status) }}
              >
                {order.status}
              </div>
              
              <div className="order-progress">
                <div className="progress-track">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${(getStatusStep(order.status) / 4) * 100}%`,
                      backgroundColor: getStatusColor(order.status)
                    }}
                  ></div>
                </div>
                <div className="progress-steps">
                  <div className={`step ${getStatusStep(order.status) >= 1 ? 'active' : ''}`}>
                    Pending
                  </div>
                  <div className={`step ${getStatusStep(order.status) >= 2 ? 'active' : ''}`}>
                    Processing
                  </div>
                  <div className={`step ${getStatusStep(order.status) >= 3 ? 'active' : ''}`}>
                    Shipped
                  </div>
                  <div className={`step ${getStatusStep(order.status) >= 4 ? 'active' : ''}`}>
                    Delivered
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-details-section">
              <div className="order-details-header">
                <h3>Order Details</h3>
              </div>
              
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-details">
                      <span className="item-name">{item.sweet?.name || 'Sweet'}</span>
                      <span className="item-quantity">x{item.quantity}</span>
                    </div>
                    <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="order-summary">
                <div className="summary-row">
                  <span>Shipping Address:</span>
                  <span>{order.shippingAddress}</span>
                </div>
                <div className="summary-row">
                  <span>Payment Method:</span>
                  <span>{order.paymentMethod === 'cash' ? 'Cash on Delivery' : 
                        order.paymentMethod === 'upi' ? 'UPI' : 'Credit/Debit Card'}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
            
            <div className="tracking-actions">
              <Link to="/" className="back-home-btn">
                Return to Home
              </Link>
              {(order.status === 'Pending' || order.status === 'Processing') && (
                <button 
                  className="cancel-order-btn"
                  onClick={async () => {
                    try {
                      await ordersApi.cancelOrder(order._id);
                      toast.success('Order cancelled successfully');
                      fetchOrderDetails();
                    } catch (error) {
                      console.error('Error cancelling order:', error);
                      toast.error('Failed to cancel order');
                    }
                  }}
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="error-container">
            <h2>Order Not Found</h2>
            <p>We couldn't find the order you're looking for.</p>
            <Link to="/" className="back-home-btn">
              Return to Home
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default OrderTrackingPage; 