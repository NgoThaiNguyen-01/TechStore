import express from "express";


import {
  getCategories,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
} from "../controllers/categoryController.js";
import authGuard from "../middlewares/authMiddleware.js";

const router = express.Router();

// Publicly accessible if want customers to view? The prompt says "GET /api/categories"
// If it has pagination, search, status filters, maybe admins only or public. We'll make it public for now, but admins use it too.
// Or we can add authenticate and authorize just for modifications.
router
  .route("/")
  .get(getCategories)
  .post(authGuard({ permissions: "category:create" }), createCategory);

router
  .route("/:id")
  .put(authGuard({ permissions: "category:update" }), updateCategory)
  .delete(authGuard({ permissions: "category:delete" }), deleteCategory);

router
  .route("/:id/status")
  .patch(authGuard({ permissions: "category:update" }), updateCategoryStatus);

export default router;
