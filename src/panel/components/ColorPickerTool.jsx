import { useState, useEffect, useRef, useCallback } from 'react';
import './ColorPickerTool.css';

// ── Colour conversions ────────────────────────────

const hsvToRgb = (h, s, v) => {
    const f = (n, k = (n + h / 60) % 6) =>
        Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
    return { r: f(5), g: f(3), b: f(1) };
};

const rgbToHsv = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
        switch (max) {
            case r: h = (((g - b) / d) % 6) * 60; break;
            case g: h = ((b - r) / d + 2) * 60;   break;
            case b: h = ((r - g) / d + 4) * 60;   break;
        }
        if (h < 0) h += 360;
    }
    return { h, s: max ? d / max : 0, v: max };
};

const clamp = (v) => Math.max(0, Math.min(255, v));

const toHex = (r, g, b, a = 1) => {
    const base = [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('');
    if (a >= 1) return `#${base}`;
    return `#${base}${Math.round(a * 255).toString(16).padStart(2, '0')}`;
};

const toRgba = (r, g, b, a) =>
    a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${+a.toFixed(2)})`;

const toHsla = (r, g, b, a) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
            case g: h = ((b - r) / d + 2) * 60; break;
            case b: h = ((r - g) / d + 4) * 60; break;
        }
    }
    const hh = Math.round(h), ss = Math.round(s * 100), ll = Math.round(l * 100);
    return a >= 1 ? `hsl(${hh}, ${ss}%, ${ll}%)` : `hsla(${hh}, ${ss}%, ${ll}%, ${+a.toFixed(2)})`;
};

// ── Drag helper ───────────────────────────────────

const useDrag = (onDrag) => {
    const cbRef = useRef(onDrag);
    cbRef.current = onDrag;
    return useCallback((e) => {
        cbRef.current(e);
        const move = (e) => cbRef.current(e);
        const up   = () => window.removeEventListener('mousemove', move);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up, { once: true });
    }, []);
};

// ── Component ─────────────────────────────────────

const ColorPickerTool = ({ image }) => {
    const canvasRef  = useRef(null);
    const imgRef     = useRef(null);
    const svRef      = useRef(null);
    const hueRef     = useRef(null);
    const alphaRef   = useRef(null);

    const [hsv,    setHsv]    = useState(null);
    const [alpha,  setAlpha]  = useState(1);
    const [hover,  setHover]  = useState(null);
    const [copied, setCopied] = useState(null);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            const c = canvasRef.current;
            c.width  = img.naturalWidth;
            c.height = img.naturalHeight;
            c.getContext('2d').drawImage(img, 0, 0);
        };
        img.src = image.url;
    }, [image.url]);

    const samplePixel = useCallback((e) => {
        const canvas = canvasRef.current;
        const imgEl  = imgRef.current;
        if (!canvas?.width || !imgEl) return null;
        const rect = imgEl.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (canvas.width  / rect.width));
        const y = Math.floor((e.clientY - rect.top)  * (canvas.height / rect.height));
        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;
        const [r, g, b] = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
        return { r, g, b };
    }, []);

    const handleMouseMove = useCallback((e) => {
        const px = samplePixel(e);
        if (!px) return;
        setHover({ x: e.clientX, y: e.clientY, hex: toHex(px.r, px.g, px.b) });
    }, [samplePixel]);

    const handleImageClick = useCallback((e) => {
        const px = samplePixel(e);
        if (!px) return;
        setHsv(rgbToHsv(px.r, px.g, px.b));
        setAlpha(1);
    }, [samplePixel]);

    // SV drag
    const handleSvDrag = useCallback((e) => {
        const rect = svRef.current?.getBoundingClientRect();
        if (!rect) return;
        setHsv(prev => prev && ({
            ...prev,
            s: Math.max(0, Math.min(1, (e.clientX - rect.left)  / rect.width)),
            v: Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height)),
        }));
    }, []);

    // Hue drag
    const handleHueDrag = useCallback((e) => {
        const rect = hueRef.current?.getBoundingClientRect();
        if (!rect) return;
        setHsv(prev => prev && ({
            ...prev,
            h: Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360)),
        }));
    }, []);

    // Alpha drag
    const handleAlphaDrag = useCallback((e) => {
        const rect = alphaRef.current?.getBoundingClientRect();
        if (!rect) return;
        setAlpha(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
    }, []);

    const onSvMouseDown    = useDrag(handleSvDrag);
    const onHueMouseDown   = useDrag(handleHueDrag);
    const onAlphaMouseDown = useDrag(handleAlphaDrag);

    const copyText = (val) => {
        navigator.clipboard.writeText(val);
        setCopied(val);
        setTimeout(() => setCopied(null), 1500);
    };

    const rgb      = hsv ? hsvToRgb(hsv.h, hsv.s, hsv.v) : null;
    const hex      = rgb ? toHex(rgb.r, rgb.g, rgb.b, alpha)    : null;
    const rgbaStr  = rgb ? toRgba(rgb.r, rgb.g, rgb.b, alpha)   : null;
    const hslaStr  = rgb ? toHsla(rgb.r, rgb.g, rgb.b, alpha)   : null;
    const opaqueHex = rgb ? toHex(rgb.r, rgb.g, rgb.b) : null;

    return (
        <div className="cp-tool">

            <div className="cp-tool__img-wrap">
                <img
                    ref={imgRef}
                    src={image.url}
                    alt="Pick colour"
                    className="cp-tool__img"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHover(null)}
                    onClick={handleImageClick}
                    draggable={false}
                />
                {!hsv && (
                    <div className="cp-tool__img-hint">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.768-6.768a2 2 0 012.828 2.828L11.828 13.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828L9 11z" />
                        </svg>
                        Click image to pick a colour
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} hidden />

            {hover && (
                <div className="cp-tool__hover-tip" style={{ left: hover.x + 14, top: hover.y - 10 }}>
                    <span className="cp-tool__hover-swatch" style={{ background: hover.hex }} />
                    {hover.hex}
                </div>
            )}

            {hsv && rgb && (
                <div className="cp-tool__picker">

                    <div
                        ref={svRef}
                        className="cp-tool__sv"
                        style={{ '--hue': `hsl(${hsv.h}, 100%, 50%)` }}
                        onMouseDown={onSvMouseDown}
                    >
                        <div className="cp-tool__sv-white" />
                        <div className="cp-tool__sv-black" />
                        <div
                            className="cp-tool__sv-thumb"
                            style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
                        />
                    </div>

                    <div ref={hueRef} className="cp-tool__hue" onMouseDown={onHueMouseDown}>
                        <div className="cp-tool__hue-thumb" style={{ left: `${(hsv.h / 360) * 100}%` }} />
                    </div>

                    <div
                        ref={alphaRef}
                        className="cp-tool__alpha"
                        style={{ '--opaque': opaqueHex }}
                        onMouseDown={onAlphaMouseDown}
                    >
                        <div className="cp-tool__alpha-thumb" style={{ left: `${alpha * 100}%` }} />
                    </div>

                    <div className="cp-tool__output">
                        <div className="cp-tool__preview-wrap">
                            <div className="cp-tool__preview-checker" />
                            <div className="cp-tool__preview" style={{ background: hex }} />
                        </div>
                        <div className="cp-tool__values">
                            {[hex, rgbaStr, hslaStr].map(val => (
                                <button
                                    key={val}
                                    className={`cp-tool__val ${copied === val ? 'cp-tool__val--copied' : ''}`}
                                    onClick={() => copyText(val)}
                                    title="Click to copy"
                                >
                                    {copied === val ? '✓ Copied' : val}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default ColorPickerTool;
