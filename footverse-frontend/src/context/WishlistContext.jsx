"use client";

import { createContext, useContext, useEffect, useState } from "react";
import api, { getToken } from "@/lib/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);
const KEY = "fv-wishlist";       // ids (back-compat)
const SNAP_KEY = "fv-wishlist-items"; // snapshots

const readLocalIds = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const readLocalItems = () => {
  try { return JSON.parse(localStorage.getItem(SNAP_KEY) || "[]"); } catch { return []; }
};

export function WishlistProvider({ children }) {
  const { user, ready: authReady } = useAuth();
  const [ids, setIds] = useState([]);
  const [items, setItems] = useState([]); // [{id,name,image,price,brand}]
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    let alive = true;
    (async () => {
      if (!user || !getToken()) {
        setIds(readLocalIds());
        setItems(readLocalItems());
        setReady(true);
        return;
      }
      try {
        const guestItems = readLocalItems();
        const guestIds = readLocalIds();
        if (guestItems.length || guestIds.length) {
          await api.post("/wishlist/merge", { items: guestItems, ids: guestIds });
          localStorage.removeItem(KEY);
          localStorage.removeItem(SNAP_KEY);
        }
        const r = await api.get("/wishlist");
        if (alive) { setIds(r.data.ids || []); setItems(r.data.items || []); }
      } catch {
        if (alive) { setIds(readLocalIds()); setItems(readLocalItems()); }
      }
      if (alive) setReady(true);
    })();
    return () => { alive = false; };
  }, [user, authReady]);

  // Persist guest wishlist only.
  useEffect(() => {
    if (ready && !user) {
      localStorage.setItem(KEY, JSON.stringify(ids));
      localStorage.setItem(SNAP_KEY, JSON.stringify(items));
    }
  }, [ids, items, ready, user]);

  const isLoggedIn = () => Boolean(user && getToken());

  /**
   * toggle(idOrSnapshot)
   * Pass a snapshot object { id, name, image, price, brand } so guests can
   * render the wishlist without re-fetching. A bare id string also works.
   */
  const toggle = async (arg) => {
    const snap = typeof arg === "object" ? arg : { id: arg };
    const id = snap.id;

    if (isLoggedIn()) {
      try {
        const r = await api.post("/wishlist/toggle", { productId: id, ...snap });
        setIds(r.data.ids || []);
        setItems(r.data.items || []);
        return;
      } catch { /* fall through to local */ }
    }
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setItems((prev) =>
      prev.some((i) => i.id === id)
        ? prev.filter((i) => i.id !== id)
        : [...prev, { id, name: snap.name || "", image: snap.image || "", price: Number(snap.price) || 0, brand: snap.brand || "" }],
    );
  };

  const has = (id) => ids.includes(id);

  return (
    <WishlistContext.Provider value={{ ids, items, ready, toggle, has, count: ids.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);