import { useState } from "react";

// ------------------ TEMPLATES ------------------
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

// ---------------- COMMAND PARSER ----------------
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

// ---------------- DESCRIBE COMMAND ----------------
function describeCommand(cmd) {
  if (!cmd) return "";

  if (cmd.type === "ADD_SECTION") return "Add a new designed section.";
  if (cmd.type === "SET_TEMPLATE") {
    if (cmd.template === "fx") return "Switch to FX template.";
    if (cmd.template === "simple") return "Switch to Simple Landing template.";
  }
  if (cmd.type === "AUTOPILOT_PLAN")
    return "Run Autopilot Basic Landing Page Plan.";

  if (cmd.type === "SMART_SUGGEST") {
    if (cmd.level === "light") return "Light Suggest — 3 small improvements.";
    if (cmd.level === "deep") return "Deep Suggest — 7 stronger improvements.";
    if (cmd.level === "ultra") return "Ultra Boost — full co-designer plan.";
  }

  return "Unknown action.";
}

// ---------------- AUTOPILOT EXPANSION ----------------
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

// -------------- SMART SUGGEST ENGINE --------------
function buildSmartSuggestCommand(level, projectHtml) {
  const html = (projectHtml || "").toLowerCase();
  const suggestions = [];

  // UX tweaks (just textual suggestions)
  const uxTweaks = [
    "Improve spacing between sections.",
    "Make headings more consistent.",
    "Add a clear call-to-action button."
  ];

  // Missing sections
  const missing = [];
  if (!html.includes("<h2>about")) missing.push("Consider adding an About section.");
  if (!html.includes("<h2>pricing")) missing.push("Consider adding a Pricing section.");
  if (!html.includes("<h2>faq")) missing.push("Consider adding an FAQ section (common questions).");

  // Content improvements
  const contentTweaks = [
    "Clarify your headline so it says exactly who this is for.",
    "Tighten the copy in the main paragraph to be more direct.",
    "Add one short testimonial or proof point."
  ];

  // Design improvements
  const designTweaks = [
    "Use fewer colours and let one accent colour lead.",
    "Increase section padding for more breathing room.",
    "Strengthen visual hierarchy by emphasising key text."
  ];

  if (level === "light") {
    // Light: pick 3 small suggestions across the set
    suggestions.push(uxTweaks[0]);
    if (missing[0]) suggestions.push(missing[0]);
    suggestions.push(contentTweaks[0]);
  }

  if (level === "deep") {
    // Deep: combine multiple categories, target 7 suggestions
    suggestions.push(...uxTweaks);
    if (missing[0]) suggestions.push(missing[0]);
    if (missing[1]) suggestions.push(missing[1]);
    suggestions.push(contentTweaks[0]);
    suggestions.push(designTweaks[0]);
  }

  if (level === "ultra") {
    // Ultra: offer the 4 Ultra modes as options (handled in UI, not here)
    suggestions.push(
      "Ultra: Full UX audit (flow, navigation, clarity).",
      "Ultra: Full content improvement plan.",
      "Ultra: Section expansion (About, FAQ, Testimonials, etc.).",
      "Ultra: Design & layout upgrade plan."
    );
  }

  return {
    type: "SMART_SUGGEST",
    level,
    suggestions
  };
}

