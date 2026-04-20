import mongoose from "mongoose";
import Branch from "../models/Branch.js";

export const BRANCH_STATUSES = ["pending", "approved", "rejected", "suspended"];

export const normalizeBranchSlug = (value) => {
  const base = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return base || "branch";
};

export const generateUniqueBranchSlug = async (instituteName, branchName) => {
  const base = normalizeBranchSlug(`${instituteName} ${branchName}`);
  let slug = base;
  let attempt = 0;

  while (await Branch.exists({ slug })) {
    attempt += 1;
    slug = `${base}-${attempt + 1}`;
  }

  return slug;
};

export const validateObjectId = (id, label = "ID") => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error(`Invalid ${label}`);
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }
  return new mongoose.Types.ObjectId(id);
};

export const buildBranchPublicQuery = (extra = {}) => ({
  status: "approved",
  isLive: true,
  ...extra,
});

export const serializeBranch = (branch) => {
  if (!branch) return null;
  const plain = typeof branch.toObject === "function" ? branch.toObject() : branch;
  return {
    ...plain,
    id: plain._id?.toString?.() || plain.id,
  };
};
