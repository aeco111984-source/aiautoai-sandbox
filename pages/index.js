import { useState } from "react";

const TEMPLATES = {
  blank: "<h1>New Project</h1><p>Start building...</p>",
  fx: `
    <header><h1>FX Site</h1></header>
    <section><h2>Live Converter</h2><p>[converter placeholder]</p></section>
    <section><h2>Live Rates</h2><p>[rates placeholder]</p></section>
    <footer><p>About · Privacy</p></footer>
  `,
  simple: `
    <header><h1>Simple Landing</h1></header>
    <section><h2>Headline</h2><p>Explain your value here.</p></section>
    <footer><p>Contact · Terms</p></footer>
  `
};

// Very simple "command router" that turns text into a structured command
function buildCommandFromText(text) {
  const t = text.toLowerCase();

  if (t.includes("add about")) {
    return { type: "ADD_SECTION", section: "about" };
  }
  if (t.includes("add pricing")) {
    return { type: "ADD_SECTION", section: "pricing" };
  }
  if (t.includes("make fx")) {
    return { type: "SET_TEMPLATE", template: "fx" };
  }
  if (t.includes("simplify")) {
    return { type: "SET_TEMPLATE", template: "simple" };
  }

  // no recognised command
  return null;
}

function describeCommand(cmd) {
  if (!cmd) return "";
  if (cmd.type === "ADD_SECTION" && cmd.section === "about") {
    return "Add an About section to the current page.";
  }
  if (cmd.type === "ADD_SECTION" && cmd.section === "pricing") {
    return "Add a Pricing section to the current page.";
  }
  if (cmd.type === "SET_TEMPLATE" && cmd.template === "fx") {
    return "Switch the current project to the FX template.";
  }
  if (cmd.type === "SET_TEMPLATE" && cmd.template === "simple") {
    return "Simplify the layout to the Simple Landing template.";
  }
  return "Unknown action.";
}

export default function Home() {
  const [projects, setProjects] = useState([
    { id: 1, name: "My First Site", type: "simple", html: TEMPLATES.simple }
  ]);
  const [activeId, setActiveId] = useState(1);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState([
    { from: "system", text: "Welcome to Sandbox v1.1. Type a request, then approve the suggested action." }
  ]);
  const [pendingCommand, setPendingCommand] = useState(null);

  const activeProject = projects.find(p => p.id === activeId);

  function addProject(type) {
    const id = Date.now();
    const name = type === "fx" ? "New FX Site" : "New Blank Site";
    const html = type === "fx" ? TEMPLATES.fx : TEMPLATES.blank;
    setProjects(prev => [...prev, { id, name, type, html }]);
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
    setChatInput("");

    const cmd = buildCommandFromText(userText);
    if (!cmd) {
      setChatLog(prev => [
        ...prev,
        {
          from: "system",
          text:
            "No specific action recognised. Try: 'add about', 'add pricing', 'make fx', or 'simplify'."
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
      if (cmd.section === "about") {
        html += `<section><h2>About</h2><p>Write about your project here.</p></section>`;
      }
      if (cmd.section === "pricing") {
        html += `<section><h2>Pricing</h2><p>Basic · Pro · Enterprise.</p></section>`;
      }
    }

    if (cmd.type === "SET_TEMPLATE") {
      if (cmd.template === "fx") {
        html = TEMPLATES.fx;
      }
      if (cmd.template === "simple") {
        html = TEMPLATES.simple;
      }
    }

    setProjects(prev =>
      prev.map(p => (p.id === activeProject.id ? { ...p, html } : p))
    );
    setChatLog(prev => [
      ...prev,
      { from: "system", text: `Applied: ${describeCommand(cmd)}` }
    ]);
    setPendingCommand(null);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Sandbox v1.1</h1>
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

        {/* CENTER: Chat / Commands */}
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
              <div className="pending-title">Pending Action (requires your approval):</div>
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
              placeholder="Type: 'add about', 'add pricing', 'make fx', or 'simplify'"
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
