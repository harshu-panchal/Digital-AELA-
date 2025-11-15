import EbookResource from "../models/EbookResource.js";

export const listEbooks = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const [items, total] = await Promise.all([
      EbookResource.find({ isPublic: true })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(), // Use lean() to get plain JavaScript objects
      EbookResource.countDocuments({ isPublic: true }),
    ]);

    // Ensure metadata exists for all items
    const itemsWithMetadata = items.map((item) => ({
      ...item,
      metadata: item.metadata || {},
    }));

    return res.json({
      data: itemsWithMetadata,
      meta: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getEbook = async (req, res, next) => {
  try {
    const { ebookId } = req.params;
    const ebook = await EbookResource.findById(ebookId);

    if (!ebook) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "E-book not found",
        },
      });
    }

    if (!ebook.isPublic) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "E-book not accessible",
        },
      });
    }

    return res.json(ebook);
  } catch (error) {
    return next(error);
  }
};

