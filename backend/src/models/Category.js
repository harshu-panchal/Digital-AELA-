import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        topHeading: {
            type: String,
            trim: true,
        },
        mainHeading: {
            type: String,
            trim: true,
        },
        subHeading: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        bannerUrl: {
            type: String,
            trim: true,
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Slugify name before validation
categorySchema.pre("validate", function (next) {
    if (this.name && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^\w ]+/g, "")
            .replace(/ +/g, "-");
    }
    next();
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
