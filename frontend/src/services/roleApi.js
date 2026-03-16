import axiosInstance from "./axiosConfig";

export const getRoles = async () => {
    const response = await axiosInstance.get("/roles");
    return response.data;
};

export const getPermissions = async () => {
    const response = await axiosInstance.get("/roles/permissions");
    return response.data;
};

export const updateRole = async (id, data) => {
    const response = await axiosInstance.put(`/roles/${id}`, data);
    return response.data;
};

export const bootstrapRoles = async () => {
    const response = await axiosInstance.post("/roles/bootstrap");
    return response.data;
};
