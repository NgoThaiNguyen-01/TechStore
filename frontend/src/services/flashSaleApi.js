import axiosInstance from "./axiosConfig";

export const getPublicFlashSale = async () => {
    const response = await axiosInstance.get("/flash-sales/public");
    return response.data;
};

export const getAdminFlashSales = async () => {
    const response = await axiosInstance.get("/flash-sales/admin");
    return response.data;
};

export const createFlashSale = async (data) => {
    const response = await axiosInstance.post("/flash-sales", data);
    return response.data;
};

export const clearFlashSale = async () => {
    const response = await axiosInstance.post("/flash-sales/clear");
    return response.data;
};
