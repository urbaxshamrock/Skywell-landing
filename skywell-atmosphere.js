import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";
import { mountSkywellJourney } from "./skywell-journey.js";

const hero = document.querySelector("#top");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (hero && !document.querySelector("[data-skywell-three]") && window.WebGLRenderingContext) {
  try {
    const compact = innerWidth < 720 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    const canvas = document.createElement("canvas");
    canvas.dataset.skywellThree = "true";
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      zIndex: "1",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      opacity: ".62"
    });
    hero.append(canvas);

    const interactionStyle = document.createElement("style");
    interactionStyle.dataset.skywellInteractionStyles = "true";
    interactionStyle.textContent = `
      .skywell-depth-card {
        --skywell-rotate-x: 0deg;
        --skywell-rotate-y: 0deg;
        --skywell-lift: 0px;
        --skywell-glow-x: 50%;
        --skywell-glow-y: 50%;
        --skywell-glow-opacity: 0;
        --skywell-card-glow: rgba(232, 201, 138, .2);
        position: relative !important;
        overflow: hidden;
        transform-style: preserve-3d;
        transform: perspective(950px) rotateX(var(--skywell-rotate-x)) rotateY(var(--skywell-rotate-y)) translateY(var(--skywell-lift)) !important;
        transition: transform .22s cubic-bezier(.2,.7,.2,1), border-color .3s ease, box-shadow .3s ease !important;
        will-change: transform;
      }
      .skywell-depth-card::after {
        content: "";
        position: absolute;
        inset: -1px;
        z-index: 0;
        border-radius: inherit;
        background: radial-gradient(circle at var(--skywell-glow-x) var(--skywell-glow-y), var(--skywell-card-glow), transparent 36%);
        opacity: var(--skywell-glow-opacity);
        pointer-events: none;
        transition: opacity .28s ease;
      }
      .skywell-depth-card > * { position: relative; z-index: 1; }
      .skywell-depth-card:hover {
        border-color: rgba(232, 201, 138, .3) !important;
        box-shadow: 0 24px 60px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.025) !important;
      }
      @media (prefers-reduced-motion: reduce), (pointer: coarse) {
        .skywell-depth-card {
          transform: none !important;
          will-change: auto;
        }
      }
    `;
    document.head.append(interactionStyle);

    const cardCleanups = [];
    const bookCards = [...document.querySelectorAll("#books h3")].map((heading) => heading.parentElement).filter(Boolean);
    const craftCards = [...document.querySelectorAll("#craft h3")].map((heading) => heading.parentElement).filter(Boolean);
    const depthCards = [...new Set([...bookCards, ...craftCards])];
    const cardGlows = [
      "rgba(255, 197, 105, .22)",
      "rgba(205, 218, 255, .2)",
      "rgba(159, 232, 221, .2)",
      "rgba(209, 116, 224, .19)"
    ];
    depthCards.forEach((card, index) => {
      card.classList.add("skywell-depth-card");
      card.style.setProperty("--skywell-card-glow", cardGlows[index % cardGlows.length]);
      const onCardMove = (event) => {
        if (reducedMotion || event.pointerType === "touch") return;
        const rect = card.getBoundingClientRect();
        const x = THREE.MathUtils.clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
        const y = THREE.MathUtils.clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
        card.style.setProperty("--skywell-rotate-x", `${(y - .5) * -5}deg`);
        card.style.setProperty("--skywell-rotate-y", `${(x - .5) * 7}deg`);
        card.style.setProperty("--skywell-glow-x", `${x * 100}%`);
        card.style.setProperty("--skywell-glow-y", `${y * 100}%`);
        card.style.setProperty("--skywell-glow-opacity", ".72");
        card.style.setProperty("--skywell-lift", "-5px");
      };
      const onCardLeave = () => {
        card.style.setProperty("--skywell-rotate-x", "0deg");
        card.style.setProperty("--skywell-rotate-y", "0deg");
        card.style.setProperty("--skywell-glow-opacity", "0");
        card.style.setProperty("--skywell-lift", "0px");
      };
      card.addEventListener("pointermove", onCardMove, { passive: true });
      card.addEventListener("pointerleave", onCardLeave, { passive: true });
      cardCleanups.push(() => {
        card.removeEventListener("pointermove", onCardMove);
        card.removeEventListener("pointerleave", onCardLeave);
      });
    });

    let cleanupJourney = () => {};
    try {
      cleanupJourney = mountSkywellJourney(THREE, { reducedMotion, compact });
    } catch (error) {
      console.warn("Skywell journey scenes unavailable.", error);
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !compact,
      powerPreference: "low-power"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? 1.1 : 1.45));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, .1, 80);
    camera.position.z = 14;
    const world = new THREE.Group();
    scene.add(world);
    const backgroundLayer = [...hero.children].find((element) => {
      if (!(element instanceof HTMLElement)) return false;
      return getComputedStyle(element).backgroundImage.startsWith("url(");
    });

    const seeded = (index, salt) => {
      const value = Math.sin((index + 1) * 12.9898 * salt) * 43758.5453;
      return value - Math.floor(value);
    };

    const starVertexShader = `
      attribute float aSize;
      attribute float aPhase;
      attribute vec3 aColor;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vPulse;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vPulse = 0.84 + sin(uTime * 0.62 + aPhase) * 0.16;
        gl_PointSize = aSize * uPixelRatio * vPulse * (54.0 / max(2.0, -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
        vColor = aColor;
      }
    `;

    const starFragmentShader = `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vPulse;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        float halo = smoothstep(0.5, 0.08, d);
        float core = smoothstep(0.13, 0.0, d);
        float alpha = (halo * 0.38 + core) * uOpacity * vPulse;
        if (alpha < 0.018) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `;

    function makeStarLayer(count, depth, size, opacity, salt) {
      const positions = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const phases = new Float32Array(count);
      const colors = new Float32Array(count * 3);
      const cream = new THREE.Color(0xf7ead7);
      const gold = new THREE.Color(0xe8c98a);
      const teal = new THREE.Color(0x9fe8dd);

      for (let index = 0; index < count; index += 1) {
        positions[index * 3] = (seeded(index, 2.8 + salt) - .5) * 31;
        positions[index * 3 + 1] = (seeded(index, 7.5 + salt) - .5) * 19;
        positions[index * 3 + 2] = (seeded(index, 4.3 + salt) - .5) * depth - 3;
        sizes[index] = size * (.55 + seeded(index, 8.4 + salt) * 1.35);
        phases[index] = seeded(index, 6.6 + salt) * Math.PI * 2;
        const colorChoice = seeded(index, 9.9 + salt);
        const color = colorChoice > .95 ? gold : colorChoice > .9 ? teal : cream;
        colors.set([color.r, color.g, color.b], index * 3);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
      geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: renderer.getPixelRatio() },
          uOpacity: { value: opacity }
        },
        vertexShader: starVertexShader,
        fragmentShader: starFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
      });
      const layer = new THREE.Points(geometry, material);
      layer.userData.baseOpacity = opacity;
      world.add(layer);
      return layer;
    }

    const farStars = makeStarLayer(compact ? 210 : 430, 22, .95, .42, .5);
    const nearStars = makeStarLayer(compact ? 48 : 110, 11, 1.55, .54, 3.4);
    nearStars.position.z = 1.7;

    function makeSoftTexture() {
      const textureCanvas = document.createElement("canvas");
      textureCanvas.width = 128;
      textureCanvas.height = 128;
      const context = textureCanvas.getContext("2d");
      const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(255,244,220,.72)");
      gradient.addColorStop(.18, "rgba(255,224,165,.2)");
      gradient.addColorStop(.52, "rgba(159,232,221,.06)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
      const texture = new THREE.CanvasTexture(textureCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }

    const dustCount = compact ? 18 : 36;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let index = 0; index < dustCount; index += 1) {
      dustPositions[index * 3] = (seeded(index, 12.1) - .5) * 27;
      dustPositions[index * 3 + 1] = (seeded(index, 15.7) - .5) * 14;
      dustPositions[index * 3 + 2] = -2 - seeded(index, 18.2) * 8;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      map: makeSoftTexture(),
      color: 0xffe5b3,
      size: compact ? .48 : .58,
      transparent: true,
      opacity: .1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    world.add(dust);

    const lens = new THREE.Group();
    lens.position.set(2.85, 2.72, -1.1);
    world.add(lens);
    const lensMaterials = [];
    const arcDefinitions = [
      [2.15, .92, -.08, Math.PI * 1.28, 0xe8c98a, .12, -.08],
      [3.05, 1.24, Math.PI * .62, Math.PI * 1.9, 0x9fe8dd, .075, .1],
      [4.0, 1.58, Math.PI * 1.04, Math.PI * 1.86, 0xf4e7d6, .045, -.14]
    ];
    arcDefinitions.forEach(([radiusX, radiusY, start, end, color, opacity, rotation], index) => {
      const curve = new THREE.EllipseCurve(0, 0, radiusX, radiusY, start, end, false, rotation);
      const points = curve.getPoints(compact ? 72 : 128).map((point) => new THREE.Vector3(point.x, point.y, index * -.12));
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      material.userData.baseOpacity = opacity;
      lensMaterials.push(material);
      const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
      arc.userData.drift = index % 2 ? -.003 : .002;
      lens.add(arc);
    });

    const horizon = new THREE.Group();
    horizon.position.set(0, -2.15, -6.2);
    world.add(horizon);
    const horizonLines = [];
    [0xe8c98a, 0x9fe8dd, 0x9a83ee].forEach((color, index) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-12, -.7 + index * .22, 0),
        new THREE.Vector3(-6, .28 + index * .12, .15),
        new THREE.Vector3(0, -.42 + index * .18, 0),
        new THREE.Vector3(6, .16 + index * .08, -.1),
        new THREE.Vector3(12, -.62 + index * .2, 0)
      ]);
      const coreMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: .18,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const haloMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: .045,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const stream = new THREE.Group();
      stream.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(curve, compact ? 70 : 120, compact ? .028 : .034, 5, false),
          coreMaterial
        ),
        new THREE.Mesh(
          new THREE.TubeGeometry(curve, compact ? 54 : 90, compact ? .15 : .18, 6, false),
          haloMaterial
        )
      );
      stream.userData.phase = index * 1.7;
      horizon.add(stream);
      horizonLines.push(stream);
    });

    const meteorMaterial = new THREE.LineBasicMaterial({
      color: 0xffe2aa,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const meteor = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-1.35, .42, 0)]),
      meteorMaterial
    );
    meteor.position.z = -1.8;
    world.add(meteor);

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    let scrollY = window.scrollY || 0;
    let heroHeight = hero.getBoundingClientRect().height || innerHeight;
    let heroVisible = true;
    let pageVisible = !document.hidden;
    let elapsed = 0;
    let lastTime = performance.now();
    let raf = 0;

    const onPointerMove = (event) => {
      const rect = hero.getBoundingClientRect();
      pointerTarget.set(
        (event.clientX / Math.max(1, rect.width) - .5) * 2,
        (event.clientY / Math.max(1, rect.height) - .5) * -2
      );
    };
    const onPointerLeave = () => pointerTarget.set(0, 0);
    const onScroll = () => { scrollY = window.scrollY || window.pageYOffset || 0; };
    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) lastTime = performance.now();
    };

    addEventListener("pointermove", onPointerMove, { passive: true });
    addEventListener("pointerleave", onPointerLeave, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      if (heroVisible) lastTime = performance.now();
    });
    visibilityObserver.observe(hero);

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      heroHeight = height;
      const narrow = camera.aspect < .82;
      lens.position.x = narrow ? 1.28 : 2.85;
      lens.position.y = narrow ? 3.0 : 2.72;
      lens.scale.setScalar(narrow ? .8 : 1);
      farStars.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      nearStars.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      if (reducedMotion) renderer.render(scene, camera);
    };
    addEventListener("resize", resize, { passive: true });
    resize();

    function updateMeteor(time) {
      const cycle = 19;
      const local = (time + 4.6) % cycle;
      if (local > 1.05 || reducedMotion) {
        meteorMaterial.opacity = 0;
        return;
      }
      const progress = local / 1.05;
      meteorMaterial.opacity = Math.sin(progress * Math.PI) * .28;
      meteor.position.set(10.5 - progress * 21, 4.8 - progress * 6.5, -1.8);
    }

    function renderFrame(time) {
      raf = requestAnimationFrame(renderFrame);
      if (!heroVisible || !pageVisible) return;
      const delta = Math.min(.05, Math.max(0, (time - lastTime) / 1000));
      lastTime = time;
      elapsed += delta;

      const heroProgress = THREE.MathUtils.clamp(scrollY / Math.max(1, heroHeight), 0, 1);
      const presence = Math.pow(1 - heroProgress, 1.45);
      pointer.lerp(pointerTarget, .028);
      camera.position.x = pointer.x * .1;
      camera.position.y = pointer.y * .065;
      camera.lookAt(0, 0, 0);
      world.rotation.y = pointer.x * .018;
      world.rotation.x = pointer.y * .009;
      if (backgroundLayer) {
        const artworkX = pointer.x * -7;
        const artworkY = scrollY * .28 + pointer.y * -4;
        backgroundLayer.style.transform = `translate3d(${artworkX}px, ${artworkY}px, 0) scale(1.065)`;
      }

      farStars.material.uniforms.uTime.value = elapsed;
      nearStars.material.uniforms.uTime.value = elapsed * 1.08;
      farStars.material.uniforms.uOpacity.value = farStars.userData.baseOpacity * (.72 + presence * .28);
      nearStars.material.uniforms.uOpacity.value = nearStars.userData.baseOpacity * presence;
      farStars.rotation.y = elapsed * -.0018;
      nearStars.rotation.y = elapsed * .0035;
      nearStars.position.x = pointer.x * -.11;
      dust.rotation.z = elapsed * .0015;
      dust.position.x = pointer.x * -.06;
      lens.position.y += ((camera.aspect < .82 ? 3.0 : 2.72) + heroProgress * 1.05 - lens.position.y) * .045;
      lens.children.forEach((arc) => { arc.rotation.z += delta * arc.userData.drift; });
      lensMaterials.forEach((material) => { material.opacity = material.userData.baseOpacity * presence; });
      horizonLines.forEach((line) => {
        line.position.y = Math.sin(elapsed * .08 + line.userData.phase) * .11;
      });
      dustMaterial.opacity = .065 + presence * .035;
      updateMeteor(elapsed);
      canvas.style.opacity = String(.36 + presence * .26);
      renderer.render(scene, camera);
    }

    if (reducedMotion) {
      lensMaterials.forEach((material) => { material.opacity *= .7; });
      dustMaterial.opacity = .06;
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(renderFrame);
    }

    addEventListener("pagehide", () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onPointerMove);
      removeEventListener("pointerleave", onPointerLeave);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      visibilityObserver.disconnect();
      cardCleanups.forEach((cleanup) => cleanup());
      cleanupJourney();
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose?.();
      });
      renderer.dispose();
    }, { once: true });
  } catch (error) {
    console.warn("Skywell atmosphere unavailable.", error);
  }
}
