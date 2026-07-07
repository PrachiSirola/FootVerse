import Cart from "../models/Cart.js";

const clampQty = (n) => Math.min(99, Math.max(1, Number(n) || 1));
const sameLine = (a, b) => a.productId === b.productId && (a.size || "") === (b.size || "") && (a.color || "") === (b.color || "");

async function getOrCreate(uid) {
  return (await Cart.findOne({ user: uid })) || (await Cart.create({ user: uid, items: [] }));
}

/** Serialize stored snapshot lines for the client. */
function serialize(cart) {
  const items = (cart?.items || []).map((i) => ({
    id: i.productId,
    size: i.size || "",
    color: i.color || "",
    qty: i.qty,
    name: i.name || "",
    brand: i.brand || "",
    price: Number(i.price) || 0,
    image: i.image || "",
    lineTotal: (Number(i.price) || 0) * i.qty,
  }));
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);
  return { items, subtotal, count };
}

export async function getCart(req, res) {
  const cart = await Cart.findOne({ user: req.uid });
  res.json({ success: true, ...serialize(cart) });
}

export async function addItem(req, res) {
  try {
    const { productId, size = "", color = "", qty = 1, name = "", image = "", price = 0, brand = "" } = req.body || {};
    if (!productId) return res.status(400).json({ success: false, message: "productId is required." });

    const cart = await getOrCreate(req.uid);
    const line = { productId, size, color, qty: clampQty(qty), name, image, price: Number(price) || 0, brand };
    const hit = cart.items.find((i) => sameLine(i, line));
    if (hit) {
      hit.qty = clampQty(hit.qty + line.qty);
      // refresh snapshot in case price/name changed
      hit.name = name || hit.name;
      hit.image = image || hit.image;
      hit.price = Number(price) || hit.price;
      hit.brand = brand || hit.brand;
    } else {
      cart.items.push(line);
    }
    await cart.save();
    res.json({ success: true, ...serialize(cart) });
  } catch (err) {
    console.error("addItem error:", err);
    res.status(500).json({ success: false, message: "Could not add to cart." });
  }
}

export async function updateItem(req, res) {
  try {
    const { productId, size = "", color = "", qty } = req.body || {};
    const cart = await getOrCreate(req.uid);
    const target = { productId, size, color };
    const n = Number(qty);
    if (n <= 0) {
      cart.items = cart.items.filter((i) => !sameLine(i, target));
    } else {
      const hit = cart.items.find((i) => sameLine(i, target));
      if (hit) hit.qty = clampQty(n);
    }
    await cart.save();
    res.json({ success: true, ...serialize(cart) });
  } catch (err) {
    console.error("updateItem error:", err);
    res.status(500).json({ success: false, message: "Could not update cart." });
  }
}

export async function removeItem(req, res) {
  try {
    const { productId, size = "", color = "" } = req.body || {};
    const cart = await getOrCreate(req.uid);
    cart.items = cart.items.filter((i) => !sameLine(i, { productId, size, color }));
    await cart.save();
    res.json({ success: true, ...serialize(cart) });
  } catch (err) {
    console.error("removeItem error:", err);
    res.status(500).json({ success: false, message: "Could not remove item." });
  }
}

export async function clearCart(req, res) {
  await Cart.updateOne({ user: req.uid }, { $set: { items: [] } }, { upsert: true });
  res.json({ success: true, items: [], subtotal: 0, count: 0 });
}

/** Merge a guest cart (localStorage snapshots) into the DB cart on login. */
export async function mergeCart(req, res) {
  try {
    const incoming = Array.isArray(req.body?.items) ? req.body.items : [];
    const cart = await getOrCreate(req.uid);
    for (const g of incoming) {
      if (!g?.id) continue;
      const line = {
        productId: g.id, size: g.size || "", color: g.color || "",
        name: g.name || "", image: g.image || "", price: Number(g.price) || 0, brand: g.brand || "",
      };
      const hit = cart.items.find((i) => sameLine(i, line));
      const qty = clampQty(g.qty);
      if (hit) hit.qty = clampQty(hit.qty + qty);
      else cart.items.push({ ...line, qty });
    }
    await cart.save();
    res.json({ success: true, ...serialize(cart) });
  } catch (err) {
    console.error("mergeCart error:", err);
    res.status(500).json({ success: false, message: "Could not merge cart." });
  }
}