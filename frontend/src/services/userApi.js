import axiosInstance from "./axiosConfig";

export const getUsers = async (params = {}) => {
    const response = await axiosInstance.get("/users", { params });
    return response.data;
};

export const getUserById = async (id) => {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data;
};

export const createUser = async (data) => {
    const response = await axiosInstance.post("/users", data);
    return response.data;
};

export const updateUser = async (id, data) => {
    const response = await axiosInstance.put(`/users/${id}`, data);
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
};

export const updateUserRole = async (id, role) => {
    const response = await axiosInstance.patch(`/users/${id}/role`, { role });
    return response.data;
};

export const updateUserStatus = async (id, isActive) => {
    const response = await axiosInstance.patch(`/users/${id}/status`, { isActive });
    return response.data;
};

export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post("/uploads/avatar", formData);
    return response.data;
};

export const uploadOrderEvidence = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post("/uploads/order-evidence", formData);
    return response.data;
};

export const getMyProfile = async () => {
    const response = await axiosInstance.get("/users/me");
    return response.data;
};

export const updateMyProfile = async (data) => {
    const response = await axiosInstance.put("/users/me", data);
    return response.data;
};

export const changeMyPassword = async (data) => {
    const response = await axiosInstance.put("/users/me/password", data);
    return response.data;
};

export const deleteMyAccount = async () => {
    const response = await axiosInstance.delete("/users/me");
    return response.data;
};
