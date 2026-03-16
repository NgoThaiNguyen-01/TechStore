import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import authGuard from "../middlewares/authMiddleware.js";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads", "avatars");
const evidenceDir = path.join(process.cwd(), "uploads", "order-evidence");
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(evidenceDir, { recursive: true });

const createStorage = (targetDir, prefix) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, targetDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const safeExt = ext && ext.length <= 10 ? ext : "";
      const name = `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`;
      cb(null, name);
    }
  });

const fileFilter = (req, file, cb) => {
  const ok = file.mimetype?.startsWith("image/");
  cb(ok ? null : new Error("Invalid file type"), ok);
};

const upload = multer({
  storage: createStorage(uploadDir, "avatar"),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

const evidenceUpload = multer({
  storage: createStorage(evidenceDir, "evidence"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const buildUploadResponse = (req, file, routePath) => {
  const urlPath = `/uploads/${routePath}/${file.filename}`;
  const host = req.get("host");
  const proto = req.secure ? "https" : "http";
  const fullUrl = host ? `${proto}://${host}${urlPath}` : urlPath;

  const rawName = file.originalname || "";
  let decodedName = rawName;
  try {
    decodedName = Buffer.from(rawName, "latin1").toString("utf8");
  } catch {
    decodedName = rawName;
  }
  const normalizedName = (decodedName || rawName || file.filename || "").trim();
  const displayName = normalizedName.length > 80 ? `${normalizedName.slice(0, 77)}...` : normalizedName || file.filename;

  return {
    url: fullUrl,
    name: displayName,
    mimeType: file.mimetype || "",
    size: Number(file.size || 0)
  };
};

router.post(
  "/avatar",
  authGuard(),
  upload.single("file"),
  (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Missing file" });
    }
    res.json({ success: true, data: buildUploadResponse(req, file, "avatars") });
  }
);

router.post(
  "/order-evidence",
  authGuard(),
  evidenceUpload.single("file"),
  (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Missing file" });
    }
    res.json({ success: true, data: buildUploadResponse(req, file, "order-evidence") });
  }
);

router.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File too large" });
  }
  if (String(err?.message || "").includes("Invalid file type")) {
    return res.status(400).json({ success: false, message: "Invalid file type" });
  }
  next(err);
});

export default router;
