import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";
import { CATEGORIES, FEATS } from "./catalog.js";

const byId = new Map(FEATS.map((feat) => [feat.id, feat]));
const categoryById = new Map(CATEGORIES.map((category) => [category.id, category]));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  categories: new Set(CATEGORIES.map((category) => category.id)),
  scales: new Set(["system", "major", "module"]),
  search: "",
  selected: byId.get(location.hash.slice(1)) || FEATS[0],
  entries: new Map(),
  hubs: new Map()
};

document.querySelector("#feat-count").textContent = FEATS.length;
document.querySelector("#category-count").textContent = CATEGORIES.length;

const detail = {
  category: document.querySelector("#detail-category"),
  era: document.querySelector("#detail-era"),
  title: document.querySelector("#detail-title"),
  summary: document.querySelector("#detail-summary"),
  status: document.querySelector("#detail-status"),
  scale: document.querySelector("#detail-scale"),
  proof: document.querySelector("#detail-proof"),
  tech: document.querySelector("#detail-tech")
};

const list = document.querySelector("#build-list");
const resultCount = document.querySelector("#result-count");
const tooltip = document.querySelector("#atlas-tooltip");
const stage = document.querySelector("[data-atlas-stage]");
const loading = document.querySelector("#atlas-loading");
const fallback = document.querySelector("#atlas-fallback");
const categoryButtons = new Map();
const cardButtons = new Map();

function titleCase(value) {
  return value.replace(/(^|[-\s])\w/g, (letter) => letter.toUpperCase());
}

function matches(feat) {
  if (!state.categories.has(feat.category) || !state.scales.has(feat.scale)) return false;
  if (!state.search) return true;
  const category = categoryById.get(feat.category);
  const haystack = [feat.title, feat.summary, feat.status, feat.era, category?.label, ...feat.tech]
    .join(" ")
    .toLowerCase();
  return haystack.includes(state.search);
}

function updateDetail(feat, moveFocus = false) {
  state.selected = feat;
  const category = categoryById.get(feat.category);
  detail.category.textContent = category.label;
  detail.category.style.color = category.color;
  detail.era.textContent = feat.era;
  detail.title.textContent = feat.title;
  detail.summary.textContent = feat.summary;
  detail.status.textContent = feat.status;
  detail.scale.textContent = titleCase(feat.scale);
  detail.proof.textContent = feat.proof;
  detail.tech.replaceChildren(...feat.tech.map((value) => {
    const tag = document.createElement("span");
    tag.textContent = value;
    return tag;
  }));
  for (const [id, button] of cardButtons) {
    button.setAttribute("aria-pressed", String(id === feat.id));
  }
  for (const [id, entry] of state.entries) {
    const active = id === feat.id;
    entry.mesh.scale.setScalar(active ? entry.baseScale * 1.65 : entry.baseScale);
    entry.halo.visible = active && entry.mesh.visible;
  }
  const url = new URL(location.href);
  url.hash = feat.id;
  history.replaceState(null, "", url);
  if (moveFocus) detail.title.focus({ preventScroll: true });
}

function renderLegend() {
  const legend = document.querySelector("#atlas-legend");
  for (const category of CATEGORIES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "legend-button";
    button.textContent = category.label;
    button.style.setProperty("--legend-color", category.color);
    button.setAttribute("aria-pressed", "true");
    button.title = category.description;
    button.addEventListener("click", () => {
      if (state.categories.has(category.id)) state.categories.delete(category.id);
      else state.categories.add(category.id);
      button.setAttribute("aria-pressed", String(state.categories.has(category.id)));
      applyFilters();
    });
    categoryButtons.set(category.id, button);
    legend.append(button);
  }
}

