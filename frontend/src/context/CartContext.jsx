import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../lib/api";
import { useAuth } from "./AuthContext";

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
  const { currentUser, isAuthResolved } = useAuth();
  const [cart, setCart] = useState(getEmptyCart);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [cartError, setCartError] = useState("");
  const [canUseCart, setCanUseCart] = useState(false);

  const refreshCart = useCallback(async (options = {}) => {
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
  }, []);

  const addToCart = useCallback(async (foodId) => {
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
  }, []);

  const removeFromCart = useCallback(async (foodId) => {
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
  }, []);

  const resetCart = useCallback(() => {
    setCart(getEmptyCart());
    setCartError("");
    setCanUseCart(false);
    setIsCartLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthResolved) {
      return;
    }

    if (currentUser?.accountType === "user") {
      refreshCart({ showLoader: false });
      return;
    }

    resetCart();
  }, [
    currentUser?._id,
    currentUser?.accountType,
    isAuthResolved,
    refreshCart,
    resetCart,
  ]);

  const value = useMemo(
    () => ({
      cart,
      cartItems: cart.items,
      cartCount: cart.totalItems,
      isCartLoading,
      cartError,
      canUseCart,
      addToCart,
      removeFromCart,
      refreshCart,
      resetCart,
    }),
    [
      addToCart,
      canUseCart,
      cart,
      cartError,
      isCartLoading,
      refreshCart,
      removeFromCart,
      resetCart,
    ],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
