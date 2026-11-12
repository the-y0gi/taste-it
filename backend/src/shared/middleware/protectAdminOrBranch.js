const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "rms_super_secret_jwt_key";

/**
 * Middleware: Allow either Super Admin or Authenticated Branch
 * Useful for Menu management so Super Admin can manage any restaurant
 * and Branch Managers can manage their own restaurant menu.
 */
const protectAdminOrBranch = (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Check Cookies
    else if (req.cookies && (req.cookies.rms_superadmin_token || req.cookies.rms_branch_token)) {
      token = req.cookies.rms_superadmin_token || req.cookies.rms_branch_token;
    }
    // Check Custom Headers
    else if (req.headers["x-superadmin-token"]) {
      token = req.headers["x-superadmin-token"];
    } else if (req.headers["x-branch-token"]) {
      token = req.headers["x-branch-token"];
    }

    if (!token) {
      // Fallback for local POS development if branchId is supplied
      const fallbackBranchId =
        req.query.branchId ||
        req.body?.branchId ||
        req.headers["x-branch-id"];

      if (fallbackBranchId) {
        req.branch = { branchId: String(fallbackBranchId) };
        req.activeBranchId = String(fallbackBranchId);
        return next();
      }

      return res.status(401).json({
        success: false,
        message: "Authentication token required.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role === "super_admin") {
      req.superAdmin = decoded;
      return next();
    }

    // Branch token
    if (decoded.branchId || decoded._id || decoded.id) {
      req.branch = decoded;
      req.activeBranchId = String(decoded.branchId || decoded._id || decoded.id);
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Insufficient permissions.",
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session token.",
    });
  }
};

module.exports = protectAdminOrBranch;