function renderList() {
  const fragment = document.createDocumentFragment();
  for (const feat of FEATS) {
    const category = categoryById.get(feat.category);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "build-card";
    button.dataset.featId = feat.id;
    button.style.setProperty("--card-color", category.color);
    button.setAttribute("aria-pressed", String(feat.id === state.selected.id));
    button.innerHTML = "<small>" + category.label + " · " + titleCase(feat.scale) + "</small><strong>" + feat.title + "</strong><span>" + feat.status + "</span>";
    button.addEventListener("click", () => updateDetail(feat, true));
    cardButtons.set(feat.id, button);
    fragment.append(button);
  }
  list.append(fragment);
}

function applyFilters() {
  let count = 0;
  const categoryCounts = new Map(CATEGORIES.map((category) => [category.id, 0]));
  for (const feat of FEATS) {
    const visible = matches(feat);
    if (visible) {
      count += 1;
      categoryCounts.set(feat.category, categoryCounts.get(feat.category) + 1);
    }
    const card = cardButtons.get(feat.id);
    if (card) card.hidden = !visible;
    const entry = state.entries.get(feat.id);
    if (entry) {
      entry.mesh.visible = visible;
      entry.line.visible = visible;
      entry.halo.visible = visible && feat.id === state.selected.id;
    }
  }
  for (const [categoryId, hub] of state.hubs) {
    const visible = categoryCounts.get(categoryId) > 0;
    hub.mesh.visible = visible;
    hub.line.visible = visible;
  }
  resultCount.textContent = count + " of " + FEATS.length + " builds visible";
  if (!matches(state.selected)) {
    const next = FEATS.find(matches);
    if (next) updateDetail(next);
  }
}

function bindControls() {
  const search = document.querySelector("#build-search");
  search.addEventListener("input", () => {
    state.search = search.value.trim().toLowerCase();
    applyFilters();
  });

  document.querySelectorAll('input[name="scale"]').forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) state.scales.add(checkbox.value);
      else state.scales.delete(checkbox.value);
      applyFilters();
    });
  });

  document.querySelector("#show-all").addEventListener("click", () => {
    state.categories = new Set(CATEGORIES.map((category) => category.id));
    state.scales = new Set(["system", "major", "module"]);
    state.search = "";
    search.value = "";
    for (const button of categoryButtons.values()) button.setAttribute("aria-pressed", "true");
    document.querySelectorAll('input[name="scale"]').forEach((checkbox) => { checkbox.checked = true; });
    applyFilters();
  });

  const collapse = document.querySelector("#collapse-list");
  collapse.addEventListener("click", () => {
    const expanded = collapse.getAttribute("aria-expanded") === "true";
    collapse.setAttribute("aria-expanded", String(!expanded));
    collapse.textContent = expanded ? "Expand index" : "Collapse index";
    list.hidden = expanded;
  });

}

function seeded(index, salt = 1) {
  const value = Math.sin((index + 1) * 12.9898 * salt) * 43758.5453;
  return value - Math.floor(value);
}

