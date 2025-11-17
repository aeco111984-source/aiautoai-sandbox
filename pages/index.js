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

export default function Home() {
  const [projects, setProjects] = useState([
    { id: 1, name: "My First Site", type: "simple", html: TEMPLATES.simple }
  ]);
  const [activeId, setActiveId] = useState(1);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState([
    { from: "system", text: "Welcome to Sandbox v1.0. Select a project and ask for changes." }
  ]);

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
  }

  function handleChatSubmit(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    setChatLog(prev => [...prev, { from: "user", text: userText }]);
    setChatInput("");

    // Demo AI actions
    if (/add about/i.test(userText)) {
      applyAction("ADD_ABOUT");
    } else if (/add pricing/i.test(userText)) {
      applyAction("ADD_PRICING");
    } else if (/make fx/i.test(userText)) {
      applyAction("SET_FX");
    } else if (/simplify/i.test(userText)) {
      applyAction("SIMPLIFY");
    } else {
      setChatLog(prev => [
        ...prev,
        {
          from: "system",
          text: "Sandbox v1 demo: try 'add about', 'add pricing', 'make fx', or 'simplify layout'."
        }
      ]);
    }
  }

  function applyAction(action) {
    if (!activeProject) return;

    let html = activeProject.html || "";
    if (action === "ADD_ABOUT") {
      html += `<section><h2>About</h2><p>Write about your project here.</p></section>`;
    }
    if (action === "ADD_PRICING") {
      html += `<section><h2>Pricing</h2><p>Basic · Pro · Enterprise.</p></section>`;
    }
    if (action === "SET_FX") {
      html = TEMPLATES.fx;
    }
    if (action === "SIMPLIFY") {
      html = TEMPLATES.simple;
    }

    setProjects(prev =>
      prev.map(p => (p.id === activeProject.id ? { ...p, html } : p))
    );
    setChatLog(prev => [
      ...prev,
      { from: "system", text: `Applied action: ${action}.` }
    ]);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Sandbox v1.0</h1>
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
                onClick={() => setActiveId(p.id)}
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
          <form className="chat-input-row" onSubmit={handleChatSubmit}>
            <input
              type="text"
              placeholder="Ask for changes… e.g. 'add about', 'add pricing', 'make fx', 'simplify'"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button type="submit">Apply</button>
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
