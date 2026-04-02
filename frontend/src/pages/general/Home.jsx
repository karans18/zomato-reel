import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import UserLogin from "../auth/UserLogin";
import ReelFeed from "../../components/ReelFeed";
import { useCart } from "../../context/CartContext";
import "../../styles/reels.css";

const Home = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    isAuthResolved,
    isLoggedIn,
    isLoggingOut,
    logout,
  } = useAuth();
  const { addToCart, cartCount, resetCart } = useCart();
  const [videos, setVideos] = useState([]);
  const [isLoginOverlayMinimized, setIsLoginOverlayMinimized] = useState(false);

  useEffect(() => {
    api
      .get("/api/food")
      .then((response) => {
        setVideos(response.data.foodItems || []);
      })
      .catch(() => {
        setVideos([]);
      });
  }, []);

  async function likeVideo(item) {
    if (!isLoggedIn) {
      openGuestLoginOverlay();
      return;
    }

    try {
      const response = await api.post("/api/food/like", { foodId: item._id });

      setVideos((prev) =>
        prev.map((video) =>
          video._id === item._id
            ? {
                ...video,
                likeCount: response.data.like
                  ? (video.likeCount ?? 0) + 1
                  : Math.max((video.likeCount ?? 0) - 1, 0),
              }
            : video,
        ),
      );
    } catch (error) {
      console.error(error);
    }
  }

  async function saveVideo(item) {
    if (!isLoggedIn) {
      openGuestLoginOverlay();
      return;
    }

    try {
      const response = await api.post("/api/food/save", { foodId: item._id });

      setVideos((prev) =>
        prev.map((video) =>
          video._id === item._id
            ? {
                ...video,
                savesCount: response.data.save
                  ? (video.savesCount ?? 0) + 1
                  : Math.max((video.savesCount ?? 0) - 1, 0),
              }
            : video,
        ),
      );
    } catch (error) {
      console.error(error);
    }
  }

  async function handleAddToCart(item) {
    if (!isLoggedIn) {
      openGuestLoginOverlay();
      return;
    }

    if (currentUser?.accountType !== "user") {
      alert("Please login with a user account to use the cart");
      return;
    }

    try {
      await addToCart(item._id);
      alert("Item added to cart");
    } catch (error) {
      console.error("Add to cart error:", error);
      alert(error.response?.data?.message || "Unable to add this item to cart");
    }
  }

  function openCart() {
    if (!isLoggedIn) {
      openGuestLoginOverlay();
      return;
    }

    navigate("/cart");
  }

  function handleLoginSuccess() {
    setIsLoginOverlayMinimized(false);
  }

  function openGuestLoginOverlay() {
    setIsLoginOverlayMinimized(false);
  }

  function minimizeGuestLoginOverlay() {
    setIsLoginOverlayMinimized(true);
  }

  async function handleLogout() {
    try {
      await logout();
      resetCart();
      setIsLoginOverlayMinimized(false);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      alert(error.response?.data?.message || "Unable to log out right now.");
    }
  }

  return (
    <>
      <ReelFeed
        items={videos}
        onLike={likeVideo}
        onSave={saveVideo}
        onAddToCart={handleAddToCart}
        onOpenCart={currentUser?.accountType === "user" ? openCart : undefined}
        onLogout={isLoggedIn ? handleLogout : undefined}
        cartCount={cartCount}
        isLoggedIn={isLoggedIn}
        isLoggingOut={isLoggingOut}
        canComment={currentUser?.accountType === "user"}
        onRequireLogin={openGuestLoginOverlay}
        emptyMessage="No videos available."
      />

      {isAuthResolved && !isLoggedIn ? (
        <UserLogin
          variant="overlay"
          redirectOnSuccess={false}
          showFoodPartnerShortcut
          isMinimized={isLoginOverlayMinimized}
          onMinimize={minimizeGuestLoginOverlay}
          onRestore={openGuestLoginOverlay}
          onSuccess={handleLoginSuccess}
        />
      ) : null}
    </>
  );
};

export default Home;