function initAtlas() {
  const canvas = document.querySelector("#atlas-canvas");
  if (!canvas || !window.WebGLRenderingContext) throw new Error("WebGL is unavailable");

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070612, 0.018);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 160);
  camera.position.set(0, 2, 34);

  const root = new THREE.Group();
  root.rotation.x = -0.1;
  scene.add(root);

  const coreGeometry = new THREE.IcosahedronGeometry(1.1, 2);
  const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xf4e7d6, wireframe: true, transparent: true, opacity: .62 });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  root.add(core);

  const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0x8a7fe0, transparent: true, opacity: .07, depthWrite: false })
  );
  root.add(coreGlow);

  const nodeGeometries = {
    system: new THREE.IcosahedronGeometry(.48, 2),
    major: new THREE.IcosahedronGeometry(.32, 2),
    module: new THREE.IcosahedronGeometry(.2, 1)
  };
  const haloGeometry = new THREE.RingGeometry(.48, .57, 40);
  const clickable = [];

  CATEGORIES.forEach((category, categoryIndex) => {
    const angle = (categoryIndex / CATEGORIES.length) * Math.PI * 2;
    const anchor = new THREE.Vector3(
      Math.cos(angle) * 11.5,
      Math.sin(angle * 2.25) * 4.2,
      Math.sin(angle) * 8
    );
    const color = new THREE.Color(category.color);
    const hub = new THREE.Mesh(
      new THREE.IcosahedronGeometry(.68, 1),
      new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: .78 })
    );
    hub.position.copy(anchor);
    hub.userData.category = category.id;
    root.add(hub);

    const hubLineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), anchor]);
    const hubLine = new THREE.Line(
      hubLineGeometry,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: .16 })
    );
    root.add(hubLine);
    state.hubs.set(category.id, { mesh: hub, line: hubLine });

    const categoryFeats = FEATS.filter((feat) => feat.category === category.id);
    categoryFeats.forEach((feat, localIndex) => {
      const ring = Math.floor(localIndex / 9) + 1;
      const localAngle = localIndex * 2.399963 + categoryIndex * .37;
      const distance = 1.6 + ring * .72 + seeded(localIndex, categoryIndex + 1) * .55;
      const position = anchor.clone().add(new THREE.Vector3(
        Math.cos(localAngle) * distance,
        (seeded(localIndex, 2.17 + categoryIndex) - .5) * (3.1 + ring * .35),
        Math.sin(localAngle) * distance
      ));
      const baseScale = feat.scale === "system" ? 1.15 : feat.scale === "major" ? 1 : .92;
      const mesh = new THREE.Mesh(
        nodeGeometries[feat.scale],
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: feat.scale === "module" ? .74 : .96 })
      );
      mesh.position.copy(position);
      mesh.scale.setScalar(baseScale);
      mesh.userData.featId = feat.id;
      root.add(mesh);
      clickable.push(mesh);

      const halo = new THREE.Mesh(
        haloGeometry,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .58, side: THREE.DoubleSide, depthWrite: false })
      );
      halo.position.copy(position);
      halo.lookAt(camera.position);
      halo.visible = feat.id === state.selected.id;
      root.add(halo);

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([anchor, position]),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: feat.scale === "module" ? .1 : .2 })
      );
      root.add(line);
      state.entries.set(feat.id, { mesh, line, halo, baseScale });
    });
  });

  const stars = 720;
  const starPositions = new Float32Array(stars * 3);
  for (let index = 0; index < stars; index += 1) {
    const radius = 22 + seeded(index, 4.2) * 46;
    const theta = seeded(index, 8.1) * Math.PI * 2;
    const phi = Math.acos(2 * seeded(index, 1.73) - 1);
    starPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[index * 3 + 1] = radius * Math.cos(phi);
    starPositions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const starField = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0xded7f4, size: .075, transparent: true, opacity: .58, depthWrite: false })
  );
  scene.add(starField);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(9, 9);
  let hovered = null;
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let rotationX = root.rotation.x;
  let rotationY = root.rotation.y;

  function pointerToNdc(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pick(event) {
    pointerToNdc(event);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(clickable, false).find((hit) => hit.object.visible);
  }

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;
    rotationX = root.rotation.x;
    rotationY = root.rotation.y;
    canvas.setPointerCapture(event.pointerId);
    stage.classList.add("dragging");
  });

  canvas.addEventListener("pointermove", (event) => {
    if (dragging) {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      moved ||= Math.abs(dx) + Math.abs(dy) > 5;
      root.rotation.y = rotationY + dx * .006;
      root.rotation.x = THREE.MathUtils.clamp(rotationX + dy * .004, -.8, .8);
      tooltip.hidden = true;
      return;
    }
    const hit = pick(event);
    if (hovered && (!hit || hit.object !== hovered)) {
      hovered.scale.setScalar(state.entries.get(hovered.userData.featId).baseScale * (hovered.userData.featId === state.selected.id ? 1.65 : 1));
    }
    hovered = hit?.object || null;
    if (!hovered) {
      tooltip.hidden = true;
      return;
    }
    const feat = byId.get(hovered.userData.featId);
    const entry = state.entries.get(feat.id);
    hovered.scale.setScalar(entry.baseScale * (feat.id === state.selected.id ? 1.85 : 1.35));
    const rect = stage.getBoundingClientRect();
    tooltip.innerHTML = feat.title + "<span>" + categoryById.get(feat.category).label + " · " + titleCase(feat.scale) + "</span>";
    tooltip.style.left = (event.clientX - rect.left + 14) + "px";
    tooltip.style.top = (event.clientY - rect.top + 14) + "px";
    tooltip.hidden = false;
  });

  function endPointer(event) {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("dragging");
    if (!moved) {
      const hit = pick(event);
      if (hit) updateDetail(byId.get(hit.object.userData.featId), true);
    }
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("pointerleave", () => { if (!dragging) tooltip.hidden = true; });
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * .018, 19, 52);
  }, { passive: false });

  document.querySelector("#reset-view").addEventListener("click", () => {
    root.rotation.set(-.1, 0, 0);
    camera.position.z = 34;
  });

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();

  let visible = true;
  const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: "160px" });
  visibilityObserver.observe(stage);

  const timer = new THREE.Timer();
  timer.connect(document);
  const animate = (timestamp) => {
    requestAnimationFrame(animate);
    timer.update(timestamp);
    const delta = Math.min(timer.getDelta(), .05);
    if (visible) {
      if (!reducedMotion && !dragging) root.rotation.y += delta * .035;
      if (!reducedMotion) {
        core.rotation.x += delta * .14;
        core.rotation.y -= delta * .19;
        starField.rotation.y += delta * .004;
      }
      for (const { halo } of state.entries.values()) halo.lookAt(camera.position);
      renderer.render(scene, camera);
    }
  };
  requestAnimationFrame(animate);
  loading.hidden = true;
}

