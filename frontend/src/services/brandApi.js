import axiosInstance from "./axiosConfig";

export const getBrands = async (params) => {
    const response = await axiosInstance.get("/brands", { params });
    return response.data;
};

export const getBrandById = async (id) => {
    const response = await axiosInstance.get(`/brands/${id}`);
    return response.data;
};

export const createBrand = async (data) => {
    const response = await axiosInstance.post("/brands", data);
    return response.data;
};

export const updateBrand = async (id, data) => {
    const response = await axiosInstance.put(`/brands/${id}`, data);
    return response.data;
};

export const deleteBrand = async (id) => {
    const response = await axiosInstance.delete(`/brands/${id}`);
    return response.data;
};
