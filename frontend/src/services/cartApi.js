import axiosInstance from "./axiosConfig";

export const getMyCart = async () => {
    const response = await axiosInstance.get("/users/me/cart");
    return response.data;
};

export const replaceMyCart = async (items = []) => {
    const response = await axiosInstance.put("/users/me/cart", { items });
    return response.data;
};

export const mergeMyCart = async (items = []) => {
    const response = await axiosInstance.post("/users/me/cart/merge", { items });
    return response.data;
};
