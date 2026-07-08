import jwt from "jsonwebtoken";

const SECRET = () => process.env.JWT_SECRET || "footverse-dev-secret-change-me";

export function signToken(userId) {
  return jwt.sign({ uid: userId }, SECRET(), { expiresIn: "30d" });
}

/** Pulls a Bearer token from the Authorization header, sets req.uid if valid. */
function readToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    try {
      return jwt.verify(token, SECRET()).uid;
    } catch {
      return null;
    }
  }
  return null;
}

/** Never blocks — attaches req.uid when a valid token is present. */
export function authOptional(req, _res, next) {
  req.uid = readToken(req);
  next();
}

/** 401s when there is no valid token. */
export function authRequired(req, res, next) {
  const uid = readToken(req);
  if (!uid) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  req.uid = uid;
  next();
}

/** Requires a valid token AND that the user has isAdmin=true. */
export async function adminRequired(req, res, next) {
  const uid = readToken(req);
  if (!uid) return res.status(401).json({ message: "Authentication required." });
  try {
    const { default: User } = await import("../models/User.js");
    const user = await User.findById(uid).select("isAdmin");
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required." });
    }
    req.uid = uid;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}