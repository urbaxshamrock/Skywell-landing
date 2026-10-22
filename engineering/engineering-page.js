import { CATEGORIES, FEATS } from "./catalog.js";

const categoryById = new Map(CATEGORIES.map((category) => [category.id, category]));
const featById = new Map(FEATS.map((feat) => [feat.id, feat]));
const FEATURED_IDS = [
  "pulsar-knowledge",
  "ai-operations-hub",
  "watchtower-defense",
  "persistent-work",
  "mcp-orchestration",
  "local-ai-os",
  "research-rover",
  "character-pipeline",
  "engine-parity"
];

const plainOutcomes = {
  orchestration: "AI systems that can route work, use tools, recover, and keep the operator in control.",
  knowledge: "Ways to collect, review, trace, and search information without treating every source as safe.",
  security: "Controls that decide who—or what—may act, what requires approval, and what must stay private.",
  reliability: "The unglamorous systems that preserve work, recover failures, and make retries safe.",
  "creative-ai": "Practical production pipelines for images, voice, music, effects, and story continuity.",
  "three-d": "Character, rigging, motion, retargeting, and mesh-repair tools for usable 3D assets.",
  engines: "Godot and Unreal workflows that carry scenes, assets, audio, effects, and project context forward.",
  "local-os": "A private AI desktop and clean-room studio platform designed around local control.",
  products: "Reusable products and publishing systems that turn engineering work into something others can use.",
  connectors: "Focused bridges and experiments that connect the larger platform to new tools and workflows."
};

const engineeringApproaches = {
  orchestration: "I treat model output as a proposal, not authority. Work moves through explicit schemas, bounded tools, visible state, approval gates where needed, and a recoverable failure path.",
  knowledge: "I separate collection from trusted knowledge. Material is traced to its source, held for review when needed, and promoted into retrieval only when its state and evidence support that use.",
  security: "I place policy at the action boundary: classify the request, verify identity and scope, deny unknown behavior, require stronger approval for higher-risk actions, and leave an auditable result.",
  reliability: "I design around interruption and uncertainty. State is made durable, retries are bounded, completed work is not repeated blindly, and recovery produces evidence instead of relying on memory.",
  "creative-ai": "I separate generation from acceptance. References, rights context, previews, revisions, and final artifacts move through controlled stages so creative speed does not erase authorship or quality review.",
  "three-d": "I use preflight checks and portable asset contracts before downstream work. Skeleton, deformation, scale, motion, and file integrity are validated before an asset is treated as engine-ready.",
  engines: "I keep source assets, engine imports, scene changes, and validation evidence distinct. That makes Godot and Unreal work repeatable without pretending an imported asset is already production-ready.",
  "local-os": "I keep privileges narrow and local by default. Identity, storage, model access, device trust, packaging, and recovery are handled as separate boundaries rather than one all-powerful desktop process.",
  products: "I separate reusable product behavior from private implementation details. Configuration, identity, storage, evidence, and release controls are treated as product boundaries instead of hidden assumptions.",
  connectors: "I wrap outside tools in small adapters with explicit inputs, outputs, limits, and failure states. The connector expands capability without giving the external system unrestricted access to the platform."
};

