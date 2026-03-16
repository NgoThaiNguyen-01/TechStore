export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403);
            return next(
                new Error(
                    `User role '${req.user ? req.user.role : "Unknown"}' is not authorized to access this route`
                )
            );
        }
        next();
    };
};
