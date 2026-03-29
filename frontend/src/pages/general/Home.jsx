import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/reels.css";
import ReelFeed from "../../components/ReelFeed";

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Check login
  useEffect(() => {
    axios
      .get("http://localhost:3000/api/auth/me", {
        withCredentials: true,
      })
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  // ✅ Fetch videos
  useEffect(() => {
    axios
      .get("http://localhost:3000/api/food", {
        withCredentials: true,
      })
      .then((response) => {
        setVideos(response.data.foodItems);
      })
      .catch(() => {
        // optional
      });
  }, []);

  // ✅ LIKE FUNCTION
  async function likeVideo(item) {
    if (!isLoggedIn) {
      alert("Please login first");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/food/like",
        { foodId: item._id },
        { withCredentials: true }
      );

      setVideos((prev) =>
        prev.map((v) =>
          v._id === item._id
            ? {
                ...v,
                likeCount: response.data.like
                  ? v.likeCount + 1
                  : v.likeCount - 1,
              }
            : v
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  // ✅ SAVE FUNCTION (FIXED)
  async function saveVideo(item) {
    if (!isLoggedIn) {
      alert("Please login first");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/food/save",
        { foodId: item._id },
        { withCredentials: true }
      );

      setVideos((prev) =>
        prev.map((v) =>
          v._id === item._id
            ? {
                ...v,
                savesCount: response.data.save
                  ? v.savesCount + 1
                  : v.savesCount - 1,
              }
            : v
        )
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
      emptyMessage="No videos available."
    />
  );
};

export default Home;