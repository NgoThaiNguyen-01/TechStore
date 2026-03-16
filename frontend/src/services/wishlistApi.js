import axiosInstance from "./axiosConfig";

export const getMyWishlist = async () => {
    const response = await axiosInstance.get("/users/me/wishlist");
    return response.data;
};

export const replaceMyWishlist = async (items = []) => {
    const response = await axiosInstance.put("/users/me/wishlist", { items });
    return response.data;
};

export const mergeMyWishlist = async (items = []) => {
    const response = await axiosInstance.post("/users/me/wishlist/merge", { items });
    return response.data;
};
