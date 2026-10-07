import { useRef } from "react";

const canTilt = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Sirf touch devices (phone/tablet) ke liye
const canTouchTilt = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Tilt = ({ children, max = 10 }) => {
  const ref = useRef(null);

  const applyTilt = (clientX, clientY) => {
    const r = ref.current.getBoundingClientRect();
    const x = (clientX - r.left) / r.width - 0.5;
    const y = (clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
  };

  const onMove = (e) => {
    if (!canTilt() || !ref.current) return;
    applyTilt(e.clientX, e.clientY);
  };

  const onTouch = (e) => {
    if (!canTouchTilt() || !ref.current) return;
    const t = e.touches[0];
    if (t) applyTilt(t.clientX, t.clientY);
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div className="tilt-wrap">
      <div
        ref={ref}
        className="tilt"
        onMouseMove={onMove}
        onMouseLeave={reset}
        onTouchStart={onTouch}
        onTouchMove={onTouch}
        onTouchEnd={reset}
        onTouchCancel={reset}
      >
        {children}
      </div>
    </div>
  );
};

export default Tilt;