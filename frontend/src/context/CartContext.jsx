import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const CartContext = createContext(null);

function getEmptyCart() {
  return {
    _id: null,
    user: null,
    items: [],
    totalItems: 0,
  };
}

function normalizeCart(cart) {
  const items = Array.isArray(cart?.items)
    ? cart.items.filter((item) => item?.food?._id)
    : [];

  return {
    _id: cart?._id ?? null,
    user: cart?.user ?? null,
    items,
    totalItems: items.reduce(
      (total, item) => total + Math.max(item.quantity ?? 0, 0),
      0,
    ),
  };
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(getEmptyCart);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [cartError, setCartError] = useState("");
  const [canUseCart, setCanUseCart] = useState(false);

  useEffect(() => {
    refreshCart();
  }, []);

  async function refreshCart(options = {}) {
    const { showLoader = true } = options;

    if (showLoader) {
      setIsCartLoading(true);
    }

    try {
      const response = await api.get("/api/food/cart");

      setCart(normalizeCart(response.data.cart));
      setCartError("");
      setCanUseCart(true);
    } catch (error) {
      if (error.response?.status === 401) {
        setCart(getEmptyCart());
        setCartError("");
        setCanUseCart(false);
      } else {
        setCartError(
          error.response?.data?.message || "Unable to load the cart right now.",
        );
      }
    } finally {
      setIsCartLoading(false);
    }
  }

  async function addToCart(foodId) {
    try {
      const response = await api.post("/api/food/cart", { foodId });

      const nextCart = normalizeCart(response.data.cart);

      setCart(nextCart);
      setCartError("");
      setCanUseCart(true);

      return nextCart;
    } catch (error) {
      if (error.response?.status === 401) {
        setCart(getEmptyCart());
        setCanUseCart(false);
      }

      throw error;
    }
  }

  async function removeFromCart(foodId) {
    try {
      const response = await api.delete(`/api/food/cart/${foodId}`);

      const nextCart = normalizeCart(response.data.cart);

      setCart(nextCart);
      setCartError("");
      setCanUseCart(true);

      return nextCart;
    } catch (error) {
      if (error.response?.status === 401) {
        setCart(getEmptyCart());
        setCanUseCart(false);
      }

      throw error;
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems: cart.items,
        cartCount: cart.totalItems,
        isCartLoading,
        cartError,
        canUseCart,
        addToCart,
        removeFromCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
