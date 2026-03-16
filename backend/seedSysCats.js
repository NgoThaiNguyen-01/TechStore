import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/techstore";

mongoose.connect(uri)
    .then(async () => {
        console.log("Connected to MongoDB for seeding...");
        const mongooseSchema = new mongoose.Schema({ slug: String, isSystem: Boolean }, { strict: false });
        const Category = mongoose.model("Category", mongooseSchema);

        const result = await Category.updateMany(
            { slug: { $in: ["khuyen-mai", "hang-moi-ve"] } },
            { $set: { isSystem: true } }
        );
        console.log("Seeded isSystem categories:", result);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
