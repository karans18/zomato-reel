import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import UserLogin from "../auth/UserLogin";
import ReelFeed from "../../components/ReelFeed";
import { useCart } from "../../context/CartContext";
import "../../styles/reels.css";

const Home = () => {
  const navigate = useNavigate();
  const { addToCart, cartCount, refreshCart } = useCart();
  const [videos, setVideos] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isLoginOverlayMinimized, setIsLoginOverlayMinimized] = useState(false);

  useEffect(() => {
    axios
      .get("/api/auth/me", { withCredentials: true })
      .then((response) => {
        const user = response.data.user || null;

        setCurrentUser(user);
        setIsLoggedIn(Boolean(user));

        if (user?.accountType === "user") {
          refreshCart({ showLoader: false });
        }

        setIsLoginOverlayMinimized(false);
        setIsAuthResolved(true);
      })
      .catch(() => {
        setCurrentUser(null);
        setIsLoggedIn(false);
        setIsLoginOverlayMinimized(false);
        setIsAuthResolved(true);
      });
  }, []);

  useEffect(() => {
    axios
      .get("/api/food", { withCredentials: true })
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
      const response = await axios.post(
        "/api/food/like",
        { foodId: item._id },
        { withCredentials: true },
      );

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
      const response = await axios.post(
        "/api/food/save",
        { foodId: item._id },
        { withCredentials: true },
      );

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

  function handleLoginSuccess(user) {
    setCurrentUser(user);
    setIsLoggedIn(Boolean(user));
    setIsAuthResolved(true);
    setIsLoginOverlayMinimized(false);

    if (user?.accountType === "user") {
      refreshCart({ showLoader: false });
    }
  }

  function openGuestLoginOverlay() {
    setIsLoginOverlayMinimized(false);
    setIsAuthResolved(true);
  }

  function minimizeGuestLoginOverlay() {
    setIsLoginOverlayMinimized(true);
  }

  return (
    <>
      <ReelFeed
        items={videos}
        onLike={likeVideo}
        onSave={saveVideo}
        onAddToCart={handleAddToCart}
        onOpenCart={openCart}
        cartCount={cartCount}
        isLoggedIn={isLoggedIn}
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
