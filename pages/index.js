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

function buildCommandFromText(text) {
  const t = text.toLowerCase();

  if (t.includes("add about")) {
    return {
      type: "ADD_SECTION",
      display: "add about",
      html: `
      <section class="sandbox-section">
        <h2>About</h2>
        <p>Write about your project here.</p>
      </section>
    `
    };
  }

  if (t.includes("add pricing")) {
    return {
      type: "ADD_SECTION",
      display: "add pricing",
      html: `
      <section class="sandbox-section">
        <h2>Pricing</h2>
        <p>Basic · Pro · Enterprise.</p>
      </section>
    `
    };
  }

  if (t.includes("make fx")) {
    return { type: "SET_TEMPLATE", template: "fx", display: "make fx" };
  }

  if (t.includes("simplify")) {
    return { type: "SET_TEMPLATE", template: "simple", display: "simplify" };
  }

  if (t.includes("autopilot")) {
    return {
      type: "AUTOPILOT_PLAN",
      plan: "basic-landing",
      display: "autopilot"
    };
  }

  return null;
}

function describeCommand(cmd) {
  if (!cmd) return "";
  if (cmd.type === "ADD_SECTION") return "Add a new designed section.";
  if (cmd.type === "SET_TEMPLATE") {
    if (cmd.template === "fx") return "Switch to FX template.";
    if (cmd.template === "simple") return "Switch to Simple Landing template.";
  }
  if (cmd.type === "AUTOPILOT_PLAN") return "Run Autopilot Basic Landing Page Plan.";
  return "Unknown action.";
}

function expandAutopilotPlan(plan) {
  if (plan === "basic-landing") {
    return [
      { type: "SET_TEMPLATE", template: "simple" },
      {
        type: "ADD_SECTION",
        html: `
        <section class="sandbox-section">
          <h2>About</h2>
          <p>Write about your project here.</p>
        </section>
      `
      },
      {
        type: "ADD_SECTION",
        html: `
        <section class="sandbox-section">
          <h2>Pricing</h2>
          <p>Basic · Pro · Enterprise.</p>
        </section>
      `
      }
    ];
  }
  return [];
}

