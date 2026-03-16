import axiosInstance from "./axiosConfig";

export const createOrder = async (data) => {
    const response = await axiosInstance.post("/orders", data);
    return response.data;
};

export const estimateOrderShipping = async (data) => {
    const response = await axiosInstance.post("/orders/shipping-estimate", data);
    return response.data;
};

export const getOrders = async (params = {}) => {
    const response = await axiosInstance.get("/orders", { params });
    return response.data;
};

export const getOrderById = async (id) => {
    const response = await axiosInstance.get(`/orders/${id}`);
    return response.data;
};

export const updateOrderStatus = async (id, data) => {
    const response = await axiosInstance.put(`/orders/${id}/status`, data);
    return response.data;
};

export const getOrderAnalyticsSummary = async () => {
    const response = await axiosInstance.get("/orders/analytics/summary");
    return response.data;
};

export const confirmMomoReturn = async (params = {}) => {
    const response = await axiosInstance.get("/orders/payment/momo/confirm", { params });
    return response.data;
};

export const cancelMomoCheckout = async (orderNumber) => {
    const response = await axiosInstance.post("/orders/payment/momo/cancel", { orderNumber });
    return response.data;
};

export const requestOrderRefund = async (id, reason) => {
    const response = await axiosInstance.post(`/orders/${id}/refund-request`, { reason });
    return response.data;
};

export const reviewOrderRefundRequest = async (id, action, reviewNote = "") => {
    const response = await axiosInstance.patch(`/orders/${id}/refund-request`, { action, reviewNote });
    return response.data;
};

export const addOrderInternalNote = async (id, note) => {
    const response = await axiosInstance.post(`/orders/${id}/internal-notes`, { note });
    return response.data;
};

export const submitOrderAftersalesRequest = async (id, data) => {
    const response = await axiosInstance.post(`/orders/${id}/aftersales-request`, data);
    return response.data;
};

export const reviewOrderAftersalesRequest = async (id, data) => {
    const response = await axiosInstance.patch(`/orders/${id}/aftersales-request`, data);
    return response.data;
};
