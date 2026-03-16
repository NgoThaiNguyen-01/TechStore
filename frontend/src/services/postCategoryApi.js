import axiosInstance from './axiosConfig';

export const getPostCategories = async (params) => {
    try {
        const response = await axiosInstance.get('/post-categories', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createPostCategory = async (data) => {
    try {
        const response = await axiosInstance.post('/post-categories', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updatePostCategory = async (id, data) => {
    try {
        const response = await axiosInstance.put(`/post-categories/${id}`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deletePostCategory = async (id) => {
    try {
        const response = await axiosInstance.delete(`/post-categories/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
