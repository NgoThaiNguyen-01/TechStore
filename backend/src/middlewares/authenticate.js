import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            res.status(401);
            return next(new Error("Not authorized, no token"));
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        req.user = await User.findById(decoded.userId).select("-password");

        if (!req.user) {
            res.status(401);
            return next(new Error("Not authorized, user not found"));
        }

        next();
    } catch (error) {
        console.error("Token Auth Error:", error.message);
        res.status(401);
        next(new Error("Not authorized, token failed"));
    }
};
