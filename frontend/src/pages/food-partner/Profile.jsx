import React, { useState, useEffect } from 'react';
import '../../styles/profile.css';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';

const Profile = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        api.get(`/api/food-partner/${id}`)
            .then(response => {
                setProfile(response.data.foodPartner);
                setVideos(response.data.foodPartner.foodItems || []);
            })
            .catch(() => {
                setError('Could not load profile. Please try again.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <main className="profile-page">
                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '40px 0' }}>Loading...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="profile-page">
                <p style={{ color: 'var(--color-danger)', textAlign: 'center', padding: '40px 0' }}>{error}</p>
            </main>
        );
    }

    return (
        <main className="profile-page">
            <section className="profile-header">
                <div className="profile-meta">
                    <img
                        className="profile-avatar"
                        src="https://images.unsplash.com/photo-1754653099086-3bddb9346d37?w=500&auto=format&fit=crop&q=60"
                        alt={profile?.name || 'Partner avatar'}
                    />
                    <div className="profile-info">
                        <h1 className="profile-pill profile-business" title="Business name">
                            {profile?.name}
                        </h1>
                        <p className="profile-pill profile-address" title="Address">
                            {profile?.address}
                        </p>
                    </div>
                </div>

                <div className="profile-stats" role="list" aria-label="Stats">
                    <div className="profile-stat" role="listitem">
                        <span className="profile-stat-label">total meals</span>
                        <span className="profile-stat-value">{videos.length}</span>
                    </div>
                    <div className="profile-stat" role="listitem">
                        <span className="profile-stat-label">total likes</span>
                        <span className="profile-stat-value">
                            {videos.reduce((sum, v) => sum + (v.likeCount || 0), 0)}
                        </span>
                    </div>
                </div>
            </section>

            <hr className="profile-sep" />

            <section className="profile-grid" aria-label="Videos">
                {videos.length === 0 && (
                    <p style={{ color: 'var(--color-text-secondary)', padding: '24px 0' }}>No videos uploaded yet.</p>
                )}
                {videos.map((v) => (
                    <div key={v._id} className="profile-grid-item">
                        <video
                            className="profile-grid-video"
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            src={v.video}
                            muted
                            playsInline
                            preload="metadata"
                        />
                    </div>
                ))}
            </section>
        </main>
    );
};

export default Profile;
