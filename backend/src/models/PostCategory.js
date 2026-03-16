import mongoose from 'mongoose';

const PostCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'hidden', 'draft', 'archived'],
        default: 'active'
    }
}, {
    timestamps: true
});

const PostCategory = mongoose.model('PostCategory', PostCategorySchema);

export default PostCategory;
