import { useRef } from "react";

const canTilt = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Tilt = ({ children, max = 10 }) => {
  const ref = useRef(null);

  const onMove = (e) => {
    if (!canTilt() || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div className="tilt-wrap">
      <div ref={ref} className="tilt" onMouseMove={onMove} onMouseLeave={reset}>
        {children}
      </div>
    </div>
  );
};

export default Tilt;