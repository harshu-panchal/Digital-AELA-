import EbookResource from "../models/EbookResource.js";

export const listEbooks = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const [items, total] = await Promise.all([
      EbookResource.find({ isPublic: true })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      EbookResource.countDocuments({ isPublic: true }),
    ]);

    return res.json({
      data: items,
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

