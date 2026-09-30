import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";
import "./Emergency.css";

export default function Emergency() {
  const { userId } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/qr/user/${userId}`)
      .then((data) => {
        setProfile(data.profile);
      })
      .catch((error) => {
        setError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return <h2>Loading emergency profile...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  if (!profile) {
    return <h2>Profile not found</h2>;
  }

  return (
    <div className="emergency-page">

      <h1>🚨 LIVOX Emergency Profile</h1>

      <div className="emergency-card">

        <h2>{profile.name}</h2>

        <p>
          <strong>Date of Birth:</strong>{" "}
          {profile.dob}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {profile.phone}
        </p>

        <p>
          <strong>Blood Group:</strong>{" "}
          {profile.blood_group}
        </p>

        <p>
          <strong>Allergies:</strong>{" "}
          {profile.allergies || "None"}
        </p>

        <p>
          <strong>Existing Conditions:</strong>{" "}
          {profile.existing_conditions || "None"}
        </p>

        <p>
          <strong>Current Medications:</strong>{" "}
          {profile.current_medications || "None"}
        </p>

      </div>

    </div>
  );
}
