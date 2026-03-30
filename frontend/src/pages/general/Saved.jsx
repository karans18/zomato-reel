import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/reels.css";
import ReelFeed from "../../components/ReelFeed";

const Saved = () => {
  const [videos, setVideos] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    axios
      .get("/api/auth/me", { withCredentials: true })
      .then((response) => {
        setCurrentUser(response.data.user || null);
        setIsLoggedIn(true);
      })
      .catch(() => {
        setCurrentUser(null);
        setIsLoggedIn(false);
      });
  }, []);

  useEffect(() => {
    axios
      .get("/api/food/save", { withCredentials: true })
      .then((response) => {
        const savedFoods = (response.data.savedFoods || []).map((item) => ({
          _id: item.food?._id,
          video: item.food?.video,
          description: item.food?.description,
          likeCount: item.food?.likeCount,
          savesCount: item.food?.savesCount,
          commentsCount: item.food?.commentsCount,
          foodPartner: item.food?.foodPartner,
        }));

        setVideos(savedFoods.filter((item) => item._id));
      })
      .catch(() => {
        setVideos([]);
      });
  }, []);

  const removeSaved = async (item) => {
    try {
      await axios.post(
        "/api/food/save",
        { foodId: item._id },
        { withCredentials: true },
      );

      setVideos((prev) => prev.filter((video) => video._id !== item._id));
    } catch {
      // noop
    }
  };

  return (
    <ReelFeed
      items={videos}
      onSave={removeSaved}
      isLoggedIn={isLoggedIn}
      user={currentUser}
      canComment={currentUser?.accountType === "user"}
      emptyMessage="No saved videos yet."
    />
  );
};

export default Saved;
