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
      <p>[converter placeholder]</p></section>
    <section><h2>Live Rates</h2><p>[rates placeholder]</p></section>
    <footer><p>About · Privacy</p></footer>
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
      <h2>Call to Action</h2>
      <p>Contact us or sign up below.</p>
    </section>
  `
};

function buildCommandFromText(text) {
  const t = text.toLowerCase();

  if (t.includes("add about")) {
    return {
      type: "ADD_SECTION",
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
      html: `
      <section class="sandbox-section">
        <h2>Pricing</h2>
        <p>Basic · Pro · Enterprise.</p>
      </section>
    `
    };
  }

  if (t.includes("make fx")) {
    return { type: "SET_TEMPLATE", template: "fx" };
  }

  if (t.includes("simplify")) {
    return { type: "SET_TEMPLATE", template: "simple" };
  }

  if (t.includes("autopilot")) {
    return {
      type: "AUTOPILOT_PLAN",
      plan: "basic-landing"
    };
  }

  return null;
}

function describeCommand(cmd) {
  if (!cmd) return "";
  if (cmd.type === "ADD_SECTION") return "Add a clean, styled section to the page.";
  if (cmd.type === "SET_TEMPLATE" && cmd.template === "fx")
    return "Switch to the FX template.";
  if (cmd.type === "SET_TEMPLATE" && cmd.template === "simple")
    return "Switch to the Simple Landing template.";
  if (cmd.type === "AUTOPILOT_PLAN" && cmd.plan === "basic-landing")
    return "Run Autopilot: build a basic landing page (Simple template + About + Pricing).";
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
    { id: 1, name: "My First Site", type: "simple", html: TEMPLATES.simple }
  ]);
  const [activeId, setActiveId] = useState(1);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState([
    {
      from: "system",
      text:
        "Welcome to AI Sandbox v1.4 (Autopilot Base). Type a request, or tap Autopilot, approve the plan, and I will run multiple steps for you."
    }
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
            "Unrecognized. Try: 'add about', 'add pricing', 'make fx', 'simplify', or 'autopilot'."
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

  function applySingleCommand(cmd, currentHtml) {
    let html = currentHtml || "";

    if (cmd.type === "ADD_SECTION") {
      html += cmd.html;
    }

    if (cmd.type === "SET_TEMPLATE" && TEMPLATES[cmd.template]) {
      html = TEMPLATES[cmd.template];
    }

    return html;
  }

  function applyCommand(cmd) {
    if (!cmd || !activeProject) return;

    let html = activeProject.html || "";
    const isAutopilot = cmd.type === "AUTOPILOT_PLAN";
    let allCommands = [];

    if (isAutopilot) {
      allCommands = expandAutopilotPlan(cmd.plan);
    } else {
      allCommands = [cmd];
    }

    allCommands.forEach(c => {
      html = applySingleCommand(c, html);
    });

    setProjects(prev =>
      prev.map(p => (p.id === activeProject.id ? { ...p, html } : p))
    );

    setChatLog(prev => [
      ...prev,
      {
        from: "system",
        text: isAutopilot
          ? `Applied Autopilot Plan: ${describeCommand(cmd)}`
          : `Applied: ${describeCommand(cmd)}`
      }
    ]);

    setPendingCommand(null);

    setTimeout(() => {
      const iframe = document.querySelector("iframe");
      if (iframe?.contentWindow) {
        iframe.contentWindow.scrollTo(0, 99999);
      }
    }, 100);
  }

  function handleToolbarClick(actionId) {
    if (actionId === "autopilot") {
      const cmd = { type: "AUTOPILOT_PLAN", plan: "basic-landing" };
      setPendingCommand(cmd);
      setChatLog(prev => [
        ...prev,
        {
          from: "system",
          text:
            "Proposed action (Autopilot): Run basic landing page plan — set Simple template + add About + Pricing."
        }
      ]);
      return;
    }

    setChatLog(prev => [
      ...prev,
      { from: "system", text: `ToolbarC clicked: ${actionId} (no action wired yet).` }
    ]);
  }

  return (
    <div className="app">
      <div className="toolbarC" aria-label="AI Studio Toolbar C">
        <button
          data-ai-id="toolbarC-suggest"
          onClick={() => handleToolbarClick("suggest")}
        >
          Suggest
        </button>
        <button
          data-ai-id="toolbarC-actions"
          onClick={() => handleToolbarClick("actions")}
        >
          Actions
        </button>
        <button
          data-ai-id="toolbarC-macros"
          onClick={() => handleToolbarClick("macros")}
        >
          Macros
        </button>
        <button
          data-ai-id="toolbarC-autopilot"
          onClick={() => handleToolbarClick("autopilot")}
        >
          Autopilot
        </button>
        <button
          data-ai-id="toolbarC-structure"
          onClick={() => handleToolbarClick("structure")}
        >
          Structure
        </button>
        <button
          data-ai-id="toolbarC-content"
          onClick={() => handleToolbarClick("content")}
        >
          Content
        </button>
        <button
          data-ai-id="toolbarC-style"
          onClick={() => handleToolbarClick("style")}
        >
          Style
        </button>
        <button
          data-ai-id="toolbarC-deploy"
          onClick={() => handleToolbarClick("deploy")}
        >
          Deploy
        </button>
      </div>

      <header className="app-header">
        <h1>AI Sandbox v1.4 (Autopilot Base)</h1>
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
              <div className="pending-title">
                Pending Action — requires your approval:
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
              placeholder="Try: 'add about', 'add pricing', 'make fx', 'simplify', or 'autopilot'"
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
