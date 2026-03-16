import Category from "../models/Category.js";
import Product from "../models/Product.js";

const buildDateRange = (dateInput) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
};

const collectDescendantIds = async (rootId) => {
  const ids = [rootId];
  let queue = [rootId];
  while (queue.length > 0) {
    const children = await Category.find({ parent: { $in: queue } }).select("_id");
    const childIds = children.map((child) => child._id);
    if (childIds.length === 0) break;
    ids.push(...childIds);
    queue = childIds;
  }
  return ids;
};

const cascadeCategoryStatus = async ({ rootId, status }) => {
  const ids = await collectDescendantIds(rootId);
  await Category.updateMany({ _id: { $in: ids } }, { status });
  await Product.updateMany(
    { $or: [{ category: { $in: ids } }, { categories: { $in: ids } }], isDeleted: { $ne: true } },
    { status }
  );
};

// @desc    Get all categories with pagination, search, and logic filters
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let query = {};

    // Search by name
    if (req.query.search) {
      const searchKeyword = req.query.search.trim();
      if (searchKeyword) {
        query.name = { $regex: searchKeyword, $options: "i" };
      }
    }

    // Filter by status
    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
    }

    // Filter by parent
    if (req.query.parent) {
      if (req.query.parent === "root") {
        query.parent = null;
      } else if (req.query.parent !== "all") {
        query.parent = req.query.parent;
      }
    }

    const createdRange = buildDateRange(req.query.createdDate);
    if (createdRange) {
      query.createdAt = createdRange;
    }

    const updatedRange = buildDateRange(req.query.updatedDate);
    if (updatedRange) {
      query.updatedAt = updatedRange;
    }

    const productCountMin = req.query.productCountMin ? parseInt(req.query.productCountMin, 10) : null;

    const sortOption = req.query.sort
      ? { [req.query.sort.split(":")[0]]: req.query.sort.split(":")[1] === "asc" ? 1 : -1 }
      : { createdAt: -1 };

    const categoriesAll = await Category.find(query)
      .populate("parent", "name _id")
      .sort(sortOption);

    const categoriesWithStatsAll = await Promise.all(
      categoriesAll.map(async (cat) => {
        const catObj = cat.toObject();

        // Compute counts
        const childrenCount = await Category.countDocuments({ parent: cat._id });
        let productCount = 0;
        if (!cat.parent) {
          const descendantIds = await collectDescendantIds(cat._id);
          productCount = await Product.countDocuments({
            $or: [
              { category: { $in: descendantIds } },
              { categories: { $in: descendantIds } }
            ],
            isDeleted: { $ne: true }
          });
        } else {
          productCount = await Product.countDocuments({
            $or: [
              { category: cat._id },
              { categories: cat._id } // if array exists
            ],
            isDeleted: { $ne: true }
          });
        }

        // Determine delete availability
        let canDelete = true;
        let deleteBlockReason = null;

        if (productCount > 0) {
          canDelete = false;
          deleteBlockReason = "HAS_PRODUCTS";
        } else if (childrenCount > 0) {
          canDelete = false;
          deleteBlockReason = "HAS_CHILDREN";
        } else if (cat.isSystem) {
          canDelete = false;
          deleteBlockReason = "IS_SYSTEM";
        } else if (cat.status === "active") {
          canDelete = false;
          deleteBlockReason = "IS_ACTIVE";
        }

        return {
          ...catObj,
          childrenCount,
          productCount,
          canDelete,
          deleteBlockReason
        };
      })
    );

    const filtered = typeof productCountMin === "number"
      ? categoriesWithStatsAll.filter((c) => (c.productCount || 0) >= productCountMin)
      : categoriesWithStatsAll;

    const total = filtered.length;
    const categoriesWithStats = filtered.slice(startIndex, startIndex + limit);

    res.json({
      data: categoriesWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
  try {
    const { parent } = req.body;

    if (parent === "root" || parent === "") {
      req.body.parent = null;
    }

    const rawSlug = (req.body.slug || "").trim();
    const normalizedSlug = rawSlug.replace(/^\/+|\/+$/g, "");

    if (req.body.parent) {
      const parentDoc = await Category.findById(req.body.parent);
      if (!parentDoc) {
        res.status(400);
        return next(new Error("Parent category not found"));
      }
      req.body.slug = `${parentDoc.slug}/${normalizedSlug}`;
    } else {
      req.body.slug = normalizedSlug;
    }

    // Duplication handled via Model constraints and ErrorMiddleware (returns 409)

    const category = await Category.create(req.body);

    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      return next(new Error("Category name or slug already exists"));
    }
    res.status(400);
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };
    if (updateData.parent === "root" || updateData.parent === "") {
      updateData.parent = null;
    }

    const existing = await Category.findById(id);
    if (!existing) {
      res.status(404);
      return next(new Error("Category not found"));
    }

    if (updateData.parent === id) {
      res.status(400);
      return next(new Error("A category cannot be its own parent"));
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "parent") || Object.prototype.hasOwnProperty.call(updateData, "slug")) {
      const leafSlug = (updateData.slug?.split("/").pop() || existing.slug?.split("/").pop() || "").trim();
      const normalizedSlug = leafSlug.replace(/^\/+|\/+$/g, "");
      const nextParent = updateData.parent === undefined ? existing.parent : updateData.parent;
      if (nextParent) {
        const parentDoc = await Category.findById(nextParent);
        if (!parentDoc) {
          res.status(400);
          return next(new Error("Parent category not found"));
        }
        updateData.slug = `${parentDoc.slug}/${normalizedSlug}`;
      } else {
        updateData.slug = normalizedSlug;
      }
    }

    const category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("parent", "name _id");

    if (!category) {
      res.status(404);
      return next(new Error("Category not found"));
    }

    if (["hidden", "archived", "draft", "active"].includes(updateData.status)) {
      await cascadeCategoryStatus({ rootId: id, status: updateData.status });
    }

    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      return next(new Error("Category name or slug already exists"));
    }
    res.status(400);
    next(error);
  }
};

// @desc    Update category status
// @route   PATCH /api/categories/:id/status
// @access  Private/Admin
export const updateCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["draft", "active", "hidden", "archived"].includes(status)) {
      res.status(400);
      return next(new Error("Invalid status type"));
    }

    const currentCat = await Category.findById(id);
    if (!currentCat) {
      res.status(404);
      return next(new Error("Category not found"));
    }

    if (currentCat.isSystem && status === "draft") {
      res.status(400);
      return next(new Error("Cannot change system category status to draft."));
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate("parent", "name _id");

    if (!category) {
      res.status(404);
      return next(new Error("Category not found"));
    }

    if (["hidden", "archived", "draft", "active"].includes(status)) {
      await cascadeCategoryStatus({ rootId: id, status });
    }

    res.json(category);
  } catch (error) {
    res.status(400);
    next(error);
  }
};

// @desc    Delete Category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      res.status(404);
      return next(new Error("Category not found"));
    }

    // 1. Validation Rules
    const childrenCount = await Category.countDocuments({ parent: id });
    const productCount = await Product.countDocuments({
      $or: [{ category: id }, { categories: id }]
    });

    if (productCount > 0 || childrenCount > 0 || category.isSystem || category.status === "active") {
      return res.status(409).json({
        success: false,
        message: "Không thể xóa danh mục vì đang có sản phẩm hoặc danh mục con hoặc là danh mục hệ thống.",
        detail: {
          productCount,
          childrenCount,
          isSystem: category.isSystem,
          status: category.status
        }
      });
    }

    // Hard delete
    await Category.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Đã xóa danh mục thành công." });
  } catch (error) {
    next(error);
  }
};
