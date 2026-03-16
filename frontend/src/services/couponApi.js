import axiosInstance from "./axiosConfig";

export const getPublicCoupons = async () => {
    const response = await axiosInstance.get("/coupons/public");
    return response.data;
};

export const getMyCoupons = async () => {
    const response = await axiosInstance.get("/coupons/my");
    return response.data;
};

export const claimCoupon = async (code) => {
    const response = await axiosInstance.post("/coupons/claim", { code });
    return response.data;
};

export const validateCoupon = async (data) => {
    const response = await axiosInstance.post("/coupons/validate", data);
    return response.data;
};

export const getAdminCoupons = async (params = {}) => {
    const response = await axiosInstance.get("/coupons/admin", { params });
    return response.data;
};

export const getAdminCouponDetail = async (id) => {
    const response = await axiosInstance.get(`/coupons/admin/${id}`);
    return response.data;
};

export const createCoupon = async (data) => {
    const response = await axiosInstance.post("/coupons", data);
    return response.data;
};

export const updateCoupon = async (id, data) => {
    const response = await axiosInstance.put(`/coupons/${id}`, data);
    return response.data;
};

export const deleteCoupon = async (id) => {
    const response = await axiosInstance.delete(`/coupons/${id}`);
    return response.data;
};
