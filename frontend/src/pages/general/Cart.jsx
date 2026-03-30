import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import "../../styles/cart.css";

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.5 3.5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 7l.7 11.1a2 2 0 0 0 2 1.9h4.6a2 2 0 0 0 2-1.9L17 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v5M14 11v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const Cart = () => {
  const navigate = useNavigate();
  const [removingFoodIds, setRemovingFoodIds] = useState([]);
  const {
    cartItems,
    cartCount,
    isCartLoading,
    cartError,
    canUseCart,
    removeFromCart,
  } = useCart();

  async function handleRemove(foodId) {
    setRemovingFoodIds((prev) => [...prev, foodId]);

    try {
      await removeFromCart(foodId);
    } catch (error) {
      console.error("Remove from cart error:", error);
      alert(
        error.response?.data?.message || "Unable to remove this item right now.",
      );
    } finally {
      setRemovingFoodIds((prev) => prev.filter((id) => id !== foodId));
    }
  }

  return (
    <div className="cart-page">
      <div className="cart-shell">
        <header className="cart-header">
          <button
            type="button"
            className="cart-back-button"
            onClick={() => navigate("/")}
          >
            Back
          </button>

          <div className="cart-heading">
            <h1>Cart</h1>
            <p>
              {cartCount} {cartCount === 1 ? "item" : "items"} added
            </p>
          </div>
        </header>

        {isCartLoading ? (
          <div className="cart-state-card">
            <p>Loading your cart...</p>
          </div>
        ) : cartError ? (
          <div className="cart-state-card cart-state-card--error">
            <p>{cartError}</p>
          </div>
        ) : !canUseCart ? (
          <div className="cart-state-card">
            <p>Please log in with a user account to view your cart.</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="cart-state-card">
            <p>Your cart is empty. Add a food item from the home feed.</p>
          </div>
        ) : (
          <div className="cart-list">
            {cartItems.map(({ food, quantity }) => (
              <article key={food._id} className="cart-item-card">
                <div className="cart-item-media">
                  <video
                    src={food.video}
                    muted
                    loop
                    autoPlay
                    playsInline
                    preload="metadata"
                  />
                </div>

                <div className="cart-item-body">
                  <button
                    type="button"
                    className="cart-delete-button"
                    onClick={() => handleRemove(food._id)}
                    disabled={removingFoodIds.includes(food._id)}
                    aria-label={`Remove ${food.name || "item"} from cart`}
                  >
                    <DeleteIcon />
                  </button>

                  <span className="cart-item-quantity">Qty {quantity}</span>
                  <h2>{food.name || "Food item"}</h2>
                  <p>{food.description || "Fresh food added from the feed."}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
