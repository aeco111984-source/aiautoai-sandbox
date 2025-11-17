import { useState } from "react";

const TEMPLATES = {
  blank: `
    <section class="sandbox-section">
      <h1>New Project</h1>
      <p>Start building...</p>
    </section>
  `,
  fx: `
    <section class="sandbox-section">
      <header><h1>FX Site</h1></header>
    </section>

    <section class="sandbox-section">
      <h2>Live Converter</h2>
      <p>[converter placeholder]</p>
    </section>

    <section class="sandbox-section">
      <h2>Live Rates</h2>
      <p>[rates placeholder]</p>
    </section>

    <section class="sandbox-section">
      <p>About · Privacy</p>
    </section>
  `,
  simple: `
    <section class="sandbox-section">
      <header><h1>Simple Landing</h1></header>
    </section>

    <section class="sandbox-section">
      <h2>Headline</h2>
      <p>Explain your value here.</p>
    </section>

    <section class="sandbox-section">
      <p>Contact · Terms</p>
    </section>
  `
};

// Convert chat text → structured command
function buildCommandFromText(text) {
  const t = text.toLowerCase();

  if (t.includes("add about")) {
    return { type: "ADD_SECTION", html: `
      <section class="sandbox-section">
        <h2>About</h2>
        <p>Write about your project here.</p>
      </section>
    ` };
  }

  if (t.includes("add pricing")) {
    return { type: "ADD_SECTION", html: `
      <section class="sandbox-section">
        <h2>Pricing</h2>
        <p>Basic · Pro · Enterprise.</p>
      </section>
    ` };
  }

  if (t.includes("make fx")) {
    return { type: "SET_TEMPLATE", template: "fx" };
  }

  if (t.includes("simplify")) {
    return { type: "SET_TEMPLATE", template: "simple" };
  }

  return null;
}

function describeCommand(cmd) {
  if (!cmd) return "";
  if (cmd.type === "ADD_SECTION") return "Add a clean, styled section to the page.";
  if (cmd.type === "SET_TEMPLATE" && cmd.template === "fx") return "Switch to the FX template.";
  if (cmd.type === "SET_TEMPLATE" && cmd.template === "simple") return "Switch to the Simple Landing template.";
  return "Unknown action.";
}

export default function Home() {
  const [projects, setProjects] = useState([
    { id: 1, name: "My First Site", type: "simple", html: TEMPLATES.simple }
  ]);

  const [activeId, setActiveId] = useState(1);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState([
    { from: "system", text: "Welcome to Sandbox v1.2. Type a request, approve it, and see perfectly visible sections." }
  ]);
  const [pendingCommand, setPendingCommand] = useState(null);

  const activeProject = projects.find(p => p.id === activeId);

  function addProject(type) {
    const id = Date.now();
    const name = type === "fx" ? "New FX Site" : "New Blank Site";
    const html = type === "fx" ? TEMPLATES.fx : TEMPLATES.blank;

    setProjects(prev => [...prev, { id, name, type, html }]);
    setActiveId(id);

    setChatLog(prev => [...prev, { from: "system", text: `Created ${name} using ${type} template.` }]);
    setPendingCommand(null);
  }

  function handleChatSubmit(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatLog(prev => [...prev, { from: "user", text: userText }]);
    setChatInput("");

    const cmd = buildCommandFromText(userText);

    if (!cmd) {
      setChatLog(prev => [
        ...prev,
        {
          from: "system",
          text: "Unrecognized. Try: 'add about', 'add pricing', 'make fx', or 'simplify'."
        }
      ]);
      setPendingCommand(null);
      return;
    }

    setPendingCommand(cmd);

    setChatLog(prev => [
      ...prev,
      {
        from: "system",
        text: "Proposed action: " + describeCommand(cmd)
      }
    ]);
  }

  function applyCommand(cmd) {
    if (!cmd || !activeProject) return;

    let html = activeProject.html || "";

    if (cmd.type === "ADD_SECTION") {
      html += cmd.html;
    }

    if (cmd.type === "SET_TEMPLATE") {
      html = TEMPLATES[cmd.template];
    }

    setProjects(prev =>
      prev.map(p => (p.id === activeProject.id ? { ...p, html } : p))
    );

    setChatLog(prev => [
      ...prev,
      { from: "system", text: `Applied: ${describeCommand(cmd)}` }
    ]);

    setPendingCommand(null);

    // auto-scroll preview after apply
    setTimeout(() => {
      const iframe = document.querySelector("iframe");
      if (iframe?.contentWindow) {
        iframe.contentWindow.scrollTo(0, 99999);
      }
    }, 100);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Sandbox v1.2</h1>
        <div className="app-header-actions">
          <button onClick={() => addProject("simple")}>+ Simple Site</button>
          <button onClick={() => addProject("fx")}>+ FX Site</button>
        </div>
      </header>

      <main className="layout">
        <section className="panel panel-list">
          <h2>Projects</h2>
          <ul className="project-list">
            {projects.map(p => (
              <li
                key={p.id}
                className={p.id === activeId ? "active" : ""}
                onClick={() => {
                  setActiveId(p.id);
                  setPendingCommand(null);
                }}
              >
                <strong>{p.name}</strong>
                <span className="tag">{p.type}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel panel-chat">
          <h2>Chat / Commands</h2>

          <div className="chat-log">
            {chatLog.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from}`}>
                <span>{m.text}</span>
              </div>
            ))}
          </div>

          {pendingCommand && (
            <div className="pending-box">
              <div className="pending-title">Pending Action — requires your approval:</div>
              <div className="pending-desc">{describeCommand(pendingCommand)}</div>

              <button
                className="pending-apply-btn"
                onClick={() => applyCommand(pendingCommand)}
              >
                ✅ Approve & Apply
              </button>
            </div>
          )}

          <form className="chat-input-row" onSubmit={handleChatSubmit}>
            <input
              type="text"
              placeholder="Try: 'add about', 'add pricing', 'make fx', 'simplify'"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button type="submit">Propose</button>
          </form>
        </section>

        <section className="panel panel-preview">
          <h2>Preview</h2>
          <div className="preview-frame">
            {activeProject ? (
              <iframe
                title="preview"
                srcDoc={activeProject.html}
                sandbox="allow-same-origin allow-scripts"
              />
            ) : (
              <p>No project selected.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
