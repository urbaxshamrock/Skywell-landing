export function mountSkywellJourney(THREE, { reducedMotion = false, compact = false } = {}) {
  const definitions = [
    {
      selector: "#books",
      palette: [0xffc96f, 0xdde7ff, 0x9e86ef],
      intensity: 1,
      direction: 1
    },
    {
      selector: "#craft",
      palette: [0xffbd62, 0x9fe8dd, 0xd469d8, 0x91a8ff],
      intensity: 1.16,
      direction: -1
    },
    {
      selector: "#studio",
      palette: [0x9fe8dd, 0xe8c98a, 0x8a7fe0],
      intensity: .9,
      direction: 1
    }
  ];

  const style = document.createElement("style");
  style.dataset.skywellJourneyStyles = "true";
  style.textContent = `
    #books, #craft, #studio { isolation: isolate; overflow: hidden !important; }
    #books > div:last-of-type,
    #craft > div,
    #studio > .sw-studio-grid { position: relative; z-index: 2; }
    .skywell-journey-canvas {
      position: absolute;
      inset: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
      pointer-events: none;
      opacity: .9;
    }
    @media (prefers-reduced-motion: reduce) {
      .skywell-journey-canvas { opacity: .58; }
    }
  `;
  document.head.append(style);

  function seeded(index, salt) {
    const value = Math.sin((index + 1) * 12.9898 * salt) * 43758.5453;
    return value - Math.floor(value);
  }

  function makeGlowTexture() {
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = 256;
    textureCanvas.height = 256;
    const context = textureCanvas.getContext("2d");
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(255,255,255,.9)");
    gradient.addColorStop(.12, "rgba(255,255,255,.34)");
    gradient.addColorStop(.42, "rgba(255,255,255,.08)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  const cleanups = [];

  definitions.forEach((definition, sceneIndex) => {
    const section = document.querySelector(definition.selector);
    if (!section) return;

    const canvas = document.createElement("canvas");
    canvas.className = "skywell-journey-canvas";
    canvas.dataset.skywellJourney = definition.selector.slice(1);
    canvas.setAttribute("aria-hidden", "true");
    section.append(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !compact,
      powerPreference: "low-power"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? 1 : 1.35));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, 1, .1, 60);
    camera.position.z = 13;
    const loom = new THREE.Group();
    scene.add(loom);
    const glowTexture = makeGlowTexture();
    const animatedMaterials = [];
    const ribbons = [];

    const auroraMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: sceneIndex * 8.3 },
        uSeed: { value: sceneIndex * 1.73 + .4 },
        uOpacity: { value: (compact ? .5 : .42) * definition.intensity },
        uColorA: { value: new THREE.Color(definition.palette[0]) },
        uColorB: { value: new THREE.Color(definition.palette[1]) },
        uColorC: { value: new THREE.Color(definition.palette[2]) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uSeed;
        uniform float uOpacity;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;

        float ribbon(vec2 uv, float offset, float frequency, float width) {
          float center = .5
            + sin(uv.x * frequency + uTime * .065 + offset + uSeed) * .12
            + sin(uv.x * 2.3 - uTime * .038 + offset * 1.7) * .045;
          return exp(-pow(abs(uv.y - center) / width, 1.45));
        }

        void main() {
          vec2 uv = vUv;
          float veilA = ribbon(uv, -.42, 7.1, .078);
          float veilB = ribbon(uv, .18, 5.5, .064);
          float veilC = ribbon(uv, .76, 8.4, .052);
          float sideFade = smoothstep(0.0, .16, uv.x) * (1.0 - smoothstep(.84, 1.0, uv.x));
          float verticalFade = smoothstep(0.02, .18, uv.y) * (1.0 - smoothstep(.78, .98, uv.y));
          float shimmer = .82 + .18 * sin((uv.x + uv.y) * 18.0 + uTime * .11 + uSeed);
          vec3 color = uColorA * veilA + uColorB * veilB * .86 + uColorC * veilC * .72;
          float alpha = clamp((veilA * .46 + veilB * .36 + veilC * .3) * sideFade * verticalFade * shimmer, 0.0, .72);
          gl_FragColor = vec4(color, alpha * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });
    const aurora = new THREE.Mesh(new THREE.PlaneGeometry(25, 15), auroraMaterial);
    aurora.position.z = -4.8;
    aurora.rotation.z = definition.direction * -.045;
    scene.add(aurora);

    const ribbonCount = compact ? 5 : 8;
    for (let index = 0; index < ribbonCount; index += 1) {
      const lane = (index - (ribbonCount - 1) / 2) * .54;
      const direction = definition.direction;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-10 * direction, lane - 2.3, -2.8 - index * .08),
        new THREE.Vector3(-5 * direction, lane + 1.15 + Math.sin(index) * .5, -1.4),
        new THREE.Vector3(0, lane - .55 + Math.cos(index * .8) * .42, -.5),
        new THREE.Vector3(5 * direction, lane + 1.0 + Math.sin(index * .7) * .45, -1.25),
        new THREE.Vector3(10 * direction, lane - 2.15, -2.6)
      ]);
      const coreMaterial = new THREE.MeshBasicMaterial({
        color: definition.palette[index % definition.palette.length],
        transparent: true,
        opacity: (.16 + (index % 3) * .035) * definition.intensity,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending
      });
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: definition.palette[index % definition.palette.length],
        transparent: true,
        opacity: (.038 + (index % 2) * .018) * definition.intensity,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending
      });
      coreMaterial.userData.baseOpacity = coreMaterial.opacity;
      haloMaterial.userData.baseOpacity = haloMaterial.opacity;
      animatedMaterials.push(coreMaterial, haloMaterial);
      const ribbon = new THREE.Group();
      ribbon.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(curve, compact ? 76 : 130, compact ? .016 : .021, 5, false),
          coreMaterial
        ),
        new THREE.Mesh(
          new THREE.TubeGeometry(curve, compact ? 54 : 96, compact ? .07 : .085, 6, false),
          haloMaterial
        )
      );
      ribbon.userData.phase = index * .72 + sceneIndex;
      loom.add(ribbon);
      ribbons.push(ribbon);
    }

    const glows = [];
    const glowPositions = compact
      ? [[0, 2.7], [-1.2, -.2], [1.1, -2.5]]
      : [[-4.5, 1.8], [0, -.15], [4.4, -2.0]];
    glowPositions.forEach(([x, y], index) => {
      const material = new THREE.SpriteMaterial({
        map: glowTexture,
        color: definition.palette[index % definition.palette.length],
        transparent: true,
        opacity: (.17 + index * .025) * definition.intensity,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      material.userData.baseOpacity = material.opacity;
      animatedMaterials.push(material);
      const glow = new THREE.Sprite(material);
      glow.position.set(x, y, -3.4 - index * .25);
      const scale = compact ? 5.1 : 6.7;
      glow.scale.set(scale, scale, 1);
      glow.userData.phase = index * 1.9 + sceneIndex;
      loom.add(glow);
      glows.push(glow);
    });

    const particleCount = compact ? 85 : 160;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      positions[index * 3] = (seeded(index, 2.2 + sceneIndex) - .5) * 21;
      positions[index * 3 + 1] = (seeded(index, 5.8 + sceneIndex) - .5) * 12;
      positions[index * 3 + 2] = -1 - seeded(index, 8.1 + sceneIndex) * 8;
      const color = new THREE.Color(definition.palette[index % definition.palette.length]);
      colors.set([color.r, color.g, color.b], index * 3);
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const particleMaterial = new THREE.PointsMaterial({
      map: glowTexture,
      size: compact ? .14 : .18,
      vertexColors: true,
      transparent: true,
      opacity: .56 * definition.intensity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    loom.add(particles);

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    let visible = false;
    let elapsed = 0;
    let lastTime = performance.now();
    let raf = 0;

    const onPointerMove = (event) => {
      const rect = section.getBoundingClientRect();
      pointerTarget.set(
        ((event.clientX - rect.left) / Math.max(1, rect.width) - .5) * 2,
        ((event.clientY - rect.top) / Math.max(1, rect.height) - .5) * -2
      );
    };
    const onPointerLeave = () => pointerTarget.set(0, 0);
    section.addEventListener("pointermove", onPointerMove, { passive: true });
    section.addEventListener("pointerleave", onPointerLeave, { passive: true });

    const resize = () => {
      const rect = section.getBoundingClientRect();
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
      loom.scale.x = camera.aspect < .72 ? .72 : 1;
      if (reducedMotion) renderer.render(scene, camera);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(section);
    resize();

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) lastTime = performance.now();
    }, { rootMargin: "20% 0px" });
    visibilityObserver.observe(section);

    const draw = (time) => {
      raf = requestAnimationFrame(draw);
      if (!visible || document.hidden) return;
      const delta = Math.min(.05, Math.max(0, (time - lastTime) / 1000));
      lastTime = time;
      elapsed += delta;
      auroraMaterial.uniforms.uTime.value = elapsed + sceneIndex * 8.3;
      pointer.lerp(pointerTarget, .03);
      loom.rotation.y = pointer.x * .035;
      loom.rotation.x = pointer.y * .014;
      loom.position.x = pointer.x * -.1;
      ribbons.forEach((line) => {
        line.position.y = Math.sin(elapsed * .12 + line.userData.phase) * .16;
        line.rotation.z = Math.sin(elapsed * .045 + line.userData.phase) * .012;
      });
      glows.forEach((glow) => {
        const pulse = .9 + Math.sin(elapsed * .28 + glow.userData.phase) * .1;
        glow.scale.setScalar((compact ? 5.1 : 6.7) * pulse);
        glow.material.opacity = glow.material.userData.baseOpacity * (.88 + pulse * .12);
      });
      particles.rotation.y = elapsed * definition.direction * .004;
      particles.position.y = Math.sin(elapsed * .08 + sceneIndex) * .12;
      animatedMaterials.forEach((material) => {
        if (!material.isSpriteMaterial) material.opacity = material.userData.baseOpacity * (.9 + Math.sin(elapsed * .16 + sceneIndex) * .1);
      });
      renderer.render(scene, camera);
    };

    if (reducedMotion) renderer.render(scene, camera);
    else raf = requestAnimationFrame(draw);

    cleanups.push(() => {
      cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose?.();
      });
      glowTexture.dispose();
      renderer.dispose();
      canvas.remove();
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    style.remove();
  };
}
