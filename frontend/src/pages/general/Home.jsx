import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/reels.css";
import ReelFeed from "../../components/ReelFeed";

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    axios
      .get("/api/auth/me", {
        withCredentials: true,
      })
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
      .get("/api/food", {
        withCredentials: true,
      })
      .then((response) => {
        setVideos(response.data.foodItems || []);
      })
      .catch(() => {
        setVideos([]);
      });
  }, []);

  async function likeVideo(item) {
    if (!isLoggedIn) {
      alert("Please login first");
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
    } catch (err) {
      console.error(err);
    }
  }

  async function saveVideo(item) {
    if (!isLoggedIn) {
      alert("Please login first");
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
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <ReelFeed
      items={videos}
      onLike={likeVideo}
      onSave={saveVideo}
      isLoggedIn={isLoggedIn}
      user={currentUser}
      canComment={currentUser?.accountType === "user"}
      emptyMessage="No videos available."
    />
  );
};

export default Home;
