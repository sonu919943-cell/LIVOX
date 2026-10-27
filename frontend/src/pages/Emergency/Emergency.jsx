import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";
import "./Emergency.css";

export default function Emergency() {
  const { userId: publicToken } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api(`/api/qr/user/${encodeURIComponent(publicToken)}`)
      .then((data) => { if (active) setProfile(data.profile || null); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [publicToken]);

  if (loading) return <div className="emergency-loading"><h2>Loading emergency profile...</h2></div>;
  if (error) return <div className="emergency-error"><h2>Unable to load profile</h2><p>{error}</p></div>;
  if (!profile) return <div className="emergency-error"><h2>Profile not found</h2></div>;

  return (
    <main className="emergency-page">
      <div className="emergency-container">
        <header className="emergency-header">
          <h1>🚨 LIVOX Emergency Profile</h1>
          <p>Essential medical details for emergency situations.</p>
        </header>
        <div className="emergency-alert">Emergency medical information — verify details with the person when possible.</div>
        <section className="emergency-card">
          <h2>{profile.name}</h2>
          <div className="emergency-info">
            <p><strong>Date of Birth:</strong> {profile.dob || "Not provided"}</p>
            <p><strong>Phone:</strong> {profile.phone || "Not provided"}</p>
            <p><strong>Blood Group:</strong> {profile.blood_group || "Not provided"}</p>
            <p><strong>Allergies:</strong> {profile.allergies || "Not provided"}</p>
            <p><strong>Existing Conditions:</strong> {profile.existing_conditions || "Not provided"}</p>
            <p><strong>Current Medications:</strong> {profile.current_medications || "Not provided"}</p>
          </div>
          {profile.emergency_contacts?.length > 0 && (
            <section className="emergency-contacts">
              <h3>Emergency contacts</h3>
              {profile.emergency_contacts.map((contact, index) => (
                <p key={`${contact.phone}-${index}`}>
                  <strong>{contact.name} ({contact.relationship}):</strong>{" "}
                  <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                </p>
              ))}
            </section>
          )}
        </section>
        <p className="emergency-footer">If this is a medical emergency, contact your local emergency service. This page is informational and may not be up to date.</p>
      </div>
    </main>
  );
}