const categoryExamples = {
  orchestration: [
    (feat) => `Run one bounded request through ${feat.title} and return the selected route, result state, and next operator decision instead of a silent black-box answer.`,
    () => "Handle a read-only task differently from a consequential action, requiring approval only where the risk actually changes.",
    () => "Pause cleanly when a model or tool is unavailable, preserve the job state, and offer a safe retry or fallback."
  ],
  knowledge: [
    (feat) => `Use ${feat.title} to move a document from intake through review while keeping unapproved material out of trusted retrieval.`,
    () => "Answer a question with the supporting source chunk attached, then flag the answer if the underlying file has changed.",
    () => "Hold material when ownership or usage evidence is incomplete instead of treating public availability as permission."
  ],
  security: [
    (feat) => `Use ${feat.title} to evaluate a requested action before execution and produce a visible allow, deny, or approval-required result.`,
    () => "Block an unknown tool or uncertain cloud-bound payload by default, while recording enough context for review.",
    () => "Give a temporary session access to one approved capability without granting blanket administrative control."
  ],
  reliability: [
    (feat) => `Use ${feat.title} to preserve or reconcile work after an interruption without repeating a completed external action.`,
    () => "Detect stale state or an unexpected storage target before writing, then stop with a repairable error.",
    () => "Verify an uncertain delivery or release outcome before retrying so duplicate side effects are avoided."
  ],
  "creative-ai": [
    (feat) => `Use ${feat.title} to create a reviewable draft while keeping references, revisions, and the accepted artifact distinct.`,
    () => "Generate multiple bounded variations, compare them against the creative brief, and promote only the selected result.",
    () => "Carry source and rights context with an image, voice, music, or effects asset through its production handoff."
  ],
  "three-d": [
    (feat) => `Use ${feat.title} to preflight a character or motion asset before it reaches the engine or final animation stage.`,
    () => "Detect a skeleton, scale, deformation, or contact issue and produce a focused repair target instead of silently exporting it.",
    () => "Render a small contact sheet or motion proof so the operator can compare the source asset with the processed result."
  ],
  engines: [
    (feat) => `Use ${feat.title} to stage an asset or scene change with a repeatable import path and an engine-visible validation result.`,
    () => "Move a bounded creative task between Godot and Unreal while keeping the original source and engine-specific state separate.",
    () => "Run an audio, visual, or scene proof and retain the output needed to show what actually executed in the engine."
  ],
  "local-os": [
    (feat) => `Use ${feat.title} to perform one local operation with only the workspace, identity, and capability scope it requires.`,
    () => "Commission a local model or device, verify its health and trust state, and keep it unavailable until the checks pass.",
    () => "Build or install a package with hashes and receipts so the resulting system can be inspected and recovered."
  ],
  products: [
    (feat) => `Use ${feat.title} to turn a private engineering capability into a bounded, reviewable deliverable without exposing its source system.`,
    () => "Prepare a release packet containing approved files, status, hashes, evidence, and known limitations before delivery.",
    () => "Publish a customer-facing or portfolio artifact only after its exact text, media, destination, and approval state are bound together."
  ],
  connectors: [
    (feat) => `Use ${feat.title} to exchange one clearly scoped request and result with an outside tool while preserving a local audit trail.`,
    () => "Reject an unsupported or over-broad connector request before it reaches the underlying application.",
    () => "Exercise a new integration in a sandbox, read-only, or paper-only mode before considering real-world authority."
  ]
};

