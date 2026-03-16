import axiosInstance from "./axiosConfig";

export const getCategories = async (params) => {
    const response = await axiosInstance.get("/categories", { params });
    return response.data;
};

export const createCategory = async (data) => {
    const response = await axiosInstance.post("/categories", data);
    return response.data;
};

export const updateCategory = async (id, data) => {
    const response = await axiosInstance.put(`/categories/${id}`, data);
    return response.data;
};

export const updateCategoryStatus = async (id, status) => {
    const response = await axiosInstance.patch(`/categories/${id}/status`, { status });
    return response.data;
};

export const deleteCategory = async (id) => {
    const response = await axiosInstance.delete(`/categories/${id}`);
    return response.data;
};
