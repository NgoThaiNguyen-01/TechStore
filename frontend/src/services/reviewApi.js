import axiosInstance from "./axiosConfig";

export const getAdminProductReviews = async (params) => {
    const response = await axiosInstance.get("/products/reviews/admin", { params });
    return response.data;
};

export const updateAdminProductReviewStatus = async (reviewId, status) => {
    const response = await axiosInstance.patch(`/products/reviews/${reviewId}/status`, { status });
    return response.data;
};

export const bulkUpdateAdminProductReviewStatus = async (ids, status) => {
    const response = await axiosInstance.post("/products/reviews/bulk-status", { ids, status });
    return response.data;
};

export const deleteAdminProductReview = async (reviewId) => {
    const response = await axiosInstance.delete(`/products/reviews/${reviewId}`);
    return response.data;
};

export const bulkDeleteAdminProductReviews = async (ids) => {
    const response = await axiosInstance.post("/products/reviews/bulk-delete", { ids });
    return response.data;
};
