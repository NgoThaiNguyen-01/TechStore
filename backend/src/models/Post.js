import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    content: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
    },
    tag: {
        type: String, // e.g., "Tin công nghệ", "Review", "Hướng dẫn"
        trim: true,
        default: 'General'
    },
    status: {
        type: String,
        enum: ['published', 'hidden', 'draft', 'archived'],
        default: 'published'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Post = mongoose.model('Post', PostSchema);
export default Post;