const specificExampleRules = [
  [/router|model observatory/i, () => "Send routine summarization to a local model, reserve an approved remote model for a harder case, and show when fallback occurred."],
  [/tool protocol|mcp tool/i, () => "Validate a tool request against its schema, remove unsupported fields, execute only the allowed operation, and normalize the result."],
  [/approval|safety dispatch|human autonomy/i, () => "Preview a proposed write or external action, bind approval to that exact payload, and invalidate it if the payload changes."],
  [/rag|knowledge|library|document reader|book intake/i, () => "Ask a question, retrieve only approved chunks, display their sources, and flag the answer if an indexed file is stale."],
  [/rights|licens|provenance|rover|web safety/i, () => "Quarantine a collected item, record its origin and rights evidence, and prevent promotion while required evidence is missing."],
  [/security|privacy|injection|passkey|credential|appcontainer|device trust|api keys/i, () => "Deny an unknown or out-of-scope action, redact sensitive audit fields, and provide a reviewable reason without exposing the protected payload."],
  [/recovery|rollback|reconnect|relaunch|watchdog|storage|outbox|drive/i, () => "Resume from a durable checkpoint, verify what completed before the interruption, and avoid repeating an uncertain side effect."],
  [/image|vfx/i, () => "Create a bounded visual draft, attach its references and settings, and keep it in review until the operator selects the accepted output."],
  [/voice/i, () => "Generate a short audition line, retain consent and source context, compare quality, and stage only the approved take."],
  [/music|midi|audio|sfx/i, () => "Produce a short audio proof, inspect timing and quality, and hand off the approved asset with its generation context."],
  [/rig|motion|retarget|mesh|glb|pose|character/i, () => "Load a character asset, check scale, skeleton, deformation, and contacts, then create a visual proof before engine handoff."],
  [/godot/i, () => "Import a bounded asset into a Godot test scene, run the scene, and capture visible proof rather than counting import success as completion."],
  [/unreal/i, () => "Stage an Unreal change through a focused tool or commandlet, verify the resulting asset or scene, and retain the validation output."],
  [/os|desktop|linux|debian|vault|pairing|installer|studio platform/i, () => "Grant a local worker access to one approved workspace, verify the operation, and revoke or recover the grant cleanly."],
  [/pulsar|release|publisher|website|social|proof-of-work|evidence/i, () => "Prepare a sanitized packet, bind it to hashes and approvals, and keep publication separate from drafting."],
  [/minecraft/i, () => "Send one allowlisted game action through the bridge and confirm the returned state without granting unrestricted world control."],
  [/weather/i, () => "Request current conditions for an approved location, normalize the provider response, and fail visibly if the source is unavailable."],
  [/options|paper-trading/i, () => "Evaluate a strategy against paper-market data and create a simulated order without connecting it to live funds."],
  [/career/i, () => "Match a role against verified accomplishments, create a tailored draft, and keep submission as a separate human-approved action."]
];

const simpleIndex = document.querySelector("#simple-index");
const atlas = document.querySelector("#atlas");
const laneOverview = document.querySelector("#lane-overview");
const featuredBuildIndex = document.querySelector("#featured-build-index");
const completeBuildLibrary = document.querySelector("#complete-build-library");
const showAllBuilds = document.querySelector("#show-all-builds");
const buildIndex = document.querySelector("#simple-build-index");
const simpleSearch = document.querySelector("#simple-search");
const simpleResultCount = document.querySelector("#simple-result-count");
const launchButtons = [...document.querySelectorAll("[data-launch-atlas]")];

document.querySelector("#feat-count").textContent = FEATS.length;
document.querySelector("#category-count").textContent = CATEGORIES.length;

