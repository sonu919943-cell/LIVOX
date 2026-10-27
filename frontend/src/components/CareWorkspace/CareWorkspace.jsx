import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { api, buildApiUrl } from "../../services/api";
const menu = [
  ["Overview", "/dashboard", "dashboard"],
  ["Medical profile", "/medical-profile", "profile"],
  ["Emergency contacts", "/emergency-contacts", "contacts"],
  ["Medical reports", "/reports", "reports"],
  ["Emergency QR", "/qr-code", "qr"],
  ["Hospitals", "/hospitals", "hospitals"],
  ["Blood donors", "/blood-donor", "donors"],
  ["Care assistant", "/ai-assistant", "assistant"],
  ["Account", "/account", "account"],
  ["Settings", "/settings", "settings"],
];
const createInitialProfile = (userName) => ({
  name: userName,
  dob: "",
  blood: "",
  phone: "",
  address: "",
  allergies: "",
  conditions: "",
  medications: "",
});

function getFirstName(name) {
  return name.split(" ")[0] || "there";
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
const Field = ({ label, value, onChange, placeholder, type = "text" }) => (
  <label className="care-field">
    <span>{label}</span>
    <input
      value={value || ""}
      type={type}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </label>
);
const Note = ({ label, value, onChange, placeholder }) => (
  <label className="care-field care-field--full">
    <span>{label}</span>
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows="3"
    />
  </label>
);
const Panel = ({ title, caption, children, action }) => (
  <section className="care-panel">
    <header>
      <div>
        <h2>{title}</h2>
        {caption && <p>{caption}</p>}
      </div>
      {action}
    </header>
    {children}
  </section>
);
export default function CareWorkspace({ screen, userName = "Guest User" }) {
  const initials = getInitials(userName);
  const token = window.localStorage.getItem("livoxToken");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState(() => createInitialProfile(userName));
  const [contacts, setContacts] = useState([
    { name: "Aarav Kumar", relation: "Brother", phone: "+91 98765 43210" },
  ]);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hi ${getFirstName(userName)}. I can help you organize your LIVOX health information.`,
    },
  ]);
  const [message, setMessage] = useState("");
  const save = (text = "Changes saved locally.") => setNotice(text);
  const update = (key) => (value) => {
    setProfile({ ...profile, [key]: value });
    setNotice("");
  };
  const saveProfile = async () => {
    if (!token) {
      setNotice("Please sign in again before saving your medical profile.");
      return;
    }

    try {
      await api("/medical-profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          dob: profile.dob,
          blood_group: profile.blood,
          phone: profile.phone,
          address: profile.address,
          allergies: profile.allergies,
          existing_conditions: profile.conditions,
          current_medications: profile.medications,
        }),
      });
      setNotice("Medical profile saved.");
    } catch (error) {
      setNotice(error.message);
    }
  };

  useEffect(() => {
    if (!token) return;

    api("/medical-profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((data) => {
        const record = data.records?.[0];
        if (!record) return;

        setProfile({
          name: record.name || userName,
          dob: record.dob || "",
          blood: record.blood_group || "",
          phone: record.phone || "",
          address: record.address || "",
          allergies: record.allergies || "",
          conditions: record.existing_conditions || "",
          medications: record.current_medications || "",
        });
      })
      .catch((error) => setNotice(error.message));
  }, [token, userName]);

  const body = renderScreen({
    contacts,
    message,
    messages,
    profile,
    save,
    saveProfile,
    screen,
    setContacts,
    setMessage,
    setMessages,
    update,
    userName,
    token,
  });
  return (
    <div className="care-shell">
      <header className="care-top">
        <Link to="/dashboard" className="care-brand">
          <b>+</b>
          <span>LIVOX</span>
        </Link>
        <div className="care-top__meta">
          <span>Secure health workspace</span>
          <button aria-label="Notifications">Notifications</button>
          <i>{initials}</i>
        </div>
      </header>
      <aside className="care-side">
        <div className="care-person">
          <i>{initials}</i>
          <div>
            <strong>{userName}</strong>
            <span>Personal account</span>
          </div>
        </div>
        <nav>
          {menu.map(([name, path, key]) => (
            <NavLink
              key={path}
              className={({ isActive }) =>
                `care-nav ${isActive ? "care-nav--active" : ""}`
              }
              to={path}
            >
              <b>{key.slice(0, 1).toUpperCase()}</b>
              {name}
            </NavLink>
          ))}
        </nav>
        <div className="care-side__bottom">
          <span>Emergency support</span>
          <p>For an immediate emergency, use your local emergency service.</p>
          <Link to="/qr-code">Open emergency card</Link>
        </div>
      </aside>
      <main className="care-main">
        {notice && (
          <div className="care-notice">
            <span>{notice}</span>
            <button onClick={() => setNotice("")}>Dismiss</button>
          </div>
        )}
        {body}
      </main>
    </div>
  );
}

function renderScreen({
  contacts,
  message,
  messages,
  profile,
  save,
  saveProfile,
  screen,
  setContacts,
  setMessage,
  setMessages,
  update,
  userName,
  token,
}) {
  switch (screen) {
    case "dashboard":
      return <Dashboard userName={userName} token={token} />;
    case "profile":
      return <Profile profile={profile} update={update} saveProfile={saveProfile} />;
    case "contacts":
      return (
        <Contacts save={save} token={token} />
      );
    case "reports":
      return <Reports save={save} token={token} />;
    case "qr":
      return <QR save={save} token={token} userName={userName} />;
    case "hospitals":
      return <Hospitals save={save} token={token} />;
    case "donors":
      return <Donors save={save} token={token} />;
    case "assistant":
      return (
        <Assistant
          messages={messages}
          message={message}
          setMessage={setMessage}
          setMessages={setMessages}
          token={token}
        />
      );
    case "account":
      return <Account save={save} userName={userName} token={token} />;
    default:
      return <Settings save={save} token={token} />;
  }
}

function Dashboard({ userName, token }) {
  const [stats, setStats] = useState({ reports: 0, contacts: 0, profile_completion: 0, has_profile: false });

  useEffect(() => {
    if (!token) return;
    api("/api/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => setStats(data.stats || stats))
      .catch((error) => console.error("Dashboard stats could not load:", error.message));
  }, [token]);

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date()).toUpperCase();

  const modules = [
    ["Medical profile", "Add your blood group and allergy details", "/medical-profile"],
    ["Emergency contacts", "Confirm who should be contacted first", "/emergency-contacts"],
    ["Emergency QR", "Create your emergency access card", "/qr-code"],
  ];

  return (
    <>
      <section className="care-welcome">
        <div>
          <p>{today}</p>
          <h1>Welcome back, {getFirstName(userName)}.</h1>
          <span>Here is the information that needs your attention today.</span>
        </div>
        <Link to="/medical-profile">Complete profile <b>&rarr;</b></Link>
      </section>
      <section className="care-stats">
        <article>
          <span>PROFILE COMPLETION</span>
          <strong>{stats.profile_completion}%</strong>
          <div><i style={{ width: `${stats.profile_completion}%` }} /></div>
          <small>{stats.has_profile ? "Keep your details up to date" : "Add your medical profile"}</small>
        </article>
        <article>
          <span>EMERGENCY CONTACTS</span>
          <strong>{stats.contacts}</strong>
          <small>Saved trusted contacts</small>
          <Link to="/emergency-contacts">Manage contacts</Link>
        </article>
        <article>
          <span>HEALTH DOCUMENTS</span>
          <strong>{stats.reports}</strong>
          <small>Reports in your workspace</small>
          <Link to="/reports">Manage reports</Link>
        </article>
      </section>
      <section className="care-section">
        <header><div><h2>Quick access</h2><p>Keep your health and emergency information up to date.</p></div></header>
        <div className="care-module-grid">
          {modules.map(([title, text, path], index) => (
            <Link to={path} key={path} className="care-module">
              <b>0{index + 1}</b><h3>{title}</h3><p>{text}</p><span>Open &rarr;</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
function Profile({ profile, update, saveProfile }) {
  return (
    <>
      <div className="care-heading">
        <div>
          <p>HEALTH RECORD</p>
          <h1>Medical profile</h1>
          <span>
            Information that can be shared quickly when you need care.
          </span>
        </div>
        <b>
          68%<small>complete</small>
        </b>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveProfile();
        }}
      >
        <Panel
          title="Personal details"
          caption="How care teams identify and contact you."
        >
          <div className="care-form">
            <Field
              label="Full name"
              value={profile.name}
              onChange={update("name")}
              placeholder="Full name"
            />
            <Field
              label="Date of birth"
              value={profile.dob}
              onChange={update("dob")}
              type="date"
            />
            <Field
              label="Blood group"
              value={profile.blood}
              onChange={update("blood")}
              placeholder="e.g. O positive"
            />
            <Field
              label="Phone number"
              value={profile.phone}
              onChange={update("phone")}
              placeholder="+91 00000 00000"
            />
            <Note
              label="Home address"
              value={profile.address}
              onChange={update("address")}
              placeholder="Street, city, state and PIN code"
            />
          </div>
        </Panel>
        <Panel
          title="Clinical information"
          caption="Details that help care providers avoid mistakes."
        >
          <div className="care-form">
            <Note
              label="Allergies"
              value={profile.allergies}
              onChange={update("allergies")}
              placeholder="e.g. Penicillin, peanuts, latex"
            />
            <Note
              label="Existing conditions"
              value={profile.conditions}
              onChange={update("conditions")}
              placeholder="e.g. Asthma, diabetes, hypertension"
            />
            <Note
              label="Current medications"
              value={profile.medications}
              onChange={update("medications")}
              placeholder="Medicine name, dosage and frequency"
            />
          </div>
        </Panel>
        <div className="care-actions">
          <button className="care-primary">Save medical profile</button>
        </div>
      </form>
    </>
  );
}
function Contacts({ save, token }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api("/emergency-contacts", { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => setContacts((data.contacts || []).map((item) => ({
        id: item.id, name: item.name, relation: item.relationship, phone: item.phone,
      }))))
      .catch((error) => save(error.message))
      .finally(() => setLoading(false));
  }, [token]);

  const change = (index, key, value) => setContacts((prev) =>
    prev.map((item, i) => i === index ? { ...item, [key]: value } : item));

  const saveContacts = async () => {
    if (!token) { save("Please sign in again."); return; }
    setSaving(true);
    try {
      const saved = [];
      for (const item of contacts) {
        if (!item.name.trim() || !item.phone.trim() || !item.relation.trim()) {
          throw new Error("Complete the name, relationship, and phone for each contact.");
        }
        const payload = { name: item.name.trim(), phone: item.phone.trim(), relationship: item.relation.trim() };
        if (item.id) {
          await api(`/emergency-contacts/${item.id}`, {
            method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload),
          });
          saved.push({ ...item, ...payload, relation: payload.relationship });
        } else {
          const data = await api("/emergency-contacts", {
            method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload),
          });
          saved.push({ ...data.contact, relation: data.contact.relationship });
        }
      }
      setContacts(saved);
      save("Emergency contacts saved to your account.");
    } catch (error) {
      save(error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeContact = async (index) => {
    const item = contacts[index];
    if (item.id && token) {
      try {
        await api(`/emergency-contacts/${item.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      } catch (error) {
        save(error.message);
        return;
      }
    }
    setContacts((prev) => prev.filter((_, i) => i !== index));
    save("Contact removed.");
  };

  return (
    <>
      <div className="care-heading">
        <div><p>SAFETY NETWORK</p><h1>Emergency contacts</h1><span>Manage trusted people to contact in an emergency.</span></div>
        <button className="care-primary" onClick={() => setContacts((prev) => [...prev, { name: "", relation: "", phone: "" }])}>Add contact</button>
      </div>
      <Panel title="Your contacts" caption={loading ? "Loading saved contacts..." : `${contacts.length} contact(s) saved to your account.`}>
        {contacts.length === 0 && !loading && <div className="care-empty">No contacts yet. Select “Add contact” to begin.</div>}
        <div className="care-contact-table">
          <div className="care-table-head"><span>Priority</span><span>Name</span><span>Relationship</span><span>Phone</span></div>
          {contacts.map((item, index) => (
            <div className="care-table-row" key={item.id || `new-${index}`}>
              <b>{index + 1}</b>
              <input value={item.name} onChange={(e) => change(index, "name", e.target.value)} placeholder="Contact name" />
              <input value={item.relation} onChange={(e) => change(index, "relation", e.target.value)} placeholder="Relationship" />
              <input value={item.phone} onChange={(e) => change(index, "phone", e.target.value)} placeholder="Phone number" />
              <button type="button" onClick={() => removeContact(index)} aria-label={`Remove ${item.name || "contact"}`}>Remove</button>
            </div>
          ))}
        </div>
        <div className="care-actions"><button className="care-primary" onClick={saveContacts} disabled={saving}>{saving ? "Saving..." : "Save contacts"}</button></div>
      </Panel>
    </>
  );
}
function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileBadge(filename = "") {
  const ext = filename.split(".").pop()?.toUpperCase() || "DOC";
  return ext.slice(0, 4);
}

