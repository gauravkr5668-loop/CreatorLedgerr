import React, { useEffect, useRef, useState } from "react";

/**
 * Smoothly counts from the previous value to the new value using requestAnimationFrame.
 * Drop-in replacement for displaying numeric stat values.
 */
export function AnimatedNumber({ value, duration = 900, format }) {
    const fmt = format || ((v) => Math.round(v).toLocaleString());
    const [display, setDisplay] = useState(0);
    const startTimeRef = useRef(null);
    const startValRef = useRef(0);
    const targetRef = useRef(value);
    const displayRef = useRef(0);

    useEffect(() => {
        if (typeof value !== "number" || Number.isNaN(value)) {
            setDisplay(0);
            return;
        }
        targetRef.current = value;
        startValRef.current = displayRef.current;
        startTimeRef.current = null;

        let raf;
        const step = (ts) => {
            if (!startTimeRef.current) startTimeRef.current = ts;
            const t = Math.min(1, (ts - startTimeRef.current) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const v = startValRef.current + (targetRef.current - startValRef.current) * eased;
            displayRef.current = v;
            setDisplay(v);
            if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => raf && cancelAnimationFrame(raf);
    }, [value, duration]);

    return <span className="tabular-nums">{fmt(display)}</span>;
}

export default AnimatedNumber;
