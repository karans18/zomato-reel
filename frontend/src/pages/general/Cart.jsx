import React from "react";
import { useNavigate } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import "../../styles/cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, cartCount, isCartLoading, cartError, canUseCart } =
    useCart();

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