function Reports({ save, token }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    setLoading(true);
    api("/api/reports", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((data) => {
        if (isMounted && data?.reports) {
          setFiles(data.reports);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch reports:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!token) {
      save("Please sign in to upload reports to your secure vault.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);

      const ext = file.name.split(".").pop()?.toLowerCase();
      let detectedType = "Lab result";
      if (file.name.toLowerCase().includes("prescription")) {
        detectedType = "Prescription";
      } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        detectedType = "Medical scan";
      }
      formData.append("type", detectedType);

      const response = await api("/api/reports/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response?.report) {
        setFiles((prev) => [response.report, ...prev]);
        save(`"${file.name}" uploaded to secure vault.`);
      }
    } catch (err) {
      save(err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const fetchReportBlob = async (path) => {
    const response = await fetch(buildApiUrl(path), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Unable to retrieve this report.");
    }
    return response.blob();
  };

  const handleOpen = async (file) => {
    if (!file.view_url || !token) return;
    const tab = window.open("about:blank", "_blank");
    try {
      const blob = await fetchReportBlob(file.view_url);
      const objectUrl = URL.createObjectURL(blob);
      if (tab) {
        tab.location.href = objectUrl;
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }
      save(`Opened "${file.name}".`);
    } catch (error) {
      if (tab) tab.close();
      save(error.message);
    }
  };

  const handleDownload = async (file) => {
    if (!file.download_url || !token) return;
    try {
      const blob = await fetchReportBlob(file.download_url);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.name || "report";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      save(`Downloading "${file.name}".`);
    } catch (error) {
      save(error.message);
    }
  };

  const handleDelete = async (file) => {
    if (!token || !file.id) return;
    if (!window.confirm(`Delete "${file.name}" permanently?`)) return;

    try {
      await api(`/api/reports/${file.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFiles((prev) => prev.filter((item) => item.id !== file.id));
      save(`Deleted "${file.name}".`);
    } catch (err) {
      save(err.message || "Failed to delete report.");
    }
  };

  return (
    <>
      <div className="care-heading">
        <div>
          <p>DOCUMENT VAULT</p>
          <h1>Medical reports</h1>
          <span>Keep health documents organized, encrypted, and accessible.</span>
        </div>
        <label className="care-primary" style={{ cursor: uploading ? "wait" : "pointer" }}>
          {uploading ? "Uploading..." : "Upload report"}
          <input
            hidden
            type="file"
            disabled={uploading}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt"
            onChange={handleUpload}
          />
        </label>
      </div>
      <Panel
        title="Your documents"
        caption={
          loading
            ? "Loading your secure documents..."
            : `${files.length} document${files.length === 1 ? "" : "s"} in your secure workspace.`
        }
      >
        {files.length === 0 && !loading ? (
          <div className="care-empty">
            No medical documents found in your vault. Click <strong>Upload report</strong> above to store lab results, prescriptions, and scans.
          </div>
        ) : (
          <div className="care-docs">
            {files.map((file, index) => (
              <article key={file.id || index}>
                <b>{getFileBadge(file.name)}</b>
                <div>
                  <strong>{file.name}</strong>
                  <span>
                    {file.type} {file.size ? `• ${formatFileSize(file.size)}` : ""} • {file.date}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => handleOpen(file)}>Open</button>
                  <button onClick={() => handleDownload(file)}>Download</button>
                  <button
                    onClick={() => handleDelete(file)}
                    style={{ color: "#c0392b", borderColor: "#f2dede" }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
function QR({ save, token, userName }) {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateQr = async () => {
    if (!token) {
      save("Please sign in again before generating your QR card.");
      return;
    }

    setLoading(true);
    try {
      const data = await api("/api/qr/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQr(data);
      save("Emergency QR card generated.");
    } catch (error) {
      save(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="care-heading">
        <div>
          <p>EMERGENCY ACCESS</p>
          <h1>Emergency QR card</h1>
          <span>Enable emergency QR sharing in Settings and save your medical profile before generating a card.</span>
        </div>
      </div>
      <section className="care-qr-layout">
        <Panel
          title="Your active card"
          caption="Anyone who scans your card can view the selected emergency details. Enable sharing in Settings first."
        >
          <div className="care-qr">
            {qr?.image_url ? (
              <img
                alt="Emergency QR code"
                src={buildApiUrl(qr.image_url)}
              />
            ) : (
              <div>
                <b>LIVOX</b>
                <span>
                  EMERGENCY
                  <br />
                  PROFILE
                </span>
              </div>
            )}
            <p>{userName}</p>
            <small>
              {qr?.qr_url
                ? "Scan to access emergency health details"
                : "Enable emergency QR sharing in Settings, then generate your QR"}
            </small>
          </div>
          <div className="care-qr-actions">
            <button
              className="care-primary"
              onClick={generateQr}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate QR"}
            </button>
            {qr?.image_url && (
              <a href={buildApiUrl(qr.image_url)} download>
                Download card
              </a>
            )}
          </div>
        </Panel>
        <Panel
          title="Shared information"
          caption="This is the minimum profile shown after scanning."
        >
          <ul className="care-list">
            <li>Full name and date of birth</li>
            <li>Blood group and allergies</li>
            <li>Emergency contacts</li>
            <li>Current medications</li>
          </ul>
          <Link to="/medical-profile">Edit shared information</Link>
        </Panel>
      </section>
    </>
  );
}
function Hospitals({ save, token }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const findHospitals = () => {
    if (!token) { save("Please sign in to search nearby hospitals."); return; }
    if (!navigator.geolocation) { setError("This browser does not support location access."); return; }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const params = new URLSearchParams({
          lat: String(position.coords.latitude),
          lon: String(position.coords.longitude),
          radius: "10000",
        });
        const data = await api(`/api/hospitals/nearby?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlaces(data.hospitals || []);
        if (!data.hospitals?.length) setError("No mapped hospitals or clinics were found nearby.");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, (geoError) => {
      setLoading(false);
      setError(geoError.code === 1 ? "Location permission was denied. Allow location access and try again." : "Could not get your location. Check device location settings.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  };

  return (
    <>
      <div className="care-heading">
        <div><p>CARE NEAR YOU</p><h1>Hospitals</h1><span>Search mapped hospitals and clinics near your current location.</span></div>
        <button className="care-primary" onClick={findHospitals} disabled={loading}>{loading ? "Searching..." : "Use my location"}</button>
      </div>
      <Panel title="Nearby facilities" caption="Your location is requested only after you press the search button.">
        {error && <p className="care-empty">{error}</p>}
        {places.length === 0 && !loading && !error && <div className="care-empty">Press “Use my location” to find nearby hospitals and clinics. Results are from OpenStreetMap and may not be complete.</div>}
        <div className="care-hospital-list">
          {places.map((place, index) => (
            <article key={`${place.name}-${place.lat}-${place.lon}`}>
              <b>H</b><div><strong>{place.name}</strong><span>{place.distance_km} km · {place.type}{place.address ? ` · ${place.address}` : ""}{place.phone ? ` · ${place.phone}` : ""}</span></div>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`} target="_blank" rel="noreferrer">Directions</a>
            </article>
          ))}
        </div>
        <small>Map data © OpenStreetMap contributors. In an emergency, call your local emergency number.</small>
      </Panel>
    </>
  );
}
function Donors({ save, token }) {
  const [group, setGroup] = useState("");
  const [city, setCity] = useState("");
  const [donors, setDonors] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [myDonor, setMyDonor] = useState({ blood_group: "O+", city: "", phone: "", available: true, consent: false });
  const [registering, setRegistering] = useState(false);

  const search = async (event) => {
    event?.preventDefault();
    if (!token) { save("Please sign in to search donor listings."); return; }
    if (!group && !city.trim()) { save("Enter a blood group or city to search."); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (group) params.set("blood_group", group);
      if (city.trim()) params.set("city", city.trim());
      const data = await api(`/api/donors?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonors(data.donors || []);
      setSearched(true);
      if (!data.donors?.length) save("No consented donor listings matched your search.");
    } catch (error) {
      save(error.message);
    } finally {
      setLoading(false);
    }
  };

  const registerDonor = async (event) => {
    event.preventDefault();
    if (!token) { save("Please sign in again."); return; }
    if (!myDonor.consent) { save("Consent is required before publishing your donor listing."); return; }
    setRegistering(true);
    try {
      await api("/api/donors", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(myDonor),
      });
      save("Your opt-in donor listing was saved.");
      setShowRegistration(false);
    } catch (error) {
      save(error.message);
    } finally {
      setRegistering(false);
    }
  };

  const removeDonor = async () => {
    if (!token || !window.confirm("Remove your donor listing?")) return;
    try {
      await api("/api/donors", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      save("Your donor listing was removed.");
    } catch (error) {
      save(error.message);
    }
  };

  return (
    <>
      <div className="care-heading">
        <div><p>COMMUNITY CARE</p><h1>Blood donors</h1><span>Search opt-in donor listings by blood group and city.</span></div>
        <button className="care-primary" onClick={() => setShowRegistration((value) => !value)}>{showRegistration ? "Close form" : "Register as donor"}</button>
      </div>
      {showRegistration && (
        <Panel title="Register as a donor" caption="Your phone number is visible to signed-in LIVOX users only when you consent.">
          <form onSubmit={registerDonor}>
            <div className="care-form">
              <label className="care-field"><span>Blood group</span>
                <select value={myDonor.blood_group} onChange={(e) => setMyDonor({ ...myDonor, blood_group: e.target.value })}>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <Field label="City or area" value={myDonor.city} onChange={(value) => setMyDonor({ ...myDonor, city: value })} placeholder="e.g. Faridabad" />
              <Field label="Phone number" value={myDonor.phone} onChange={(value) => setMyDonor({ ...myDonor, phone: value })} placeholder="Phone number" />
            </div>
            <label className="care-field"><span><input type="checkbox" checked={myDonor.available} onChange={(e) => setMyDonor({ ...myDonor, available: e.target.checked })} /> I am currently available to donate</span></label>
            <label className="care-field"><span><input required type="checkbox" checked={myDonor.consent} onChange={(e) => setMyDonor({ ...myDonor, consent: e.target.checked })} /> I consent to share my donor listing and phone with signed-in users</span></label>
            <div className="care-actions"><button className="care-primary" disabled={registering}>{registering ? "Saving..." : "Save donor listing"}</button><button type="button" onClick={removeDonor}>Remove my listing</button></div>
          </form>
        </Panel>
      )}
      <Panel title="Find donors" caption="Only donors who have explicitly consented to appear are listed.">
        <form className="care-search-row" onSubmit={search}>
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">Any blood group</option>
            {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City or area" />
          <button className="care-primary" disabled={loading}>{loading ? "Searching..." : "Search"}</button>
        </form>
        {searched && donors.length === 0 && <div className="care-empty">No matching donor listings. Try a different blood group or city.</div>}
        <div className="care-hospital-list">
          {donors.map((donor) => (
            <article key={donor.id}><b>{donor.blood_group}</b><div><strong>{donor.city}</strong><span>Opt-in donor · Contact: {donor.phone}</span></div><a href={`tel:${donor.phone}`}>Call</a></article>
          ))}
        </div>
        <small>Use listings responsibly. Verify availability and compatibility with a qualified medical professional or blood bank.</small>
      </Panel>
    </>
  );
}
function Assistant({ messages, message, setMessage, setMessages, token }) {
  const [sending, setSending] = useState(false);
  const send = async (event) => {
    event.preventDefault();
    const question = message.trim();
    if (!question || sending) return;
    if (!token) { setMessages((prev) => [...prev, { role: "assistant", text: "Please sign in again to use the care assistant." }]); return; }
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setMessage("");
    setSending(true);
    try {
      const data = await api("/api/assistant/chat", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: question }),
      });
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: error.message }]);
    } finally {
      setSending(false);
    }
  };
  return (
    <>
      <div className="care-heading"><div><p>LIVOX CARE ASSISTANT</p><h1>Care assistant</h1><span>General health education and help using your workspace.</span></div></div>
      <section className="care-chat" aria-live="polite">
        {messages.map((item, index) => <p className={`care-bubble care-bubble--${item.role}`} key={index}>{item.text}</p>)}
        {sending && <p className="care-bubble care-bubble--assistant">Thinking…</p>}
      </section>
      <form className="care-compose" onSubmit={send}>
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask a general health question..." maxLength={4000} />
        <button className="care-primary" disabled={sending || !message.trim()}>{sending ? "Sending..." : "Send"}</button>
      </form>
      <p className="care-empty">This assistant provides general information, not diagnosis or treatment. For urgent symptoms, contact local emergency services.</p>
    </>
  );
}
function Account({ save, userName, token }) {
  const [form, setForm] = useState({ name: userName || "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api("/api/account", { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => setForm({ name: data.user?.name || userName || "", email: data.user?.email || "", phone: data.user?.phone || "" }))
      .catch((error) => save(error.message))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async (event) => {
    event.preventDefault();
    if (!token) { save("Please sign in again."); return; }
    setSaving(true);
    try {
      const data = await api("/api/account", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: form.name, phone: form.phone }),
      });
      window.localStorage.setItem("livoxUserName", data.user.name);
      setForm((prev) => ({ ...prev, name: data.user.name, phone: data.user.phone }));
      save("Account details updated. Reload the page to refresh the workspace header.");
    } catch (error) {
      save(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="care-heading"><div><p>ACCOUNT</p><h1>Account profile</h1><span>Manage the information used to sign in to LIVOX.</span></div></div>
      <Panel title="Account details" caption={loading ? "Loading account..." : "Email address is read-only in this screen."}>
        <form onSubmit={submit}>
          <div className="care-form">
            <Field label="Display name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="Full name" />
            <Field label="Email address" value={form.email} onChange={() => {}} />
            <Field label="Mobile number" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="+91 00000 00000" />
          </div>
          <div className="care-actions"><button className="care-primary" disabled={loading || saving}>{saving ? "Saving..." : "Save account changes"}</button></div>
        </form>
      </Panel>
    </>
  );
}
function Settings({ save, token }) {
  const defaults = { notify: true, share: false, reminder: true };
  const [state, setState] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api("/api/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => setState({ ...defaults, ...(data.settings || {}) }))
      .catch((error) => save(error.message))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async () => {
    if (!token) { save("Please sign in again."); return; }
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(state),
      });
      save("Settings saved to your account.");
    } catch (error) {
      save(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="care-heading"><div><p>PREFERENCES</p><h1>Settings</h1><span>Control notifications and emergency sharing preferences.</span></div></div>
      <Panel title="Privacy and notifications" caption={loading ? "Loading preferences..." : "Changes are saved to your account."}>
        <div className="care-toggles">
          {[
            ["notify", "Health reminders and notifications"],
            ["share", "Allow emergency QR sharing"],
            ["reminder", "Monthly profile review reminder"],
          ].map(([key, label]) => (
            <label key={key}><div><strong>{label}</strong><span>Manage this preference for your LIVOX account.</span></div><input type="checkbox" checked={Boolean(state[key])} onChange={(e) => setState((prev) => ({ ...prev, [key]: e.target.checked }))} /></label>
          ))}
        </div>
        <div className="care-actions"><button className="care-primary" onClick={submit} disabled={loading || saving}>{saving ? "Saving..." : "Save preferences"}</button></div>
      </Panel>
    </>
  );
}
