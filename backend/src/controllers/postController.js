import Post from '../models/Post.js';
import User from '../models/User.js';

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseNumber = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const findExistingPost = async ({ title, slug, excludeId = null }) => {
    const checks = [];

    if (title) {
        checks.push({
            title: {
                $regex: `^${escapeRegex(normalizeText(title))}$`,
                $options: 'i'
            }
        });
    }

    if (slug) {
        checks.push({
            slug: {
                $regex: `^${escapeRegex(String(slug).trim())}$`,
                $options: 'i'
            }
        });
    }

    if (checks.length === 0) return null;

    const query = { $or: checks };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    return Post.findOne(query);
};

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

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res) => {
    try {
        const page = Math.max(1, parseNumber(req.query.page, 1));
        const limit = Math.max(1, parseNumber(req.query.limit, 10));
        const status = req.query.status ? String(req.query.status).trim() : '';
        const search = req.query.search ? String(req.query.search).trim() : '';
        const tag = req.query.tag ? String(req.query.tag).trim() : '';
        const author = req.query.author ? String(req.query.author).trim() : '';
        const createdDate = req.query.createdDate;
        const updatedDate = req.query.updatedDate;
        const sortParam = req.query.sort ? String(req.query.sort).trim() : '';

        const query = {};

        if (status) {
            if (status !== 'all') {
                const VALID_STATUSES = ['published', 'hidden', 'draft', 'archived'];
                if (!VALID_STATUSES.includes(status)) {
                    return res.status(400).json({ success: false, message: 'Invalid status' });
                }
                query.status = status;
            }
        }

        if (tag) {
            if (tag !== 'all') {
                query.tag = tag;
            }
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        if (author) {
            const users = await User.find({ name: { $regex: author, $options: 'i' } }).select('_id');
            const ids = users.map((u) => u._id);
            if (ids.length === 0) {
                return res.status(200).json({
                    success: true,
                    count: 0,
                    total: 0,
                    totalPages: 0,
                    currentPage: page,
                    data: []
                });
            }
            query.author = { $in: ids };
        }

        const createdRange = buildDateRange(createdDate);
        if (createdRange) {
            query.createdAt = createdRange;
        }

        const updatedRange = buildDateRange(updatedDate);
        if (updatedRange) {
            query.updatedAt = updatedRange;
        }

        const allowedSortFields = new Set(['createdAt', 'updatedAt', 'title']);
        let sort = { createdAt: -1 };
        if (sortParam) {
            const [field, order] = sortParam.split(':');
            if (allowedSortFields.has(field)) {
                sort = { [field]: order === 'asc' ? 1 : -1 };
            }
        }

        const skip = (page - 1) * limit;

        const posts = await Post.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('author', 'name email');

        const total = await Post.countDocuments(query);

        res.status(200).json({
            success: true,
            count: posts.length,
            total,
            totalPages: total === 0 ? 0 : Math.ceil(total / limit),
            currentPage: page,
            data: posts
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single post by ID or slug
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        let post;

        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            post = await Post.findById(id).populate('author', 'name email');
        }

        if (!post) {
            post = await Post.findOne({ slug: id }).populate('author', 'name email');
        }

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({ success: true, data: post });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create a post
// @route   POST /api/posts
// @access  Private/Admin
export const createPost = async (req, res) => {
    try {
        const title = normalizeText(req.body?.title);
        const slug = String(req.body?.slug || '').trim();
        const content = String(req.body?.content || '');
        const description = normalizeText(req.body?.description);
        const thumbnail = String(req.body?.thumbnail || '').trim();
        const tag = normalizeText(req.body?.tag);
        const status = req.body?.status;

        const postExists = await findExistingPost({ title, slug });
        if (postExists) {
            return res.status(409).json({ success: false, message: 'Post already exists' });
        }

        const newPost = await Post.create({
            title,
            slug,
            content,
            description,
            thumbnail,
            tag,
            status: status || 'published',
            author: req.user ? req.user._id : null
        });

        res.status(201).json({ success: true, data: newPost });
    } catch (error) {
        console.error('Error creating post:', error);
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, message: 'Post already exists' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private/Admin
export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        const title = Object.prototype.hasOwnProperty.call(updates, 'title') ? normalizeText(updates.title) : '';
        const slug = Object.prototype.hasOwnProperty.call(updates, 'slug') ? String(updates.slug || '').trim() : '';

        if (Object.prototype.hasOwnProperty.call(updates, 'title')) {
            updates.title = title;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'slug')) {
            updates.slug = slug;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'description')) {
            updates.description = normalizeText(updates.description);
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'thumbnail')) {
            updates.thumbnail = String(updates.thumbnail || '').trim();
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'tag')) {
            updates.tag = normalizeText(updates.tag);
        }

        const existingPost = await findExistingPost({
            title: Object.prototype.hasOwnProperty.call(updates, 'title') ? updates.title : '',
            slug: Object.prototype.hasOwnProperty.call(updates, 'slug') ? updates.slug : '',
            excludeId: id
        });
        if (existingPost) {
            return res.status(409).json({ success: false, message: 'Post already exists' });
        }

        const updatedPost = await Post.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!updatedPost) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({ success: true, data: updatedPost });
    } catch (error) {
        console.error('Error updating post:', error);
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, message: 'Post already exists' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private/Admin
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        await post.deleteOne();
        res.status(200).json({ success: true, message: 'Post removed' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