function initHeroAtmosphere() {
  const canvas = document.querySelector("#hero-atmosphere");
  if (!canvas || !window.WebGLRenderingContext) return;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, .1, 100);
  camera.position.z = 15;
  const group = new THREE.Group();
  group.rotation.x = .55;
  scene.add(group);

  const rings = [
    [5.4, 0x9fe8dd, .18],
    [7.4, 0x8a7fe0, .13],
    [9.3, 0xe8c98a, .1]
  ];
  rings.forEach(([radius, color, opacity], index) => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius * (.44 + index * .04), 0, Math.PI * 2);
    const points = curve.getPoints(180).map((point) => new THREE.Vector3(point.x, point.y, index * -.65));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    );
    group.add(line);
  });

  const starCount = 380;
  const positions = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    positions[index * 3] = (seeded(index, 2.4) - .5) * 28;
    positions[index * 3 + 1] = (seeded(index, 7.2) - .5) * 18;
    positions[index * 3 + 2] = (seeded(index, 4.8) - .5) * 16;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xece6f5, size: .055, transparent: true, opacity: .55 })
  );
  scene.add(points);

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);
  const timer = new THREE.Timer();
  timer.connect(document);
  const animate = (timestamp) => {
    requestAnimationFrame(animate);
    timer.update(timestamp);
    if (!visible) return;
    const delta = Math.min(timer.getDelta(), .05);
    if (!reducedMotion) {
      group.rotation.z += delta * .012;
      points.rotation.y -= delta * .008;
    }
    renderer.render(scene, camera);
  };
  requestAnimationFrame(animate);
}

renderLegend();
renderList();
bindControls();
updateDetail(state.selected);
applyFilters();

try {
  initAtlas();
  initHeroAtmosphere();
} catch (error) {
  console.warn("Skywell Build Atlas fell back to the accessible list.", error);
  loading.hidden = true;
  fallback.hidden = false;
}
