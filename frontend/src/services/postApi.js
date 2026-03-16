import axiosInstance from "./axiosConfig";

export const getPosts = async (params = {}) => {
    try {
        const response = await axiosInstance.get("/posts", { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getPostById = async (id) => {
    try {
        const response = await axiosInstance.get(`/posts/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const createPost = async (postData) => {
    try {
        const response = await axiosInstance.post("/posts", postData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updatePost = async (id, postData) => {
    try {
        const response = await axiosInstance.put(`/posts/${id}`, postData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const deletePost = async (id) => {
    try {
        const response = await axiosInstance.delete(`/posts/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
