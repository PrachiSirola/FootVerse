// src/config/cjConfig.js

const CJ_CONFIG = {
  BASE_URL: "https://developers.cjdropshipping.com/api2.0/v1",

  AUTH: {
    LOGIN: "/authentication/getAccessToken",
    REFRESH: "/authentication/refreshAccessToken",
    LOGOUT: "/authentication/logout",
  },

PRODUCT: {
    LIST: "/product/list",
    LIST_V2: "/product/listV2",
    DETAILS: "/product/query",
  },

  CATEGORY: {
    LIST: "/product/getCategory",
  },

  SEARCH: {
    PRODUCT: "/product/list",
  },

  ORDER: {
    CREATE: "/shopping/order/createOrderV2",
    LIST: "/shopping/order/list",
  },

  SHIPPING: {
    CALCULATE: "/logistic/freightCalculate",
  },
};

export default CJ_CONFIG;