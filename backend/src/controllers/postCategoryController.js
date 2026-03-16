import PostCategory from '../models/PostCategory.js';
import Post from '../models/Post.js';

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

const findExistingCategory = async ({ name, slug, excludeId = null }) => {
    const checks = [];

    if (name) {
        checks.push({
            name: {
                $regex: `^${escapeRegex(normalizeText(name))}$`,
                $options: 'i'
            }
        });
    }

    if (slug) {
        checks.push({
            slug: {
                $regex: `^${escapeRegex(normalizeText(slug))}$`,
                $options: 'i'
            }
        });
    }

    if (checks.length === 0) return null;

    const query = { $or: checks };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    return PostCategory.findOne(query);
};

// Get all categories
export const getCategories = async (req, res) => {
    try {
        const { search, status, sort: sortParam, page = 1, limit = 10, createdDate, updatedDate } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const createdRange = buildDateRange(createdDate);
        if (createdRange) {
            query.createdAt = createdRange;
        }

        const updatedRange = buildDateRange(updatedDate);
        if (updatedRange) {
            query.updatedAt = updatedRange;
        }

        const allowedSortFields = new Set(['createdAt', 'updatedAt', 'name']);
        let sort = { createdAt: -1 };
        if (sortParam) {
            const [field, order] = String(sortParam).split(':');
            if (allowedSortFields.has(field)) {
                sort = { [field]: order === 'asc' ? 1 : -1 };
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const categories = await PostCategory.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PostCategory.countDocuments(query);

        // Compute post counts for visible page
        const names = categories.map((c) => c.name);
        const slugs = categories.map((c) => c.slug);
        const counts = await (await import('../models/Post.js')).default.aggregate([
            { $match: { $or: [{ tag: { $in: names } }, { tag: { $in: slugs } }] } },
            { $group: { _id: '$tag', count: { $sum: 1 } } }
        ]);
        const map = new Map(counts.map((c) => [String(c._id), c.count]));
        const categoriesWithCounts = categories.map((c) => {
            const obj = typeof c.toObject === 'function' ? c.toObject() : c;
            return { ...obj, postCount: map.get(c.name) || 0 };
        });

        res.status(200).json({
            success: true,
            data: categoriesWithCounts,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: total === 0 ? 0 : Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching post categories:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Create a new category
export const createCategory = async (req, res) => {
    try {
        const name = normalizeText(req.body?.name);
        const slug = normalizeText(req.body?.slug);
        const description = normalizeText(req.body?.description);
        const status = req.body?.status;

        const existing = await findExistingCategory({ name, slug });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Post category name or slug already exists' });
        }

        const category = new PostCategory({
            name,
            slug,
            description,
            status: status || 'active'
        });

        await category.save();

        res.status(201).json({ success: true, data: category, message: 'Category created successfully' });
    } catch (error) {
        console.error('Error creating post category:', error);
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, message: 'Post category name or slug already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Update a category
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const name = normalizeText(req.body?.name);
        const slug = normalizeText(req.body?.slug);
        const description = normalizeText(req.body?.description);
        const status = req.body?.status;

        const existing = await findExistingCategory({ name, slug, excludeId: id });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Post category name or slug already exists' });
        }

        const category = await PostCategory.findByIdAndUpdate(
            id,
            { name, slug, description, status },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.status(200).json({ success: true, data: category, message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating post category:', error);
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, message: 'Post category name or slug already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Delete a category
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await PostCategory.findById(id);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Prevent delete if posts exist with tag equal to name or slug (case-insensitive)
        const nameRe = new RegExp(`^${category.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const slugRe = new RegExp(`^${category.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const postCount = await Post.countDocuments({ $or: [{ tag: nameRe }, { tag: slugRe }] });
        if (postCount > 0) {
            return res.status(400).json({ success: false, message: 'Category has posts; cannot delete' });
        }

        await PostCategory.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting post category:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
