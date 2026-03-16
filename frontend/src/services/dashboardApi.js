import axiosInstance from "./axiosConfig";

export const getDashboardSummary = async (params = {}) => {
    const response = await axiosInstance.get("/dashboard/summary", { params });
    return response.data;
};

export const getDashboardActivity = async (params = {}) => {
    const response = await axiosInstance.get("/dashboard/activity", { params });
    return response.data;
};

export const getDashboardReviewAnalytics = async () => {
    const response = await axiosInstance.get("/dashboard/reviews");
    return response.data;
};