function titleCase(value) {
  return value.replace(/(^|[-\s])\w/g, (letter) => letter.toUpperCase());
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function searchableText(feat) {
  const category = categoryById.get(feat.category);
  return [
    feat.title,
    feat.summary,
    feat.status,
    feat.era,
    feat.scale,
    feat.proof,
    category?.label,
    plainOutcomes[feat.category],
    ...feat.tech
  ].join(" ").toLowerCase();
}

function listWords(values) {
  if (values.length < 2) return values[0] || "bounded components";
  if (values.length === 2) return values.join(" and ");
  return values.slice(0, -1).join(", ") + ", and " + values.at(-1);
}

function publicDetailFor(feat) {
  const matchingRule = specificExampleRules.find(([pattern]) => pattern.test(feat.title + " " + feat.id));
  const specific = matchingRule ? matchingRule[1](feat) : null;
  const pool = categoryExamples[feat.category];
  const offset = [...feat.id].reduce((total, character) => total + character.charCodeAt(0), 0) % pool.length;
  const targetCount = feat.scale === "module" ? 2 : 3;
  const examples = specific ? [specific] : [];
  for (let index = 0; examples.length < targetCount && index < pool.length; index += 1) {
    const candidate = pool[(offset + index) % pool.length](feat);
    if (!examples.includes(candidate)) examples.push(candidate);
  }
  return {
    approach: `I built this ${feat.scale === "system" ? "system" : feat.scale === "major" ? "major capability" : "reusable module"} around ${listWords(feat.tech)}. ${engineeringApproaches[feat.category]}`,
    examples
  };
}

function createFeatCard(feat) {
  const publicDetail = publicDetailFor(feat);
  const article = makeElement("details", "simple-feat");
  article.style.setProperty("--lane-color", categoryById.get(feat.category)?.color || "var(--teal)");
  const heading = makeElement("summary", "simple-feat-heading");
  const headingCopy = makeElement("span", "simple-feat-heading-copy");
  const detailCue = makeElement("span", "simple-feat-cue", "Details +");
  const meta = makeElement("p", "simple-feat-meta", feat.status + " · " + feat.era);
  const summaryText = makeElement("p", "simple-feat-summary", feat.summary);
  headingCopy.append(makeElement("h4", "", feat.title), meta, summaryText);
  heading.append(
    headingCopy,
    makeElement("span", "simple-scale", titleCase(feat.scale)),
    detailCue
  );

  const detailBody = makeElement("div", "simple-feat-detail");
  const purpose = makeElement("section");
  purpose.append(makeElement("h5", "", "What it does"), makeElement("p", "", feat.summary));
  const approach = makeElement("section");
  approach.append(makeElement("h5", "", "How I engineered it"), makeElement("p", "", publicDetail.approach));

  const technical = makeElement("section");
  technical.append(makeElement("h5", "", "Technical focus"));
  const technicalTags = makeElement("div", "simple-tech-tags");
  technicalTags.append(...feat.tech.map((value) => makeElement("span", "", value)));
  technical.append(technicalTags);

  const examples = makeElement("section", "simple-example-section");
  examples.append(makeElement("h5", "", "Small examples"));
  const exampleList = makeElement("ul");
  exampleList.append(...publicDetail.examples.map((value) => {
    const item = makeElement("li");
    item.append(makeElement("span", "", value));
    return item;
  }));
  examples.append(exampleList);

  const evidence = makeElement("section", "simple-evidence");
  evidence.append(
    makeElement("h5", "", "Evidence level"),
    makeElement("p", "", `${feat.status}. Public evidence basis: ${feat.proof}.`)
  );
  const boundary = makeElement("p", "simple-public-boundary", "Public-safe overview: implementation source, private configuration, exact security logic, credentials, and internal paths are intentionally omitted.");
  detailBody.append(purpose, approach, technical, examples, evidence, boundary);
  article.append(heading, detailBody);
  article.addEventListener("toggle", () => { detailCue.textContent = article.open ? "Close ×" : "Details +"; });
  return article;
}

function renderFeaturedBuilds() {
  const fragment = document.createDocumentFragment();
  for (const id of FEATURED_IDS) {
    const feat = featById.get(id);
    if (feat) fragment.append(createFeatCard(feat));
  }
  featuredBuildIndex.replaceChildren(fragment);
}

function revealFullLibrary({ scroll = false } = {}) {
  completeBuildLibrary.hidden = false;
  showAllBuilds.setAttribute("aria-expanded", "true");
  showAllBuilds.textContent = "Hide the complete catalog ↑";
  if (scroll) completeBuildLibrary.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideFullLibrary() {
  completeBuildLibrary.hidden = true;
  showAllBuilds.setAttribute("aria-expanded", "false");
  showAllBuilds.textContent = `See all ${FEATS.length} verified builds ↓`;
}

function renderOverview() {
  const fragment = document.createDocumentFragment();
  for (const category of CATEGORIES) {
    const count = FEATS.filter((feat) => feat.category === category.id).length;
    const link = makeElement("a", "lane-card");
    link.href = "#lane-" + category.id;
    link.style.setProperty("--lane-color", category.color);
    link.append(
      makeElement("span", "lane-count", String(count).padStart(2, "0")),
      makeElement("h3", "", category.label),
      makeElement("p", "", plainOutcomes[category.id]),
      makeElement("span", "lane-link", "See builds ↓")
    );
    link.addEventListener("click", () => {
      revealFullLibrary();
      const details = document.querySelector("#lane-" + category.id);
      if (details) details.open = true;
    });
    fragment.append(link);
  }
  laneOverview.append(fragment);
}

function renderSimpleIndex(query = "") {
  const normalized = query.trim().toLowerCase();
  const visible = normalized ? FEATS.filter((feat) => searchableText(feat).includes(normalized)) : FEATS;
  const visibleIds = new Set(visible.map((feat) => feat.id));
  const fragment = document.createDocumentFragment();

  for (const category of CATEGORIES) {
    const categoryFeats = FEATS.filter((feat) => feat.category === category.id && visibleIds.has(feat.id));
    if (!categoryFeats.length) continue;

    const details = makeElement("details", "simple-lane");
    details.id = "lane-" + category.id;
    details.style.setProperty("--lane-color", category.color);
    details.open = Boolean(normalized);

    const summary = makeElement("summary");
    const summaryCopy = makeElement("span", "simple-lane-copy");
    summaryCopy.append(
      makeElement("strong", "", category.label),
      makeElement("span", "", plainOutcomes[category.id])
    );
    summary.append(
      makeElement("span", "simple-lane-dot"),
      summaryCopy,
      makeElement("span", "simple-lane-count", categoryFeats.length + (categoryFeats.length === 1 ? " build" : " builds"))
    );

    const grid = makeElement("div", "simple-feat-grid");
    for (const feat of categoryFeats) {
      grid.append(createFeatCard(feat));
    }

    details.append(summary, grid);
    fragment.append(details);
  }

  buildIndex.replaceChildren(fragment);
  simpleResultCount.textContent = visible.length + " of " + FEATS.length + " builds shown";

  if (!visible.length) {
    buildIndex.append(makeElement("p", "simple-empty", "No builds matched that search. Try a broader term."));
  }
}

let atlasLoad;

async function launchAtlas() {
  simpleIndex.hidden = true;
  atlas.hidden = false;
  document.body.dataset.engineeringView = "interactive";
  launchButtons.forEach((button) => {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  });

  const url = new URL(location.href);
  url.searchParams.set("view", "interactive");
  if (!featById.has(url.hash.slice(1))) url.hash = "atlas";
  history.replaceState(null, "", url);

  try {
    atlasLoad ||= import("./engineering-map.js");
    await atlasLoad;
    atlas.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.warn("The interactive atlas could not load; returning to the simple index.", error);
    returnToSimple();
  } finally {
    launchButtons.forEach((button) => {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    });
  }
}

function returnToSimple() {
  atlas.hidden = true;
  simpleIndex.hidden = false;
  document.body.dataset.engineeringView = "simple";
  const url = new URL(location.href);
  url.searchParams.delete("view");
  url.hash = "simple-index";
  history.replaceState(null, "", url);
  simpleIndex.scrollIntoView({ behavior: "smooth", block: "start" });
}

launchButtons.forEach((button) => button.addEventListener("click", launchAtlas));
document.querySelector("#return-simple").addEventListener("click", returnToSimple);
document.querySelectorAll('a[href="#simple-index"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (atlas.hidden) return;
    event.preventDefault();
    returnToSimple();
  });
});
simpleSearch.addEventListener("input", () => renderSimpleIndex(simpleSearch.value));
showAllBuilds.addEventListener("click", () => {
  if (completeBuildLibrary.hidden) revealFullLibrary({ scroll: true });
  else hideFullLibrary();
});
document.querySelector("#expand-simple").addEventListener("click", () => {
  document.querySelectorAll(".simple-lane").forEach((details) => { details.open = true; });
});
document.querySelector("#collapse-simple").addEventListener("click", () => {
  document.querySelectorAll(".simple-lane").forEach((details) => { details.open = false; });
});

const header = document.querySelector("[data-site-header]");
const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 24);
addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

renderOverview();
renderFeaturedBuilds();
renderSimpleIndex();

const requestedLane = location.hash.startsWith("#lane-") ? document.querySelector(location.hash) : null;
if (requestedLane) {
  revealFullLibrary();
  requestedLane.open = true;
}

const requestedView = new URL(location.href).searchParams.get("view");
if (requestedView === "interactive" || location.hash === "#atlas" || featById.has(location.hash.slice(1))) {
  launchAtlas();
}
