import { useEffect, useRef } from "react";

const Hero3D = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let teardown = null;

    (async () => {
      const THREE = await import("three");
      const mount = mountRef.current;
      if (disposed || !mount) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // fallback emoji

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch (e) {
        return; // WebGL nahi, fallback dikhta rahega
      }

      const small = window.innerWidth < 768;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
      renderer.setClearColor(0x000000, 0);
      const canvas = renderer.domElement;
      canvas.style.cssText = "display:block;width:100%;height:100%";
      mount.appendChild(canvas);
      mount.classList.add("is-ready");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 14);

      scene.add(new THREE.AmbientLight(0xffffff, 0.9));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(5, 8, 10);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xffd60a, 1.0);
      rim.position.set(-6, -4, 5);
      scene.add(rim);

      // ---- DNA helix ----
      const group = new THREE.Group();
      const sphereGeo = new THREE.SphereGeometry(0.28, small ? 16 : 24, small ? 16 : 24);
      const rungGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
      const matA = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.2 });
      const matB = new THREE.MeshStandardMaterial({ color: 0xffd60a, roughness: 0.25, metalness: 0.2 });
      const rungMat = new THREE.MeshStandardMaterial({ color: 0xbcd7ff, roughness: 0.4 });

      const N = small ? 22 : 28;
      const radius = 1.6;
      const rise = small ? 0.4 : 0.32;
      const up = new THREE.Vector3(0, 1, 0);

      for (let i = 0; i < N; i++) {
        const y = (i - N / 2) * rise;
        const a = i * 0.5;
        const p1 = new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius);
        const p2 = new THREE.Vector3(Math.cos(a + Math.PI) * radius, y, Math.sin(a + Math.PI) * radius);

        const s1 = new THREE.Mesh(sphereGeo, matA);
        s1.position.copy(p1);
        const s2 = new THREE.Mesh(sphereGeo, matB);
        s2.position.copy(p2);

        const dir = new THREE.Vector3().subVectors(p2, p1);
        const rung = new THREE.Mesh(rungGeo, rungMat);
        rung.position.copy(p1).add(p2).multiplyScalar(0.5);
        rung.scale.y = dir.length();
        rung.quaternion.setFromUnitVectors(up, dir.clone().normalize());

        group.add(s1, s2, rung);
      }
      group.rotation.z = 0.35;
      scene.add(group);

      // ---- floating dots (depth ke liye) ----
      const count = small ? 60 : 120;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 16;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      }
      const dotsGeo = new THREE.BufferGeometry();
      dotsGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const dotsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.7 });
      const dots = new THREE.Points(dotsGeo, dotsMat);
      scene.add(dots);

      // ---- size, pointer, visibility ----
      const resize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(mount);
      resize();

      const pointer = { x: 0, y: 0 };
      const onPointer = (e) => {
        pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      let visible = true;
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      io.observe(mount);

      // ---- loop ----
      let raf = 0;
      let last = performance.now();
      const tick = (now) => {
        raf = requestAnimationFrame(tick);
        if (!visible || document.hidden) {
          last = now;
          return;
        }
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        group.rotation.y += dt * 0.6;
        group.rotation.x += (pointer.y * 0.25 - group.rotation.x) * 0.05;
        group.position.y = Math.sin(now / 1200) * 0.25;
        dots.rotation.y -= dt * 0.04;
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(tick);

      teardown = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        window.removeEventListener("pointermove", onPointer);
        sphereGeo.dispose();
        rungGeo.dispose();
        dotsGeo.dispose();
        matA.dispose();
        matB.dispose();
        rungMat.dispose();
        dotsMat.dispose();
        renderer.dispose();
        if (canvas.parentNode === mount) mount.removeChild(canvas);
        mount.classList.remove("is-ready");
      };
    })();

    return () => {
      disposed = true;
      if (teardown) teardown();
    };
  }, []);

  return (
    <div ref={mountRef} className="hero3d">
      <div className="hero3d__fallback floating-3d-icon">🏥</div>
    </div>
  );
};

export default Hero3D;