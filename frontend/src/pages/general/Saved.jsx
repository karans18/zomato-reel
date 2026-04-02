import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import "../../styles/reels.css";
import ReelFeed from "../../components/ReelFeed";
import api from "../../lib/api";

function normalizeSavedFood(item) {
  return {
    _id: item.food?._id ?? null,
    name: item.food?.name ?? "",
    video: item.food?.video ?? "",
    description: item.food?.description ?? "",
    likeCount: item.food?.likeCount ?? 0,
    savesCount: item.food?.savesCount ?? 0,
    commentsCount: item.food?.commentsCount ?? 0,
    foodPartner: item.food?.foodPartner ?? null,
  };
}

const Saved = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthResolved, isLoggedIn, isLoggingOut, logout } =
    useAuth();
  const { resetCart } = useCart();
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    if (!isAuthResolved) {
      return;
    }

    if (!isLoggedIn) {
      setVideos([]);
      return;
    }

    api
      .get("/api/food/save")
      .then((response) => {
        const savedFoods = (response.data.savedFoods || []).map(
          normalizeSavedFood,
        );

        setVideos(savedFoods.filter((item) => item._id));
      })
      .catch(() => {
        setVideos([]);
      });
  }, [isAuthResolved, isLoggedIn]);

  const removeSaved = async (item) => {
    try {
      await api.post("/api/food/save", { foodId: item._id });

      setVideos((prev) => prev.filter((video) => video._id !== item._id));
    } catch {
      // noop
    }
  };

  async function handleLogout() {
    try {
      await logout();
      resetCart();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      alert(error.response?.data?.message || "Unable to log out right now.");
    }
  }

  return (
    <ReelFeed
      items={videos}
      onSave={removeSaved}
      onLogout={isLoggedIn ? handleLogout : undefined}
      isLoggedIn={isLoggedIn}
      isLoggingOut={isLoggingOut}
      canComment={currentUser?.accountType === "user"}
      emptyMessage="No saved videos yet."
    />
  );
};

export default Saved;