// ---------------- MAIN COMPONENT ----------------
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
        "Welcome to AI Sandbox v1.9 (Suggest Light / Deep / Ultra + Command Palette + Guided Wizard + Snapshots)."
    }
  ]);

  const [pendingCommand, setPendingCommand] = useState(null);
  const [recentCommands, setRecentCommands] = useState([]);

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardType, setWizardType] = useState("simple");
  const [wizardPlan, setWizardPlan] = useState("basic-landing");

  const [showHelp, setShowHelp] = useState(false);
  const [showTips, setShowTips] = useState(true);

  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  // NEW: Suggest dropdown state
  const [showSuggestMenu, setShowSuggestMenu] = useState(false);

  const activeProject = projects.find(p => p.id === activeId);
  const activeHistory = activeProject?.history || [];

  // ---------------- RECENT COMMANDS ----------------
  function addRecentCommand(display) {
    if (!display) return;

    setRecentCommands(prev => {
      const updated = [display, ...prev.filter(x => x !== display)];
      return updated.slice(0, 5);
    });
  }

  // ---------------- ADD PROJECT ----------------
  function addProject(type) {
    const id = Date.now();
    const name = type === "fx" ? "New FX Site" : "New Blank Site";
    const html = type === "fx" ? TEMPLATES.fx : TEMPLATES.blank;

    setProjects(prev => [...prev, { id, name, type, html, history: [] }]);
    setActiveId(id);

    setChatLog(prev => [
      ...prev,
      { from: "system", text: `Created ${name} using ${type} template.` }
    ]);

    setPendingCommand(null);
  }

  // ---------------- CHAT SUBMIT ----------------
  function handleChatSubmit(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const text = chatInput.trim();

    setChatLog(prev => [...prev, { from: "user", text }]);
    setChatInput("");

    const cmd = buildCommandFromText(text);
    if (!cmd) {
      setChatLog(prev => [
        ...prev,
        {
          from: "system",
          text:
            "Unknown. Try: add about, add pricing, make fx, simplify, autopilot."
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

  // ---------------- APPLY COMMAND ----------------
  function applySingleCommand(cmd, html) {
    let output = html || "";

    if (cmd.type === "ADD_SECTION") output += cmd.html;

    if (cmd.type === "SET_TEMPLATE" && TEMPLATES[cmd.template])
      output = TEMPLATES[cmd.template];

    return output;
  }

  function applyCommand(cmd) {
    if (!cmd) return;

    const project = projects.find(p => p.id === activeId);
    if (!project) return;

    // Handle suggestions (these DO NOT auto-mutate HTML)
    if (cmd.type === "SMART_SUGGEST") {
      setChatLog(prev => [
        ...prev,
        {
          from: "system",
          text: `Suggestions (${cmd.level}):`
        },
        ...cmd.suggestions.map(s => ({ from: "system", text: "• " + s }))
      ]);
      setPendingCommand(null);
      return;
    }

    const cmds =
      cmd.type === "AUTOPILOT_PLAN"
        ? expandAutopilotPlan(cmd.plan)
        : [cmd];

    const snapshot = {
      id: Date.now(),
      label:
        cmd.type === "AUTOPILOT_PLAN"
          ? "Before Autopilot"
          : "Before: " + describeCommand(cmd),
      html: project.html,
      timestamp: new Date().toLocaleTimeString()
    };

    setProjects(prev =>
      prev.map(p => {
        if (p.id !== activeId) return p;

        let newHtml = p.html;
        cmds.forEach(c => {
          newHtml = applySingleCommand(c, newHtml);
        });

        return {
          ...p,
          html: newHtml,
          history: [snapshot, ...p.history].slice(0, 10)
        };
      })
    );

    setChatLog(prev => [
      ...prev,
      {
        from: "system",
        text:
          cmd.type === "AUTOPILOT_PLAN"
            ? "Autopilot executed."
            : "Applied: " + describeCommand(cmd)
      }
    ]);

    setPendingCommand(null);
  }

  // ---------------- RECENT COMMANDS ----------------
  function applyRecent(text) {
    const cmd = buildCommandFromText(text);
    if (!cmd) return;
    addRecentCommand(cmd.display);
    setPendingCommand(cmd);

    setChatLog(prev => [
      ...prev,
      { from: "system", text: "Proposed (Recent): " + describeCommand(cmd) }
    ]);
  }

  // -------------- SNAPSHOTS --------------
  function restoreSnapshot(id) {
    const project = projects.find(p => p.id === activeId);
    if (!project) return;

    const snap = project.history.find(h => h.id === id);
    if (!snap) return;

    setProjects(prev =>
      prev.map(p =>
        p.id === activeId ? { ...p, html: snap.html } : p
      )
    );

    setChatLog(prev => [
      ...prev,
      { from: "system", text: "Snapshot restored." }
    ]);
  }

  function forkSnapshot(id) {
    const project = projects.find(p => p.id === activeId);
    if (!project) return;

    const snap = project.history.find(h => h.id === id);
    if (!snap) return;

    const newId = Date.now();
    const forked = {
      id: newId,
      name: project.name + " (fork)",
      type: project.type,
      html: snap.html,
      history: [snap]
    };

    setProjects(prev => [...prev, forked]);

    setChatLog(prev => [
      ...prev,
      { from: "system", text: "Forked snapshot into new project." }
    ]);
  }

  // ---------------- I'M STUCK ----------------
  function handleStuck() {
    const tips = [
      "Try 'autopilot' to generate a full landing page.",
      "Use Wizard for guided building.",
      "Try 'add about' or 'add pricing'.",
      "Use History to restore earlier versions."
    ];

    setChatLog(prev => [
      ...prev,
      { from: "system", text: "You're stuck? Try this:" },
      ...tips.map(t => ({ from: "system", text: "• " + t }))
    ]);
  }

  // ---------------- WIZARD ----------------
  function startWizard() {
    setShowWizard(true);
    setWizardStep(1);
    setWizardType("simple");
    setWizardPlan("basic-landing");
  }

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
          text: `Wizard: created ${name}. Approve to run Autopilot.`
        }
      ]);

      setShowWizard(false);
    }
  }

  function wizardBack() {
    if (wizardStep === 2) return setWizardStep(1);
    setShowWizard(false);
  }  // ---------------- WIZARD MODAL ----------------
  function WizardModal() {
    if (!showWizard) return null;

    return (
      <div className="wizard-overlay">
        <div className="wizard-modal">
          <div className="wizard-title">Guided Build Wizard</div>
          <div className="wizard-step">Step {wizardStep} of 2</div>

          {wizardStep === 1 && (
            <>
              <p className="wizard-step">What type of site do you want to build?</p>

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
              <p className="wizard-step">How should the page be built?</p>

              <div className="wizard-options">
                <button
                  className={"wizard-btn " + (wizardPlan === "basic-landing" ? "selected" : "")}
                  onClick={() => setWizardPlan("basic-landing")}
                >
                  Autopilot Basic Landing
                </button>
              </div>

              <p style={{ opacity: 0.8, fontSize: "0.75rem" }}>
                The AI will propose a full plan — you approve.
              </p>
            </>
          )}

          <div className="wizard-actions">
            <button onClick={wizardBack}>Back</button>
            <button onClick={wizardNext}>{wizardStep === 2 ? "Finish" : "Next"}</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- HELP MODAL ----------------
  function HelpModal() {
    if (!showHelp) return null;

    return (
      <div className="help-overlay">
        <div className="help-modal">
          <div className="help-title">How This Sandbox Works</div>

          <div className="help-body">
            <p>You can:</p>
            <ul>
              <li>Create new sites (Simple or FX)</li>
              <li>Use commands like “add about”, “add pricing”, “make fx”</li>
              <li>Approve actions safely in Pending</li>
              <li>Use Wizard for guided building</li>
              <li>Use History to restore earlier versions</li>
              <li>Use Suggest for AI improvements (Light, Deep, Ultra)</li>
            </ul>

            <p style={{ opacity: 0.8 }}>Tip: Do not reload — your work stays until replaced.</p>
          </div>

          <div className="help-actions">
            <button onClick={() => setShowHelp(false)}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- SUGGEST MENU DROPDOWN ----------------
  function SuggestMenu() {
    if (!showSuggestMenu) return null;

    return (
      <div className="suggest-overlay" onClick={() => setShowSuggestMenu(false)}>
        <div className="suggest-modal" onClick={(e) => e.stopPropagation()}>
          <h3 className="suggest-title">AI Suggestions</h3>

          <button
            className="suggest-btn"
            onClick={() => {
              const cmd = buildSmartSuggestCommand("light", activeProject?.html);
              setPendingCommand(cmd);
              setShowSuggestMenu(false);
            }}
          >
            ✨ Light Suggest
          </button>

          <button
            className="suggest-btn"
            onClick={() => {
              const cmd = buildSmartSuggestCommand("deep", activeProject?.html);
              setPendingCommand(cmd);
              setShowSuggestMenu(false);
            }}
          >
            🔥 Deep Suggest
          </button>

          <button
            className="suggest-btn"
            onClick={() => {
              const cmd = buildSmartSuggestCommand("ultra", activeProject?.html);
              setPendingCommand(cmd);
              setShowSuggestMenu(false);
            }}
          >
            🚀 Ultra Boost
          </button>

          <button className="suggest-close" onClick={() => setShowSuggestMenu(false)}>
            Close
          </button>

        </div>
      </div>
    );
  }

  // ---------------- COMMAND PALETTE ----------------
  function CommandPalette() {
    if (!showPalette) return null;

    const ACTIONS = [
      { id: "add-about", label: "Add About Section", text: "add about" },
      { id: "add-pricing", label: "Add Pricing Section", text: "add pricing" },
      { id: "make-fx", label: "Switch to FX Template", text: "make fx" },
      { id: "simplify", label: "Switch to Simple Template", text: "simplify" },
      { id: "autopilot", label: "Run Autopilot", text: "autopilot" },
      { id: "wizard", label: "Start Wizard", action: () => startWizard() },
      { id: "help", label: "Open Help", action: () => setShowHelp(true) }
    ];

    const filtered = ACTIONS.filter(a =>
      a.label.toLowerCase().includes(paletteQuery.toLowerCase())
    );

    return (
      <div className="palette-overlay" onClick={() => setShowPalette(false)}>
        <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
          <input
            className="palette-input"
            autoFocus
            placeholder="Search actions…"
            value={paletteQuery}
            onChange={(e) => setPaletteQuery(e.target.value)}
          />

          <div className="palette-actions">
            {filtered.map(a => (
              <button
                key={a.id}
                className="palette-btn"
                onClick={() => {
                  if (a.text) {
                    const cmd = buildCommandFromText(a.text);
                    setPendingCommand(cmd);
                  } else if (a.action) {
                    a.action();
                  }
                  setShowPalette(false);
                }}
              >
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

  // ---------------- MAIN RETURN ----------------
  return (
    <div className="app">

      {/* FLOATING TOOLBAR */}
      <div className="toolbarC">
        <button onClick={() => setShowSuggestMenu(!showSuggestMenu)}>
          Suggest ▼
        </button>

        <button onClick={() => handleToolbarClick("autopilot")}>
          Autopilot
        </button>

        <button onClick={() => startWizard()}>
          Wizard
        </button>

        <button onClick={() => setShowHelp(true)}>
          Help
        </button>

        <button onClick={() => setShowPalette(true)}>
          Palette
        </button>
      </div>

      {/* HEADER */}
      <header className="app-header">
        <h1>AI Sandbox v1.9</h1>
        <div className="app-header-actions">
          <button onClick={startWizard}>Wizard</button>
          <button onClick={() => setShowHelp(true)}>Help</button>
          <button onClick={() => addProject("simple")}>+ Simple Site</button>
          <button onClick={() => addProject("fx")}>+ FX Site</button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
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

          {/* HISTORY */}
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
                    <button className="history-btn" onClick={() => restoreSnapshot(snap.id)}>
                      Restore
                    </button>
                    <button className="history-btn" onClick={() => forkSnapshot(snap.id)}>
                      Fork
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CHAT LOG */}
          <div className="chat-log">
            {chatLog.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from}`}>
                <span>{m.text}</span>
              </div>
            ))}
          </div>

          {/* PENDING */}
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

          {/* INPUT */}
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

          {/* PUBLISH TIP */}
          <div className="publish-tip">
            <small>
              Tip: Don’t publish until your site is fully final.<br />
              Each publish uses 1 of your monthly free publishes.
            </small>
          </div>
        </section>
      </main>

      {/* OVERLAYS */}
      <WizardModal />
      <HelpModal />
      <SuggestMenu />
      <CommandPalette />

      {/* STUCK BUTTON */}
      <button className="stuck-btn" onClick={handleStuck}>
        I’m Stuck
      </button>
    </div>
  );
}
