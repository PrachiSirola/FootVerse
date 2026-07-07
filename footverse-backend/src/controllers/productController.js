import * as productService from "../services/productService.js";

export const getProducts = async (req, res) => {
  try {
    const products = await productService.getProducts(req.query);
    res.json(products);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await productService.getProduct(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getFacets = async (req, res) => {
  try {
    res.json(await productService.getFacets());
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getRelated = async (req, res) => {
  try {
    res.json(await productService.getRelated(req.params.id, Number(req.query.limit) || 4));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// Products are read-only now (sourced live from CJ).
const readOnlyHandler = (_req, res) =>
  res.status(405).json({ message: "Products are sourced live from CJ and cannot be modified." });

export const createProduct = readOnlyHandler;
export const updateProduct = readOnlyHandler;
export const deleteProduct = readOnlyHandler;