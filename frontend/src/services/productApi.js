import axiosInstance from "./axiosConfig";

export const getProducts = async (params) => {
    const response = await axiosInstance.get("/products", { params });
    return response.data;
};

export const getProductById = async (id) => {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data;
};

export const getProductReviews = async (id) => {
    const response = await axiosInstance.get(`/products/${id}/reviews`);
    return response.data;
};

export const saveMyProductReview = async (id, data) => {
    const response = await axiosInstance.post(`/products/${id}/reviews`, data);
    return response.data;
};

export const deleteMyProductReview = async (id) => {
    const response = await axiosInstance.delete(`/products/${id}/reviews/mine`);
    return response.data;
};

export const createProduct = async (data) => {
    const response = await axiosInstance.post("/products", data);
    return response.data;
};

export const updateProduct = async (id, data) => {
    const response = await axiosInstance.put(`/products/${id}`, data);
    return response.data;
};

export const updateProductStatus = async (id, status) => {
    const response = await axiosInstance.patch(`/products/${id}/status`, { status });
    return response.data;
};

export const deleteProduct = async (id, options = {}) => {
    const response = await axiosInstance.delete(`/products/${id}`, { params: options });
    return response.data;
};

export const restoreProduct = async (id) => {
    const response = await axiosInstance.patch(`/products/${id}/restore`);
    return response.data;
};

export const bulkDeleteProducts = async (ids) => {
    const response = await axiosInstance.post("/products/bulk-delete", { ids });
    return response.data;
};

export const bulkUpdateStatus = async (ids, status) => {
    const response = await axiosInstance.post("/products/bulk-status", { ids, status });
    return response.data;
};