export default function Home() {
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "My First Site",
      type: "simple",
      html: TEMPLATES.simple,
      history: []
    }
  ]);

  const [activeId, setActiveId] = useState(1);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState([
    {
      from: "system",
      text:
        "Welcome to AI Sandbox v1.6 (Snapshots + Recent Commands)."
    }
  ]);
  const [pendingCommand, setPendingCommand] = useState(null);
  const [recentCommands, setRecentCommands] = useState([]);

  const activeProject = projects.find(p => p.id === activeId);

  function addRecentCommand(display) {
    if (!display) return;
    setRecentCommands(prev => {
      const updated = [display, ...prev.filter(x => x !== display)];
      return updated.slice(0, 4);
    });
  }

  function addProject(type) {
    const id = Date.now();
    const name = type === "fx" ? "New FX Site" : "New Blank Site";
    const html = type === "fx" ? TEMPLATES.fx : TEMPLATES.blank;

    setProjects(prev => [
      ...prev,
      { id, name, type, html, history: [] }
    ]);
    setActiveId(id);

    setChatLog(prev => [
      ...prev,
      { from: "system", text: `Created ${name} using ${type} template.` }
    ]);
    setPendingCommand(null);
  }

  function handleChatSubmit(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatLog(prev => [...prev, { from: "user", text: userText }]);

    const cmd = buildCommandFromText(userText);
    setChatInput("");

    if (!cmd) {
      setChatLog(prev => [
        ...prev,
        {
          from: "system",
          text:
            "Unknown. Try: 'add about', 'add pricing', 'make fx', 'simplify', or 'autopilot'."
        }
      ]);
      return;
    }

    addRecentCommand(cmd.display);
    setPendingCommand(cmd);

    setChatLog(prev => [
      ...prev,
      { from: "system", text: "Proposed: " + describeCommand(cmd) }
    ]);
  }

  function applySingleCommand(cmd, currentHtml) {
    let html = currentHtml || "";

    if (cmd.type === "ADD_SECTION") html += cmd.html;

    if (cmd.type === "SET_TEMPLATE" && TEMPLATES[cmd.template])
      html = TEMPLATES[cmd.template];

    return html;
  }

  function applyCommand(cmd) {
    if (!cmd || !activeProject) return;

    const isAutopilot = cmd.type === "AUTOPILOT_PLAN";
    const finalCommands = isAutopilot
      ? expandAutopilotPlan(cmd.plan)
      : [cmd];

    const snapshotLabel = isAutopilot
      ? "Before Autopilot"
      : "Before: " + describeCommand(cmd);

    const snapshotTime = new Date().toLocaleTimeString();

    setProjects(prev =>
      prev.map(p => {
        if (p.id !== activeProject.id) return p;

        const snapshot = {
          id: Date.now(),
          label: snapshotLabel,
          html: p.html,
          timestamp: snapshotTime
        };

        let html = p.html || "";
        finalCommands.forEach(c => {
          html = applySingleCommand(c, html);
        });

        const newHistory = [snapshot, ...(p.history || [])].slice(0, 10);

        return { ...p, html, history: newHistory };
      })
    );

    setChatLog(prev => [
      ...prev,
      {
        from: "system",
        text: isAutopilot
          ? "Autopilot executed: Basic Landing Plan."
          : "Applied: " + describeCommand(cmd)
      }
    ]);

    setPendingCommand(null);

    setTimeout(() => {
      const iframe = document.querySelector("iframe");
      if (iframe?.contentWindow)
        iframe.contentWindow.scrollTo(0, 99999);
    }, 120);
  }

  function handleToolbarClick(actionId) {
    if (actionId === "autopilot") {
      const cmd = {
        type: "AUTOPILOT_PLAN",
        plan: "basic-landing",
        display: "autopilot"
      };
      addRecentCommand("autopilot");
      setPendingCommand(cmd);
      setChatLog(prev => [
        ...prev,
        {
          from: "system",
          text: "Autopilot proposed: Basic Landing Plan."
        }
      ]);
      return;
    }

    setChatLog(prev => [
      ...prev,
      { from: "system", text: `Toolbar clicked: ${actionId}` }
    ]);
  }

  function applyRecent(display) {
    const cmd = buildCommandFromText(display);
    if (!cmd) return;

    addRecentCommand(cmd.display);
    setPendingCommand(cmd);

    setChatLog(prev => [
      ...prev,
      { from: "system", text: "Proposed (Recent): " + describeCommand(cmd) }
    ]);
  }

  function restoreSnapshot(snapshotId) {
    if (!activeProject) return;

    setProjects(prev =>
      prev.map(p => {
        if (p.id !== activeProject.id) return p;
        const snap = (p.history || []).find(h => h.id === snapshotId);
        if (!snap) return p;
        return { ...p, html: snap.html };
      })
    );

    setChatLog(prev => [
      ...prev,
      { from: "system", text: "Restored snapshot in current project." }
    ]);
  }

  function forkSnapshot(snapshotId) {
    if (!activeProject) return;

    setProjects(prev => {
      const source = prev.find(p => p.id === activeProject.id);
      const snap = source?.history?.find(h => h.id === snapshotId);
      if (!source || !snap) return prev;

      const id = Date.now();
      const forked = {
        id,
        name: source.name + " (fork)",
        type: source.type,
        html: snap.html,
        history: [snap]
      };

      return [...prev, forked];
    });

    setChatLog(prev => [
      ...prev,
      { from: "system", text: "Forked snapshot into new project." }
    ]);
  }

  const activeHistory = activeProject?.history || [];

  return (
    <div className="app">
      {/* Floating AI Toolbar */}
      <div className="toolbarC">
        <button onClick={() => handleToolbarClick("suggest")}>Suggest</button>
        <button onClick={() => handleToolbarClick("actions")}>Actions</button>
        <button onClick={() => handleToolbarClick("macros")}>Macros</button>
        <button onClick={() => handleToolbarClick("autopilot")}>Autopilot</button>
        <button onClick={() => handleToolbarClick("structure")}>Structure</button>
        <button onClick={() => handleToolbarClick("content")}>Content</button>
        <button onClick={() => handleToolbarClick("style")}>Style</button>
        <button onClick={() => handleToolbarClick("deploy")}>Deploy</button>
      </div>

      <header className="app-header">
        <h1>AI Sandbox v1.6</h1>
        <div className="app-header-actions">
          <button onClick={() => addProject("simple")}>+ Simple Site</button>
          <button onClick={() => addProject("fx")}>+ FX Site</button>
        </div>
      </header>

      <main className="layout">
        {/* LEFT: Projects */}
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

        {/* CENTER: Chat + History */}
        <section className="panel panel-chat">
          <h2>Chat / Commands</h2>

          {recentCommands.length > 0 && (
            <div className="recent-commands">
              <div className="recent-title">Recent Commands:</div>
              <div className="recent-row">
                {recentCommands.map((r, i) => (
                  <button
                    key={i}
                    className="recent-btn"
                    onClick={() => applyRecent(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeHistory.length > 0 && (
            <div className="history-panel">
              <div className="history-title">History (last 5 snapshots):</div>
              {activeHistory.slice(0, 5).map(snap => (
                <div key={snap.id} className="history-item">
                  <div className="history-meta">
                    <div className="history-label">{snap.label}</div>
                    <div className="history-time">{snap.timestamp}</div>
                  </div>
                  <div className="history-actions">
                    <button
                      className="history-btn"
                      onClick={() => restoreSnapshot(snap.id)}
                    >
                      Restore
                    </button>
                    <button
                      className="history-btn"
                      onClick={() => forkSnapshot(snap.id)}
                    >
                      Fork
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="chat-log">
            {chatLog.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from}`}>
                <span>{m.text}</span>
              </div>
            ))}
          </div>

          {pendingCommand && (
            <div className="pending-box">
              <div className="pending-title">
                Pending Action — approve to apply:
              </div>
              <div className="pending-desc">
                {describeCommand(pendingCommand)}
              </div>
              <button
                className="pending-btn"
                onClick={() => applyCommand(pendingCommand)}
              >
                ✅ Approve & Apply
              </button>
            </div>
          )}

          <form className="chat-input-row" onSubmit={handleChatSubmit}>
            <input
              type="text"
              placeholder="Type or tap a Recent Command…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button type="submit">Propose</button>
          </form>
        </section>

        {/* RIGHT: Preview */}
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
