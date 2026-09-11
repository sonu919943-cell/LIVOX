import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
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
const initial = {
  name: "Sonu Kumar",
  dob: "",
  blood: "",
  phone: "",
  address: "",
  allergies: "",
  conditions: "",
  medications: "",
};
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
export default function CareWorkspace({ screen }) {
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState(initial);
  const [contacts, setContacts] = useState([
    { name: "Aarav Kumar", relation: "Brother", phone: "+91 98765 43210" },
  ]);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi Sonu. I can help you organize your LIVOX health information.",
    },
  ]);
  const [message, setMessage] = useState("");
  const save = (text = "Changes saved locally.") => setNotice(text);
  const update = (key) => (value) => {
    setProfile({ ...profile, [key]: value });
    setNotice("");
  };
  const body =
    screen === "dashboard" ? (
      <Dashboard />
    ) : screen === "profile" ? (
      <Profile profile={profile} update={update} save={save} />
    ) : screen === "contacts" ? (
      <Contacts contacts={contacts} setContacts={setContacts} save={save} />
    ) : screen === "reports" ? (
      <Reports save={save} />
    ) : screen === "qr" ? (
      <QR save={save} />
    ) : screen === "hospitals" ? (
      <Hospitals save={save} />
    ) : screen === "donors" ? (
      <Donors save={save} />
    ) : screen === "assistant" ? (
      <Assistant
        messages={messages}
        message={message}
        setMessage={setMessage}
        setMessages={setMessages}
      />
    ) : screen === "account" ? (
      <Account save={save} />
    ) : (
      <Settings save={save} />
    );
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
          <i>SK</i>
        </div>
      </header>
      <aside className="care-side">
        <div className="care-person">
          <i>SK</i>
          <div>
            <strong>Sonu Kumar</strong>
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
function Dashboard() {
  const modules = [
    [
      "Medical profile",
      "Add your blood group and allergy details",
      "/medical-profile",
    ],
    [
      "Emergency contacts",
      "Confirm who should be contacted first",
      "/emergency-contacts",
    ],
    ["Emergency QR", "Your emergency card is available", "/qr-code"],
  ];
  return (
    <>
      <section className="care-welcome">
        <div>
          <p>WEDNESDAY, 11 SEPTEMBER</p>
          <h1>Welcome back, Sonu.</h1>
          <span>Here is the information that needs your attention today.</span>
        </div>
        <Link to="/medical-profile">
          Complete profile <b>?</b>
        </Link>
      </section>
      <section className="care-stats">
        <article>
          <span>PROFILE COMPLETION</span>
          <strong>68%</strong>
          <div>
            <i style={{ width: "68%" }} />
          </div>
          <small>4 details remaining</small>
        </article>
        <article>
          <span>EMERGENCY CARD</span>
          <strong className="ok">Active</strong>
          <small>Your QR card is ready to share</small>
          <Link to="/qr-code">View card</Link>
        </article>
        <article>
          <span>HEALTH DOCUMENTS</span>
          <strong>4</strong>
          <small>Reports securely stored</small>
          <Link to="/reports">Manage reports</Link>
        </article>
      </section>
      <section className="care-layout">
        <Panel
          title="Today?s checklist"
          caption="Small updates make your emergency profile more useful."
        >
          <div className="care-check">
            <span>1</span>
            <div>
              <strong>Add blood group</strong>
              <p>This helps clinicians make fast decisions.</p>
            </div>
            <Link to="/medical-profile">Update</Link>
          </div>
          <div className="care-check">
            <span>2</span>
            <div>
              <strong>Confirm emergency contact</strong>
              <p>Make sure their phone number is current.</p>
            </div>
            <Link to="/emergency-contacts">Review</Link>
          </div>
          <div className="care-check">
            <span>3</span>
            <div>
              <strong>Review medications</strong>
              <p>Keep dosage and medicine names accurate.</p>
            </div>
            <Link to="/medical-profile">Update</Link>
          </div>
        </Panel>
        <Panel title="Recent activity" caption="Your health record timeline.">
          <div className="care-timeline">
            <i />
            <div>
              <strong>Workspace created</strong>
              <span>Today</span>
            </div>
          </div>
          <div className="care-empty">
            Your updates will appear here as you use LIVOX.
          </div>
        </Panel>
      </section>
      <section className="care-section">
        <header>
          <div>
            <h2>Quick access</h2>
            <p>Use these areas to keep your care information up to date.</p>
          </div>
        </header>
        <div className="care-module-grid">
          {modules.map(([title, text, path], index) => (
            <Link to={path} key={path} className="care-module">
              <b>0{index + 1}</b>
              <h3>{title}</h3>
              <p>{text}</p>
              <span>Open ?</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
function Profile({ profile, update, save }) {
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
          save("Medical profile saved locally.");
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
function Contacts({ contacts, setContacts, save }) {
  const change = (index, key, value) =>
    setContacts(
      contacts.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    );
  return (
    <>
      <div className="care-heading">
        <div>
          <p>SAFETY NETWORK</p>
          <h1>Emergency contacts</h1>
          <span>
            Choose people LIVOX should help you reach in an emergency.
          </span>
        </div>
        <button
          className="care-primary"
          onClick={() =>
            setContacts([...contacts, { name: "", relation: "", phone: "" }])
          }
        >
          Add contact
        </button>
      </div>
      <Panel
        title="Your contacts"
        caption="The first listed contact is treated as primary."
      >
        <div className="care-contact-table">
          <div className="care-table-head">
            <span>Priority</span>
            <span>Name</span>
            <span>Relationship</span>
            <span>Phone</span>
          </div>
          {contacts.map((item, index) => (
            <div className="care-table-row" key={index}>
              <b>{index + 1}</b>
              <input
                value={item.name}
                onChange={(e) => change(index, "name", e.target.value)}
                placeholder="Contact name"
              />
              <input
                value={item.relation}
                onChange={(e) => change(index, "relation", e.target.value)}
                placeholder="Relationship"
              />
              <input
                value={item.phone}
                onChange={(e) => change(index, "phone", e.target.value)}
                placeholder="Phone number"
              />
            </div>
          ))}
        </div>
        <div className="care-actions">
          <button
            className="care-primary"
            onClick={() => save("Emergency contacts saved locally.")}
          >
            Save contacts
          </button>
        </div>
      </Panel>
    </>
  );
}
function Reports({ save }) {
  const [files, setFiles] = useState([
    { name: "Blood test report.pdf", type: "Lab result", date: "08 Sep 2026" },
    { name: "Prescription.pdf", type: "Prescription", date: "01 Sep 2026" },
  ]);
  return (
    <>
      <div className="care-heading">
        <div>
          <p>DOCUMENT VAULT</p>
          <h1>Medical reports</h1>
          <span>Keep health documents organized and accessible.</span>
        </div>
        <label className="care-primary">
          Upload report
          <input
            hidden
            type="file"
            onChange={(e) => {
              if (e.target.files[0]) {
                setFiles([
                  ...files,
                  {
                    name: e.target.files[0].name,
                    type: "New upload",
                    date: "Today",
                  },
                ]);
                save("Report added to your local workspace.");
              }
            }}
          />
        </label>
      </div>
      <Panel
        title="Your documents"
        caption={`${files.length} documents in your secure workspace.`}
      >
        <div className="care-docs">
          {files.map((file, index) => (
            <article key={index}>
              <b>PDF</b>
              <div>
                <strong>{file.name}</strong>
                <span>
                  {file.type} ? {file.date}
                </span>
              </div>
              <button onClick={() => save(`Opened ${file.name}.`)}>Open</button>
            </article>
          ))}
        </div>
      </Panel>
    </>
  );
}
function QR({ save }) {
  return (
    <>
      <div className="care-heading">
        <div>
          <p>EMERGENCY ACCESS</p>
          <h1>Emergency QR card</h1>
          <span>A scannable card that can share selected medical details.</span>
        </div>
      </div>
      <section className="care-qr-layout">
        <Panel
          title="Your active card"
          caption="Only the information you choose is shared."
        >
          <div className="care-qr">
            <div>
              <b>LIVOX</b>
              <span>
                EMERGENCY
                <br />
                PROFILE
              </span>
            </div>
            <p>Sonu Kumar</p>
            <small>Scan to access emergency health details</small>
          </div>
          <div className="care-qr-actions">
            <button
              className="care-primary"
              onClick={() => save("QR card download prepared locally.")}
            >
              Download card
            </button>
            <button onClick={() => save("QR sharing options opened locally.")}>
              Share securely
            </button>
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
function Hospitals({ save }) {
  const [searched, setSearched] = useState(false);
  const hospitals = [
    ["City Care Hospital", "2.1 km away", "24 hours ? Emergency care"],
    [
      "Green Valley Medical Centre",
      "3.7 km away",
      "24 hours ? Multi-specialty",
    ],
    ["Sunrise Clinic", "4.5 km away", "Open until 9:00 PM"],
  ];
  return (
    <>
      <div className="care-heading">
        <div>
          <p>CARE NEAR YOU</p>
          <h1>Hospitals</h1>
          <span>Find nearby medical facilities when you need care.</span>
        </div>
        <button
          className="care-primary"
          onClick={() => {
            setSearched(true);
            save("Nearby facilities refreshed.");
          }}
        >
          Use my location
        </button>
      </div>
      <Panel
        title={searched ? "Facilities near you" : "Search nearby care"}
        caption="Location is only used after you request a search."
      >
        <div className="care-map">
          <div>
            <b>+</b>
            <span>Map view</span>
            <small>Select ?Use my location? to refresh results.</small>
          </div>
        </div>
        <div className="care-hospital-list">
          {hospitals.map(([name, distance, detail]) => (
            <article key={name}>
              <b>H</b>
              <div>
                <strong>{name}</strong>
                <span>
                  {distance} ? {detail}
                </span>
              </div>
              <button
                onClick={() => save(`Directions to ${name} opened locally.`)}
              >
                Directions
              </button>
            </article>
          ))}
        </div>
      </Panel>
    </>
  );
}
function Donors({ save }) {
  const [group, setGroup] = useState("");
  return (
    <>
      <div className="care-heading">
        <div>
          <p>COMMUNITY CARE</p>
          <h1>Blood donors</h1>
          <span>Search for nearby donors by blood group and location.</span>
        </div>
      </div>
      <Panel
        title="Find donors"
        caption="Use verified donor information responsibly."
      >
        <div className="care-search-row">
          <input
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="Blood group, e.g. O positive"
          />
          <input placeholder="City or area" />
          <button
            className="care-primary"
            onClick={() =>
              save(
                group
                  ? `Searching for ${group} donors locally.`
                  : "Enter a blood group to search.",
              )
            }
          >
            Search
          </button>
        </div>
        <div className="care-empty">
          Donor results will appear after your local search.
        </div>
      </Panel>
    </>
  );
}
function Assistant({ messages, message, setMessage, setMessages }) {
  const send = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMessages([
      ...messages,
      { role: "user", text: message },
      {
        role: "assistant",
        text: "I can help you organize health information, but I cannot diagnose conditions. For urgent symptoms, contact a qualified clinician or emergency service.",
      },
    ]);
    setMessage("");
  };
  return (
    <>
      <div className="care-heading">
        <div>
          <p>LIVOX CARE ASSISTANT</p>
          <h1>Care assistant</h1>
          <span>General health information and help using your workspace.</span>
        </div>
      </div>
      <section className="care-chat">
        {messages.map((item, index) => (
          <p className={`care-bubble care-bubble--${item.role}`} key={index}>
            {item.text}
          </p>
        ))}
      </section>
      <form className="care-compose" onSubmit={send}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about your LIVOX workspace..."
        />
        <button className="care-primary">Send</button>
      </form>
    </>
  );
}
function Account({ save }) {
  return (
    <>
      <div className="care-heading">
        <div>
          <p>ACCOUNT</p>
          <h1>Account profile</h1>
          <span>Manage the information used to sign in to LIVOX.</span>
        </div>
      </div>
      <Panel
        title="Account details"
        caption="Update your personal account information."
      >
        <div className="care-form">
          <Field label="Display name" value="Sonu Kumar" onChange={() => {}} />
          <Field
            label="Email address"
            value="sonu@example.com"
            onChange={() => {}}
          />
          <Field
            label="Mobile number"
            value=""
            onChange={() => {}}
            placeholder="+91 00000 00000"
          />
        </div>
        <div className="care-actions">
          <button className="care-primary" onClick={() => save()}>
            Save account changes
          </button>
        </div>
      </Panel>
    </>
  );
}
function Settings({ save }) {
  const [state, setState] = useState({
    notify: true,
    share: false,
    reminder: true,
  });
  return (
    <>
      <div className="care-heading">
        <div>
          <p>PREFERENCES</p>
          <h1>Settings</h1>
          <span>Control notifications and how your information is used.</span>
        </div>
      </div>
      <Panel
        title="Privacy and notifications"
        caption="You can change these options at any time."
      >
        <div className="care-toggles">
          {[
            ["notify", "Health reminders and notifications"],
            ["share", "Allow emergency QR sharing"],
            ["reminder", "Monthly profile review reminder"],
          ].map(([key, label]) => (
            <label key={key}>
              <div>
                <strong>{label}</strong>
                <span>Manage this preference for your LIVOX account.</span>
              </div>
              <input
                type="checkbox"
                checked={state[key]}
                onChange={(e) =>
                  setState({ ...state, [key]: e.target.checked })
                }
              />
            </label>
          ))}
        </div>
        <div className="care-actions">
          <button
            className="care-primary"
            onClick={() => save("Settings saved locally.")}
          >
            Save preferences
          </button>
        </div>
      </Panel>
    </>
  );
}
