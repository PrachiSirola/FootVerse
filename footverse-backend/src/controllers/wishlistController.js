import Wishlist from "../models/Wishlist.js";

async function getOrCreate(uid) {
  return (await Wishlist.findOne({ user: uid })) || (await Wishlist.create({ user: uid, productIds: [], items: [] }));
}

const serialize = (w) => ({
  ids: w?.productIds || [],
  items: (w?.items || []).map((i) => ({
    id: i.productId,
    name: i.name || "",
    image: i.image || "",
    price: Number(i.price) || 0,
    brand: i.brand || "",
  })),
});

export async function getWishlist(req, res) {
  const w = await Wishlist.findOne({ user: req.uid });
  res.json({ success: true, ...serialize(w) });
}

export async function toggle(req, res) {
  try {
    const { productId, name = "", image = "", price = 0, brand = "" } = req.body || {};
    if (!productId) return res.status(400).json({ success: false, message: "productId is required." });

    const w = await getOrCreate(req.uid);
    if (w.productIds.includes(productId)) {
      w.productIds = w.productIds.filter((id) => id !== productId);
      w.items = w.items.filter((i) => i.productId !== productId);
    } else {
      w.productIds.push(productId);
      w.items.push({ productId, name, image, price: Number(price) || 0, brand });
    }
    await w.save();
    res.json({ success: true, ...serialize(w) });
  } catch (err) {
    console.error("wishlist toggle error:", err);
    res.status(500).json({ success: false, message: "Could not update wishlist." });
  }
}

export async function mergeWishlist(req, res) {
  try {
    const incoming = Array.isArray(req.body?.items) ? req.body.items : [];
    const incomingIds = Array.isArray(req.body?.ids) ? req.body.ids : incoming.map((i) => i.id);
    const w = await getOrCreate(req.uid);

    for (const item of incoming) {
      if (!item?.id || w.productIds.includes(item.id)) continue;
      w.productIds.push(item.id);
      w.items.push({
        productId: item.id, name: item.name || "", image: item.image || "",
        price: Number(item.price) || 0, brand: item.brand || "",
      });
    }
    // also merge any bare ids without snapshots
    for (const id of incomingIds) {
      if (id && !w.productIds.includes(id)) w.productIds.push(id);
    }
    await w.save();
    res.json({ success: true, ...serialize(w) });
  } catch (err) {
    console.error("wishlist merge error:", err);
    res.status(500).json({ success: false, message: "Could not merge wishlist." });
  }
}