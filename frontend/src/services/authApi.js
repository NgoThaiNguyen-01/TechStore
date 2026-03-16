import axiosInstance from "./axiosConfig";

export const registerUser = async (payload) => {
    const res = await axiosInstance.post("/auth/register", payload);
    return res.data;
};

export const checkEmailExists = async (email) => {
    const res = await axiosInstance.get("/auth/check-email", { params: { email } });
    return res.data;
};

export const loginUser = async (payload) => {
    const res = await axiosInstance.post("/auth/login", payload);
    return res.data;
};

export const forgotPassword = async (email) => {
    const res = await axiosInstance.post("/auth/forgot-password", { email });
    return res.data;
};

export const resetPassword = async ({ password, confirmPassword }) => {
    const res = await axiosInstance.post("/auth/reset-password", { password, confirmPassword });
    return res.data;
};
