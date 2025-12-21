import Category from "../models/Category.js";

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
export const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({ isPublic: true }).sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single category by slug
// @route   GET /api/v1/categories/:slug
// @access  Public
export const getCategory = async (req, res, next) => {
    try {
        const category = await Category.findOne({
            slug: req.params.slug,
            isPublic: true,
        });

        if (!category) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: `Category not found with slug: ${req.params.slug}`,
                },
            });
        }

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new category
// @route   POST /api/v1/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
    try {
        const { userId } = req.auth || {};

        if (!userId) {
            return res.status(401).json({
                error: { code: "UNAUTHORIZED", message: "Authentication required" },
            });
        }

        req.body.createdBy = userId;

        const category = await Category.create(req.body);

        res.status(201).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /api/v1/categories/id/:id
// @access  Private/Admin
export const updateCategory = async (req, res, next) => {
    try {
        let category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: `Category not found with id: ${req.params.id}`,
                },
            });
        }

        category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category
// @route   DELETE /api/v1/categories/id/:id
// @access  Private/Admin
export const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: `Category not found with id: ${req.params.id}`,
                },
            });
        }

        await category.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        next(error);
    }
};
