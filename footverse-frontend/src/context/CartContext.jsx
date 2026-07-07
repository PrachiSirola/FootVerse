"use client";

import { createContext, useContext, useEffect, useState } from "react";
import api, { getToken } from "@/lib/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);
const KEY = "fv-cart";

const readLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

/**
 * A cart line stores a SNAPSHOT so cart/checkout render without re-fetching:
 *   { id, size, color, qty, name, image, price, brand }
 * `id` is the product's Mongo _id (or any stable id).
 */
const lineKey = (i) => `${i.id}|${i.size || ""}|${i.color || ""}`;

/** Normalise server cart items into local snapshot shape. */
const fromServer = (items) =>
  (items || []).map((i) => ({
    id: i.id,
    size: i.size || "",
    color: i.color || "",
    qty: i.qty,
    name: i.name || "",
    image: i.image || "",
    price: Number(i.price) || 0,
    brand: i.brand || "",
  }));

export function CartProvider({ children }) {
  const { user, ready: authReady } = useAuth();
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);

  /* Load: guest → localStorage; logged-in → merge guest into DB, then fetch. */
  useEffect(() => {
    if (!authReady) return;
    let alive = true;
    (async () => {
      if (!user || !getToken()) {
        setItems(readLocal());
        setReady(true);
        return;
      }
      try {
        const guest = readLocal();
        if (guest.length) {
          await api.post("/cart/merge", { items: guest });
          localStorage.removeItem(KEY);
        }
        const r = await api.get("/cart");
        if (alive) setItems(fromServer(r.data.items));
      } catch {
        if (alive) setItems(readLocal());
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [user, authReady]);

  /* Persist guest cart only. */
  useEffect(() => {
    if (ready && !user) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready, user]);

  const isLoggedIn = () => Boolean(user && getToken());

  /** Merge a snapshot line into local state. */
  const localAdd = (line, qty) =>
    setItems((prev) => {
      const k = lineKey(line);
      const hit = prev.find((i) => lineKey(i) === k);
      if (hit) return prev.map((i) => (lineKey(i) === k ? { ...i, qty: Math.min(99, i.qty + qty) } : i));
      return [...prev, { ...line, qty }];
    });

  /**
   * add(snapshot, qty, opts)
   * snapshot = { id, name, image, price, brand?, size?, color? }
   * Back-compat: also tolerates add(id, size, color, qty) but a snapshot is preferred.
   */
  const add = async (arg, qty = 1, opts = {}) => {
    let line;
    if (arg && typeof arg === "object") {
      line = {
        id: arg.id,
        size: arg.size || "",
        color: arg.color || "",
        name: arg.name || "",
        image: arg.image || "",
        price: Number(arg.price) || 0,
        brand: arg.brand || "",
      };
      // second positional arg may be a qty (number) or opts (object)
      if (typeof qty === "object") {
        opts = qty;
        qty = arg.qty || 1;
      }
    } else {
      // legacy: add(id, size, color, qty) — no snapshot available
      line = { id: arg, size: arguments[1] || "", color: arguments[2] || "", name: "", image: "", price: 0, brand: "" };
      qty = Number(arguments[3]) || 1;
    }
    qty = Math.max(1, Number(qty) || 1);
    const openDrawer = opts.openDrawer !== false;

    if (isLoggedIn()) {
      try {
        const r = await api.post("/cart/items", { ...line, productId: line.id, qty });
        setItems(fromServer(r.data.items));
      } catch {
        localAdd(line, qty);
      }
    } else {
      localAdd(line, qty);
    }

    if (openDrawer) {
      setLastAdded({ ...line, qty });
      setDrawerOpen(true);
    }
  };

  const addItem = (product, qty = 1) => add(product, qty);

  const setQty = async (item, qty) => {
    qty = Math.min(99, qty);
    if (isLoggedIn()) {
      try {
        const r = await api.patch("/cart/items", {
          productId: item.id,
          size: item.size || "",
          color: item.color || "",
          qty,
        });
        setItems(fromServer(r.data.items));
        return;
      } catch {
        /* fall through */
      }
    }
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => lineKey(i) !== lineKey(item))
        : prev.map((i) => (lineKey(i) === lineKey(item) ? { ...i, qty } : i)),
    );
  };

  const remove = async (item) => {
    if (isLoggedIn()) {
      try {
        const r = await api.delete("/cart/items", {
          data: { productId: item.id, size: item.size || "", color: item.color || "" },
        });
        setItems(fromServer(r.data.items));
        return;
      } catch {
        /* fall through */
      }
    }
    setItems((prev) => prev.filter((i) => lineKey(i) !== lineKey(item)));
  };

  const clear = async () => {
    if (isLoggedIn()) {
      try {
        await api.delete("/cart");
      } catch {
        /* ignore */
      }
    }
    setItems([]);
  };
  const clearCart = clear;

  // Snapshot-based — no static catalogue lookup, so DB products render fine.
  const detailed = items.map((i) => ({
    ...i,
    product: { id: i.id, name: i.name, price: i.price, images: [i.image], brand: i.brand },
  }));
  const subtotal = detailed.reduce((s, i) => s + (Number(i.price) || 0) * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  // Flat shape for any page expecting {id,name,image,price,qty}
  const flatItems = items.map((i) => ({
    id: i.id, size: i.size, color: i.color, qty: i.qty,
    name: i.name, image: i.image, price: i.price,
  }));

  return (
    <CartContext.Provider
      value={{
        items, detailed, subtotal, count, ready,
        add, setQty, remove, clear,
        drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false),
        lastAdded,
        miniCartOpen: drawerOpen, setMiniCartOpen: setDrawerOpen,
        addItem, clearCart, total: subtotal, flatItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);