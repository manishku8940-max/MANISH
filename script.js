/* =========================================================
   MANISH SINGH — 3D PORTFOLIO
   Vanilla Three.js (r128) — chosen over React Three Fiber so this
   file runs anywhere with zero build step (no Vite/webpack needed).
   Swap this for R3F components later if you move to a bundled React app.
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     0. Boot gate + nav
  --------------------------------------------------------- */
  window.addEventListener("load", () => {
    const boot = document.getElementById("boot");
    setTimeout(() => boot && boot.classList.add("hidden"), 550);
  });

  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle) {
    navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
    navLinks.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => navLinks.classList.remove("open"))
    );
  }

  const HAS_THREE = typeof THREE !== "undefined";
  if (!HAS_THREE) {
    console.warn("Three.js failed to load (offline?). 3D scenes are disabled, rest of the page still works.");
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Shared helpers
  --------------------------------------------------------- */
  function makeRenderer(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    return renderer;
  }

  function fitRendererToParent(renderer, camera, canvas) {
    const parent = canvas.parentElement;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function makeLabelSprite(text, color) {
    const cnv = document.createElement("canvas");
    cnv.width = 256; cnv.height = 96;
    const ctx = cnv.getContext("2d");
    ctx.fillStyle = "rgba(11,13,23,0.0)";
    ctx.fillRect(0, 0, cnv.width, cnv.height);
    ctx.font = "600 40px 'Space Grotesk', sans-serif";
    ctx.fillStyle = color || "#F2F0E9";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cnv.width / 2, cnv.height / 2);
    const tex = new THREE.CanvasTexture(cnv);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.8, 0.68, 1);
    return sprite;
  }

  /* ===========================================================
     1. HERO SCENE — floating geometric cluster, mouse parallax
  =========================================================== */
  (function heroScene() {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = makeRenderer(canvas);

    const key = new THREE.PointLight(0xff8a3d, 2.2, 30);
    key.position.set(4, 3, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0x7c83fd, 2.4, 30);
    rim.position.set(-5, -2, -4);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0x222233, 1.2));

    const group = new THREE.Group();
    scene.add(group);

    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x171c34, metalness: 0.6, roughness: 0.25,
      emissive: 0xff8a3d, emissiveIntensity: 0.12
    });
    const core = new THREE.Mesh(new THREE.TorusKnotGeometry(1.35, 0.4, 160, 20), coreMat);
    group.add(core);

    const satelliteData = [
      { geo: new THREE.IcosahedronGeometry(0.42, 0), color: 0x7c83fd, pos: [3.2, 1.4, -1] },
      { geo: new THREE.OctahedronGeometry(0.36, 0), color: 0xff8a3d, pos: [-3, -1, 1.2] },
      { geo: new THREE.TetrahedronGeometry(0.4, 0), color: 0xf2f0e9, pos: [-2.4, 2, -1.6] },
      { geo: new THREE.IcosahedronGeometry(0.3, 0), color: 0xff8a3d, pos: [2.6, -2, 1.6] },
    ];
    const satellites = satelliteData.map(d => {
      const m = new THREE.Mesh(d.geo, new THREE.MeshStandardMaterial({ color: d.color, metalness: 0.3, roughness: 0.5 }));
      m.position.set(...d.pos);
      group.add(m);
      return m;
    });

    // starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 400;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x8b90ae, size: 0.045, transparent: true, opacity: 0.7 }));
    scene.add(stars);

    let targetX = 0, targetY = 0;
    window.addEventListener("mousemove", (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    window.addEventListener("touchmove", (e) => {
      if (!e.touches[0]) return;
      targetX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    function resize() { fitRendererToParent(renderer, camera, canvas); }
    window.addEventListener("resize", resize);
    resize();

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!reducedMotion) {
        core.rotation.x = t * 0.15;
        core.rotation.y = t * 0.22;
        satellites.forEach((s, i) => {
          s.rotation.x += 0.006 + i * 0.001;
          s.rotation.y += 0.008;
          s.position.y += Math.sin(t * 0.6 + i) * 0.0018;
        });
        stars.rotation.y = t * 0.01;
      }

      group.rotation.y += (targetX * 0.5 - group.rotation.y) * 0.04;
      group.rotation.x += (-targetY * 0.35 - group.rotation.x) * 0.04;
      camera.position.x += (targetX * 0.6 - camera.position.x) * 0.02;
      camera.position.y += (-targetY * 0.4 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();
  })();

  /* ===========================================================
     2. VAULT SCENE — 3D locking door, drag to orbit
  =========================================================== */
  (function vaultScene() {
    const canvas = document.getElementById("vault-canvas");
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.4, 6.2);

    const renderer = makeRenderer(canvas);

    scene.add(new THREE.AmbientLight(0x30354f, 1.4));
    const spot = new THREE.PointLight(0xff8a3d, 3, 20);
    spot.position.set(3, 3, 5);
    scene.add(spot);
    const spot2 = new THREE.PointLight(0x7c83fd, 2, 20);
    spot2.position.set(-4, -2, 3);
    scene.add(spot2);

    // Frame
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 4.2, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x0b0d17, metalness: 0.7, roughness: 0.4 })
    );
    frame.position.z = -0.3;
    scene.add(frame);

    // Door pivots at the left edge (hinge)
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-1.6, 0, 0);
    scene.add(doorPivot);

    const doorMat = new THREE.MeshStandardMaterial({ color: 0x171c34, metalness: 0.75, roughness: 0.28 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4, 0.35), doorMat);
    door.position.set(1.6, 0, 0.1); // offset so pivot sits at its edge
    doorPivot.add(door);

    // Ring bolts around the door edge
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12),
        new THREE.MeshStandardMaterial({ color: 0x8b90ae, metalness: 0.9, roughness: 0.2 })
      );
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(1.6 + Math.cos(ang) * 1.35, Math.sin(ang) * 1.7, 0.3);
      doorPivot.add(bolt);
    }

    // Central lock: ring + rotating handle
    const lockGroup = new THREE.Group();
    lockGroup.position.set(1.6, 0, 0.32);
    doorPivot.add(lockGroup);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.08, 16, 40),
      new THREE.MeshStandardMaterial({ color: 0xff8a3d, metalness: 0.6, roughness: 0.3, emissive: 0xff8a3d, emissiveIntensity: 0.15 })
    );
    lockGroup.add(ring);

    const handle = new THREE.Group();
    lockGroup.add(handle);
    const spokeMat = new THREE.MeshStandardMaterial({ color: 0xf2f0e9, metalness: 0.5, roughness: 0.35 });
    for (let i = 0; i < 4; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.09, 0.09), spokeMat);
      spoke.rotation.z = (i / 4) * Math.PI * 2;
      handle.add(spoke);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.18, 20), spokeMat);
    hub.rotation.x = Math.PI / 2;
    handle.add(hub);

    function resize() { fitRendererToParent(renderer, camera, canvas); }
    window.addEventListener("resize", resize);
    resize();

    // Manual drag-to-orbit (no external controls addon needed)
    let isDragging = false, lastX = 0, lastY = 0;
    let orbitYaw = 0.15, orbitPitch = 0.05;
    const hint = document.getElementById("vaultHint");

    function pointerDown(x, y) { isDragging = true; lastX = x; lastY = y; if (hint) hint.style.opacity = "0.35"; }
    function pointerMove(x, y) {
      if (!isDragging) return;
      orbitYaw += (x - lastX) * 0.005;
      orbitPitch += (y - lastY) * 0.003;
      orbitPitch = Math.max(-0.5, Math.min(0.5, orbitPitch));
      lastX = x; lastY = y;
    }
    function pointerUp() { isDragging = false; if (hint) hint.style.opacity = "1"; }

    canvas.addEventListener("mousedown", e => pointerDown(e.clientX, e.clientY));
    window.addEventListener("mousemove", e => pointerMove(e.clientX, e.clientY));
    window.addEventListener("mouseup", pointerUp);
    canvas.addEventListener("touchstart", e => { const t = e.touches[0]; pointerDown(t.clientX, t.clientY); }, { passive: true });
    canvas.addEventListener("touchmove", e => { const t = e.touches[0]; pointerMove(t.clientX, t.clientY); }, { passive: true });
    canvas.addEventListener("touchend", pointerUp);

    // Typing turns the dial
    const userInput = document.getElementById("vUser");
    const passInput = document.getElementById("vPass");
    let dialTarget = 0;
    function updateDialTarget() {
      const len = (userInput.value.length + passInput.value.length);
      dialTarget = len * 0.35;
    }
    userInput && userInput.addEventListener("input", updateDialTarget);
    passInput && passInput.addEventListener("input", updateDialTarget);

    // Door open/shake state
    let doorOpenTarget = 0; // radians to swing open
    let shakeUntil = 0;

    const form = document.getElementById("vaultForm");
    const status = document.getElementById("vaultStatus");
    const granted = document.getElementById("accessGranted");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const u = userInput.value.trim();
        const p = passInput.value.trim();
        if (!u || !p) {
          status.textContent = "Enter a username and password to unlock the vault.";
          status.className = "vault-status err";
          shakeUntil = performance.now() + 500;
          return;
        }
        status.textContent = "ACCESS GRANTED — door unlocking…";
        status.className = "vault-status ok";
        doorOpenTarget = Math.PI * 0.62;
        setTimeout(() => granted && granted.classList.add("show"), 500);
      });
    }

    let dialCurrent = 0;
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      dialCurrent += (dialTarget - dialCurrent) * 0.15;
      handle.rotation.z = dialCurrent;
      ring.rotation.z = -dialCurrent * 0.4;

      const currentRot = doorPivot.rotation.y;
      doorPivot.rotation.y += (doorOpenTarget - currentRot) * 0.06;

      let shakeOffset = 0;
      if (performance.now() < shakeUntil) {
        shakeOffset = Math.sin(performance.now() * 0.09) * 0.05;
      }

      camera.position.x = Math.sin(orbitYaw) * 6.2 + shakeOffset;
      camera.position.z = Math.cos(orbitYaw) * 6.2;
      camera.position.y = orbitPitch * 6;
      camera.lookAt(0, 0, 0);

      if (!reducedMotion) {
        ring.rotation.x = Math.sin(t * 0.4) * 0.05;
      }

      renderer.render(scene, camera);
    }
    animate();
  })();

  /* ===========================================================
     3. SKILLS SCENE — clickable floating orbs
  =========================================================== */
  (function skillsScene() {
    const canvas = document.getElementById("skills-canvas");
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = makeRenderer(canvas);
    scene.add(new THREE.AmbientLight(0x30354f, 1.5));
    const l1 = new THREE.PointLight(0xff8a3d, 2.4, 30); l1.position.set(4, 4, 6); scene.add(l1);
    const l2 = new THREE.PointLight(0x7c83fd, 2, 30); l2.position.set(-4, -3, 4); scene.add(l2);

    const SKILLS = [
      { name: "React", level: 90, color: 0x61dafb },
      { name: "JavaScript", level: 92, color: 0xf7df1e },
      { name: "Three.js", level: 80, color: 0xffffff },
      { name: "Tailwind CSS", level: 88, color: 0x38bdf8 },
      { name: "GSAP", level: 75, color: 0x88ce02 },
      { name: "REST / GraphQL APIs", level: 85, color: 0xff8a3d },
    ];

    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    const orbs = SKILLS.map((s, i) => {
      const angle = (i / SKILLS.length) * Math.PI * 2;
      const radius = 3.1;
      const pivot = new THREE.Group();
      pivot.rotation.y = angle;
      orbGroup.add(pivot);

      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.62, 1),
        new THREE.MeshStandardMaterial({ color: s.color, metalness: 0.35, roughness: 0.4, flatShading: true })
      );
      mesh.position.set(radius, Math.sin(i * 1.4) * 0.6, 0);
      mesh.userData = s;
      pivot.add(mesh);

      const label = makeLabelSprite(s.name, "#F2F0E9");
      label.position.set(radius, 1.15 + Math.sin(i * 1.4) * 0.6, 0);
      pivot.add(label);

      return { mesh, pivot, data: s };
    });

    function resize() { fitRendererToParent(renderer, camera, canvas); }
    window.addEventListener("resize", resize);
    resize();

    // drag to rotate whole cluster
    let dragging = false, lastX = 0, spin = 0.0025, userYaw = 0;
    canvas.addEventListener("mousedown", e => { dragging = true; lastX = e.clientX; });
    window.addEventListener("mouseup", () => dragging = false);
    window.addEventListener("mousemove", e => {
      if (!dragging) return;
      userYaw += (e.clientX - lastX) * 0.005;
      lastX = e.clientX;
    });
    canvas.addEventListener("touchstart", e => { dragging = true; lastX = e.touches[0].clientX; }, { passive: true });
    canvas.addEventListener("touchend", () => dragging = false);
    canvas.addEventListener("touchmove", e => {
      const x = e.touches[0].clientX;
      userYaw += (x - lastX) * 0.005;
      lastX = x;
    }, { passive: true });

    // raycasting for click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const skillCard = document.getElementById("skillCard");
    const skillName = document.getElementById("skillName");
    const skillBar = document.getElementById("skillBar");
    const skillPct = document.getElementById("skillPct");

    function showSkill(data) {
      skillName.textContent = data.name;
      skillPct.textContent = data.level + "%";
      skillBar.style.width = "0%";
      skillCard.classList.add("show");
      requestAnimationFrame(() => requestAnimationFrame(() => { skillBar.style.width = data.level + "%"; }));
    }

    function handlePick(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(orbs.map(o => o.mesh));
      if (hits.length) showSkill(hits[0].object.userData);
    }
    canvas.addEventListener("click", (e) => {
      // treat as click only if it wasn't a drag of significant distance
      handlePick(e.clientX, e.clientY);
    });

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (!reducedMotion) {
        orbGroup.rotation.y = t * spin + userYaw;
        orbs.forEach((o, i) => {
          o.mesh.rotation.x += 0.01;
          o.mesh.rotation.y += 0.008;
          o.mesh.position.y = Math.sin(i * 1.4) * 0.6 + Math.sin(t * 0.8 + i) * 0.15;
        });
      } else {
        orbGroup.rotation.y = userYaw;
      }
      renderer.render(scene, camera);
    }
    animate();
  })();

  /* ===========================================================
     4. PIPELINE SCENE — packet traveling server -> client
  =========================================================== */
  (function pipelineScene() {
    const canvas = document.getElementById("pipeline-canvas");
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1.4, 7);
    camera.lookAt(0, 0, 0);

    const renderer = makeRenderer(canvas);
    scene.add(new THREE.AmbientLight(0x30354f, 1.6));
    const pl = new THREE.PointLight(0xff8a3d, 2, 20); pl.position.set(0, 4, 5); scene.add(pl);

    const nodeMat = (color) => new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4 });

    const server = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 1.1), nodeMat(0x7c83fd));
    server.position.set(-3.4, 0, 0);
    scene.add(server);
    const serverLabel = makeLabelSprite("SERVER", "#7c83fd");
    serverLabel.position.set(-3.4, 1.4, 0);
    scene.add(serverLabel);

    const client = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 1.1), nodeMat(0xff8a3d));
    client.position.set(3.4, 0, 0);
    scene.add(client);
    const clientLabel = makeLabelSprite("CLIENT", "#ff8a3d");
    clientLabel.position.set(3.4, 1.4, 0);
    scene.add(clientLabel);

    // connecting rail
    const railGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3.4, -0.3, 0), new THREE.Vector3(3.4, -0.3, 0)
    ]);
    const rail = new THREE.Line(railGeo, new THREE.LineBasicMaterial({ color: 0x2a2f4a }));
    scene.add(rail);

    const packet = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0x4ee0a1, emissive: 0x4ee0a1, emissiveIntensity: 0.5 })
    );
    packet.visible = false;
    packet.position.set(-3.4, -0.3, 0);
    scene.add(packet);

    function resize() { fitRendererToParent(renderer, camera, canvas); }
    window.addEventListener("resize", resize);
    resize();

    const log = document.getElementById("pipelineLog");
    const btn = document.getElementById("sendRequestBtn");
    let animState = null; // {phase, start}

    function startTrip() {
      if (animState) return; // already running
      packet.visible = true;
      packet.position.set(-3.4, -0.3, 0);
      animState = { phase: "out", start: performance.now() };
      log.textContent = "→ sending GET /api/projects to server…";
      btn.disabled = true;
    }
    btn && btn.addEventListener("click", startTrip);

    const DURATION = 1000;
    function updatePacket(now) {
      if (!animState) return;
      const elapsed = now - animState.start;
      const p = Math.min(elapsed / DURATION, 1);
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

      if (animState.phase === "out") {
        packet.position.x = -3.4 + ease * 6.8;
        packet.position.y = -0.3 + Math.sin(p * Math.PI) * 0.6;
        if (p >= 1) {
          animState = { phase: "pause", start: now };
          log.textContent = "server processed the request — building response…";
        }
      } else if (animState.phase === "pause") {
        if (elapsed > 450) {
          animState = { phase: "back", start: now };
          log.textContent = "← sending 200 OK back to client…";
        }
      } else if (animState.phase === "back") {
        packet.position.x = 3.4 - ease * 6.8;
        packet.position.y = -0.3 + Math.sin(p * Math.PI) * 0.6;
        if (p >= 1) {
          animState = null;
          packet.visible = false;
          log.textContent = "done — client rendered the response. Idle.";
          btn.disabled = false;
        }
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      updatePacket(now);
      if (!reducedMotion) {
        server.rotation.y += 0.004;
        client.rotation.y -= 0.004;
      }
      renderer.render(scene, camera);
    }
    animate();
  })();

})();
