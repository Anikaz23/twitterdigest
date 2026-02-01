import { Router } from "express";
import { getDigests, getDigestById, getLatestDigest, getTotalDigestCount } from "../db";

const router = Router();

// GET /digests - List digests with pagination
router.get("/", (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const digests = getDigests(limit, offset);
    const total = getTotalDigestCount();

    res.json({
      digests,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + digests.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching digests:", error);
    res.status(500).json({ error: "Failed to fetch digests" });
  }
});

// GET /digests/latest - Get most recent digest
router.get("/latest", (req, res) => {
  try {
    const digest = getLatestDigest();
    if (!digest) {
      return res.status(404).json({ error: "No digests found" });
    }
    res.json(digest);
  } catch (error) {
    console.error("Error fetching latest digest:", error);
    res.status(500).json({ error: "Failed to fetch latest digest" });
  }
});

// GET /digests/:id - Get single digest
router.get("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid digest ID" });
    }

    const digest = getDigestById(id);
    if (!digest) {
      return res.status(404).json({ error: "Digest not found" });
    }
    res.json(digest);
  } catch (error) {
    console.error("Error fetching digest:", error);
    res.status(500).json({ error: "Failed to fetch digest" });
  }
});

export default router;
