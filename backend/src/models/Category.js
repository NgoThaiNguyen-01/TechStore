import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "folder",
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "active", "hidden", "archived"],
      default: "draft",
    },
    productCount: {
      type: Number,
      default: 0,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Mongoose hooks for generic pre-validation if needed
categorySchema.pre("validate", function (next) {
  if (this.parent && this.parent.equals(this._id)) {
    this.invalidate("parent", "A category cannot be its own parent.");
  }
  if (this.status === "archived" && this.isModified("parent") && this.parent) {
    this.invalidate("parent", "Archived categories cannot have a parent.");
  }
  next();
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
