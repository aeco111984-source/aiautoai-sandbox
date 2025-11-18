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

// ---------------- COMMAND BUILDER ----------------
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

// ---------------- HOME COMPONENT ----------------
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
        "Welcome to AI Sandbox v1.8 (Command Palette + Guided Wizard + Snapshots)."
    }
  ]);
  const [pendingCommand, setPendingCommand] = useState(null);
  const [recentCommands, setRecentCommands] = useState([]);

  // Guidance layer
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardType, setWizardType] = useState("simple");
  const [wizardPlan, setWizardPlan] = useState("basic-landing");

  const [showHelp, setShowHelp] = useState(false);
  const [showTips, setShowTips] = useState(true);

  // Command Palette state
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  const activeProject = projects.find(p => p.id === activeId);
  const activeHistory = activeProject?.history || [];

  // ------------ Recent Commands ------------
  function addRecentCommand(display) {
    if (!display) return;
    setRecentCommands(prev => {
      const updated = [display, ...prev.filter(x => x !== display)];
      return updated.slice(0, 4);
    });
  }

  // ------------ Add Project ------------
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

  // ------------ Chat Submit ------------
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

  // ------------ Apply Commands ------------
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
          id: Date.now() + Math.random(),
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

  // ------------ Toolbar Actions ------------
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

    if (actionId === "structure") {
      setShowWizard(true);
      setWizardStep(1);
      return;
    }

    setChatLog(prev => [
      ...prev,
      { from: "system", text: `Toolbar clicked: ${actionId}` }
    ]);
  }

  // ------------ Recent Command Tap ------------
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

  // ------------ Snapshots ------------
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

  // ------------ I'm Stuck ------------
  function handleStuck() {
    const suggestions = [
      "Try 'autopilot' to let the AI build a full landing page.",
      "Use the Wizard (Structure button or Wizard button) to go step-by-step.",
      "Add a section with 'add about' or 'add pricing'.",
      "Use snapshots to experiment safely — History → Restore or Fork."
    ];

    setChatLog(prev => [
      ...prev,
      { from: "system", text: "You pressed 'I'm Stuck' — here are next steps:" },
      ...suggestions.map(s => ({ from: "system", text: "• " + s }))
    ]);
  }

  // ------------ Wizard Controls ------------
  function startWizard() {
    setShowWizard(true);
    setWizardStep(1);
    setWizardType("simple");
    setWizardPlan("basic-landing");
  }

  function wizardNext() {  
    // ------------ wizardNext CONTINUED ------------
  function wizardNext() {
    if (wizardStep === 1) {
      setWizardStep(2);
      return;
    }
    if (wizardStep === 2) {
      const id = Date.now();
      const html =
        wizardType === "fx" ? TEMPLATES.fx : TEMPLATES.blank;
      const name =
        wizardType === "fx" ? "Wizard FX Site" : "Wizard Site";

      setProjects(prev => [
        ...prev,
        { id, name, type: wizardType, html, history: [] }
      ]);
      setActiveId(id);

      const cmd = {
        type: "AUTOPILOT_PLAN",
        plan: wizardPlan,
        display: "autopilot"
      };

      setPendingCommand(cmd);

      setChatLog(prev => [
        ...prev,
        {
          from: "system",
          text:
            "Wizard: created " +
            name +
            " and proposed Autopilot plan. Approve to build."
        }
      ]);

      setShowWizard(false);
    }
  }

  function wizardBack() {
    if (wizardStep === 2) {
      setWizardStep(1);
      return;
    }
    setShowWizard(false);
  }

  // ------------ Wizard Modal ------------
  function WizardModal() {
    if (!showWizard) return null;

    return (
      <div className="wizard-overlay">
        <div className="wizard-modal">
          <div className="wizard-title">Guided Build Wizard</div>
          <div className="wizard-step">Step {wizardStep} of 2</div>

          {wizardStep === 1 && (
            <>
              <div style={{ fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                What type of site do you want to build?
              </div>
              <div className="wizard-options">
                <button
                  className={"wizard-btn " + (wizardType === "simple" ? "selected" : "")}
                  onClick={() => setWizardType("simple")}
                >
                  Simple Landing Page
                </button>
                <button
                  className={"wizard-btn " + (wizardType === "fx" ? "selected" : "")}
                  onClick={() => setWizardType("fx")}
                >
                  FX / Finance Site
                </button>
              </div>
            </>
          )}

          {wizardStep === 2 && (
            <>
              <div style={{ fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                How should the page be built?
              </div>
              <div className="wizard-options">
                <button
                  className={"wizard-btn " + (wizardPlan === "basic-landing" ? "selected" : "")}
                  onClick={() => setWizardPlan("basic-landing")}
                >
                  Autopilot Basic Landing
                </button>
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                The AI will propose the plan and you approve it — no code, no risk.
              </div>
            </>
          )}

          <div className="wizard-actions">
            <button onClick={wizardBack}>Back / Close</button>
            <button onClick={wizardNext}>{wizardStep === 2 ? "Finish" : "Next"}</button>
          </div>
        </div>
      </div>
    );
  }

  // ------------ Help Modal ------------
  function HelpModal() {
    if (!showHelp) return null;

    return (
      <div className="help-overlay">
        <div className="help-modal">
          <div className="help-title">How This Sandbox Works</div>
          <div className="help-body">
            <p>This is your AI website-building cockpit. You can:</p>
            <ul>
              <li>Create sites using the top-right buttons.</li>
              <li>
                Type commands like <code>add about</code>, <code>add pricing</code>,{" "}
                <code>make fx</code>, <code>simplify</code>, or <code>autopilot</code>.
              </li>
              <li>Approve actions from the Pending Action box.</li>
              <li>Use the Wizard if you’re unsure what to do next.</li>
              <li>Use History to restore or fork previous versions.</li>
            </ul>
            <p style={{ opacity: 0.8 }}>
              Tip: Don’t reload — your work stays until replaced from GitHub.
            </p>
          </div>
          <div className="help-actions">
            <button onClick={() => setShowHelp(false)}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ------------ Tips Bar ------------
  function TipsBar() {
    if (!showTips) return null;

    return (
      <div className="tips-bar">
        <div className="tips-text">
          Tip: Start with the Wizard or type <code>autopilot</code>. Approve changes in
          the Pending box. Use History to undo safely.
        </div>
        <button className="tips-dismiss" onClick={() => setShowTips(false)}>
          Got it
        </button>
      </div>
    );
  }

  // ------------ COMMAND PALETTE ------------
  function CommandPalette() {
    if (!showPalette) return null;

    const ACTIONS = [
      {
        id: "add-about",
        label: "Add About Section",
        action: () => {
          const cmd = buildCommandFromText("add about");
          setPendingCommand(cmd);
          setShowPalette(false);
        }
      },
      {
        id: "add-pricing",
        label: "Add Pricing Section",
        action: () => {
          const cmd = buildCommandFromText("add pricing");
          setPendingCommand(cmd);
          setShowPalette(false);
        }
      },
      {
        id: "make-fx",
        label: "Switch to FX Template",
        action: () => {
          const cmd = buildCommandFromText("make fx");
          setPendingCommand(cmd);
          setShowPalette(false);
        }
      },
      {
        id: "simplify",
        label: "Switch to Simple Template",
        action: () => {
          const cmd = buildCommandFromText("simplify");
          setPendingCommand(cmd);
          setShowPalette(false);
        }
      },
      {
        id: "autopilot",
        label: "Run Autopilot",
        action: () => {
          const cmd = buildCommandFromText("autopilot");
          setPendingCommand(cmd);
          setShowPalette(false);
        }
      },
      {
        id: "wizard",
        label: "Start Guided Wizard",
        action: () => {
          setShowPalette(false);
          startWizard();
        }
      },
      {
        id: "help",
        label: "Open Help",
        action: () => {
          setShowPalette(false);
          setShowHelp(true);
        }
      },
      {
        id: "snapshots",
        label: "Show Snapshots",
        action: () => {
          setShowPalette(false);
        }
      }
    ];

    const filtered = ACTIONS.filter(a =>
      a.label.toLowerCase().includes(paletteQuery.toLowerCase())
    );

    return (
      <div className="palette-overlay" onClick={() => setShowPalette(false)}>
        <div className="palette-modal" onClick={e => e.stopPropagation()}>
          <input
            className="palette-input"
            autoFocus
            placeholder="Search actions…"
            value={paletteQuery}
            onChange={e => setPaletteQuery(e.target.value)}
          />

          <div className="palette-actions">
            {filtered.map(a => (
              <button key={a.id} className="palette-btn" onClick={a.action}>
                {a.label}
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="palette-empty">No matching actions.</div>
            )}
          </div>
        </div>
      </div>
    );
  }
  // ------------ MAIN RETURN ------------
  return (
    <div className="app">
      {/* Floating Toolbar C */}
      <div className="toolbarC">
        <button onClick={() => handleToolbarClick("suggest")}>Suggest</button>
        <button onClick={() => handleToolbarClick("actions")}>Actions</button>
        <button onClick={() => handleToolbarClick("macros")}>Macros</button>
        <button onClick={() => handleToolbarClick("autopilot")}>Autopilot</button>
        <button onClick={() => handleToolbarClick("structure")}>Wizard</button>
        <button onClick={() => handleToolbarClick("content")}>Content</button>
        <button onClick={() => handleToolbarClick("style")}>Style</button>
        <button onClick={() => setShowPalette(true)}>Palette</button>
      </div>

      <header className="app-header">
        <h1>AI Sandbox v1.8</h1>
        <div className="app-header-actions">
          <button onClick={() => startWizard()}>Wizard</button>
          <button onClick={() => setShowHelp(true)}>Help</button>
          <button onClick={() => addProject("simple")}>+ Simple Site</button>
          <button onClick={() => addProject("fx")}>+ FX Site</button>
        </div>
      </header>

      <main className="layout">
        {/* LEFT PANEL */}
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

        {/* CENTER PANEL */}
        <section className="panel panel-chat">
          <h2>Chat / Commands</h2>

          <TipsBar />

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
              <div className="pending-title">Pending Action — approve to apply:</div>
              <div className="pending-desc">{describeCommand(pendingCommand)}</div>
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

        {/* RIGHT PANEL */}
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

          {/* Publish warning tip */}
          <div className="publish-tip">
            <small style={{
              display: "block",
              marginTop: "6px",
              fontSize: "0.72rem",
              opacity: 0.75,
              color: "#9cb3ff"
            }}>
              Tip: Don’t publish until your site is fully final.<br />
              Each publish uses 1 of your monthly free publishes.
            </small>
          </div>
        </section>
      </main>

      {/* Overlays */}
      <WizardModal />
      <HelpModal />
      <CommandPalette />

      {/* Stuck button */}
      <button className="stuck-btn" onClick={handleStuck}>
        I’m Stuck
      </button>
    </div>
  );
}
