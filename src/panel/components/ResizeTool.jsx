import { useState, useEffect, useRef } from 'react';
import { decode as avifDecode, encode as avifEncode } from '@jsquash/avif';
import './ResizeTool.css';

const fmt = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
const sizeOf = (url) => url.startsWith('data:') ? Math.round(atob(url.split(',')[1]).length) : null;

const CANVAS_ENCODABLE = new Set(['image/jpeg', 'image/png', 'image/webp']);
const QUALITY = { 'image/jpeg': 0.85, 'image/webp': 0.85 };
const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/avif': 'avif' };
const getOutputFormat = (image) => {
    const type = image.file?.type
        ?? (image.url.startsWith('data:') ? image.url.split(';')[0].slice(5) : null);
    const mime = CANVAS_ENCODABLE.has(type) ? type : 'image/webp';
    return [mime, QUALITY[mime]];
};
const extOf = (url) => MIME_EXT[url.split(';')[0].slice(5)] ?? 'png';

const ResizeTool = ({ image, onResult }) => {
    const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [lockAspect, setLockAspect] = useState(true);
    const [resultUrl, setResultUrl]     = useState(null);
    const [sizeDelta, setSizeDelta]     = useState(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            const w = img.naturalWidth  || 512;
            const h = img.naturalHeight || 512;
            setOriginalSize({ width: w, height: h });
            setWidth(String(w));
            setHeight(String(h));
        };
        img.src = image.url;
    }, [image.url]);

    const handleWidthChange = (e) => {
        const val = e.target.value;
        setWidth(val);
        if (lockAspect && originalSize.width) {
            const ratio = originalSize.height / originalSize.width;
            setHeight(String(Math.round(Number(val) * ratio)));
        }
    };

    const handleHeightChange = (e) => {
        const val = e.target.value;
        setHeight(val);
        if (lockAspect && originalSize.height) {
            const ratio = originalSize.width / originalSize.height;
            setWidth(String(Math.round(Number(val) * ratio)));
        }
    };

    const handleResize = () => {
        const targetW = Number(width);
        const targetH = Number(height);
        if (!targetW || !targetH) return;

        const isSvg  = image.file?.type === 'image/svg+xml'
            || image.url.startsWith('data:image/svg');
        const isAvif = image.file?.type === 'image/avif'
            || image.url.startsWith('data:image/avif');

        if (isAvif) {
            (async () => {
                const buffer = image.file
                    ? await image.file.arrayBuffer()
                    : await fetch(image.url).then(r => r.arrayBuffer());

                const raw = await avifDecode(buffer);

                // Draw decoded pixels onto a source canvas, then scale to target
                const srcCanvas = document.createElement('canvas');
                srcCanvas.width  = raw.width;
                srcCanvas.height = raw.height;
                srcCanvas.getContext('2d').putImageData(
                    new ImageData(raw.data, raw.width, raw.height), 0, 0
                );

                const dstCanvas = document.createElement('canvas');
                dstCanvas.width  = targetW;
                dstCanvas.height = targetH;
                const dstCtx = dstCanvas.getContext('2d');
                dstCtx.imageSmoothingEnabled = true;
                dstCtx.imageSmoothingQuality = 'high';
                dstCtx.drawImage(srcCanvas, 0, 0, targetW, targetH);

                const finalData = dstCtx.getImageData(0, 0, targetW, targetH);
                const avifBuf   = await avifEncode(finalData, { quality: 75 });

                // Convert ArrayBuffer → base64 data URL in chunks to avoid stack overflow
                const bytes = new Uint8Array(avifBuf);
                let binary = '';
                for (let i = 0; i < bytes.length; i += 8192)
                    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
                const url = `data:image/avif;base64,${btoa(binary)}`;
                setResultUrl(url);

                const origSz = image.size ?? sizeOf(image.url);
                if (origSz !== null) {
                    const newSz = sizeOf(url);
                    const diff  = newSz - origSz;
                    setSizeDelta({ orig: origSz, next: newSz, diff, pct: Math.round((diff / origSz) * 100) });
                }
            })();
            return;
        }

        if (isSvg) {
            fetch(image.url)
                .then(r => r.text())
                .then(text => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'image/svg+xml');
                    const svgEl = doc.documentElement;
                    svgEl.setAttribute('width',  String(targetW));
                    svgEl.setAttribute('height', String(targetH));
                    const svgText = new XMLSerializer().serializeToString(doc);
                    setResultUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`);
                    setSizeDelta(null);
                });
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
            const [mime, quality] = getOutputFormat(image);

            // SVG (or any image with no intrinsic dimensions): draw directly at target size
            if (!img.naturalWidth || !img.naturalHeight) {
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width  = targetW;
                finalCanvas.height = targetH;
                finalCanvas.getContext('2d').drawImage(img, 0, 0, targetW, targetH);
                const url = finalCanvas.toDataURL(mime, quality);
                setResultUrl(url);
                return;
            }

            // Step-down scaling: halve dimensions until we're close to the target
            let currentW = img.naturalWidth;
            let currentH = img.naturalHeight;

            canvas.width = currentW;
            canvas.height = currentH;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, currentW, currentH);

            while (currentW / 2 > targetW || currentH / 2 > targetH) {
                const nextW = Math.max(Math.floor(currentW / 2), targetW);
                const nextH = Math.max(Math.floor(currentH / 2), targetH);

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = nextW;
                tempCanvas.height = nextH;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.imageSmoothingEnabled = true;
                tempCtx.imageSmoothingQuality = 'high';
                tempCtx.drawImage(canvas, 0, 0, nextW, nextH);

                canvas.width = nextW;
                canvas.height = nextH;
                ctx.drawImage(tempCanvas, 0, 0);

                currentW = nextW;
                currentH = nextH;
            }

            // Final step to exact target size
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = targetW;
            finalCanvas.height = targetH;
            const finalCtx = finalCanvas.getContext('2d');
            finalCtx.imageSmoothingEnabled = true;
            finalCtx.imageSmoothingQuality = 'high';
            finalCtx.drawImage(canvas, 0, 0, targetW, targetH);

            const url = finalCanvas.toDataURL(mime, quality);
            setResultUrl(url);
            const origSz = image.size ?? sizeOf(image.url);
            if (origSz !== null) {
                const newSz = sizeOf(url);
                const diff = newSz - origSz;
                setSizeDelta({ orig: origSz, next: newSz, diff, pct: Math.round((diff / origSz) * 100) });
            }
        };
        img.src = image.url;
    };


    const PRESETS = [256, 512, 1024, 2048];

    const handlePreset = (p) => {
        setWidth(String(p));
        if (lockAspect && originalSize.width) {
            setHeight(String(Math.round(p * originalSize.height / originalSize.width)));
        }
        setResultUrl(null);
        setSizeDelta(null);
    };

    return (
        <div className="resize-tool">
            <p className="resize-tool__original">
                Original: {originalSize.width} × {originalSize.height}px
            </p>

            <div className="resize-tool__presets">
                {PRESETS.map(p => (
                    <button
                        key={p}
                        className={`resize-tool__preset-btn ${Number(width) === p ? 'resize-tool__preset-btn--active' : ''}`}
                        onClick={() => handlePreset(p)}
                    >
                        {p}
                    </button>
                ))}
            </div>

            <div className="resize-tool__inputs">
                <label>
                    W
                    <input type="number" value={width} onChange={handleWidthChange} min="1" />
                </label>
                <span className="resize-tool__times">×</span>
                <label>
                    H
                    <input type="number" value={height} onChange={handleHeightChange} min="1" />
                </label>
            </div>

            <label className="resize-tool__aspect">
                <input
                    type="checkbox"
                    checked={lockAspect}
                    onChange={(e) => setLockAspect(e.target.checked)}
                />
                Lock aspect ratio
            </label>

            <button className="resize-tool__btn" onClick={handleResize}>Resize</button>

            <canvas ref={canvasRef} hidden />

            {resultUrl && (
                <div className="resize-tool__result">
                    <p className="result-label">Output</p>
                    {sizeDelta && (
                        <span className="size-delta">
                            <span className="size-delta__from">{fmt(sizeDelta.orig)}</span>
                            <span className="size-delta__arrow">→</span>
                            <span className="size-delta__to">{fmt(sizeDelta.next)}</span>
                            <span className={`size-delta__pct size-delta__pct--${sizeDelta.diff <= 0 ? 'smaller' : 'larger'}`}>
                                {sizeDelta.diff > 0 ? '+' : ''}{sizeDelta.pct}%
                            </span>
                        </span>
                    )}
                    <img src={resultUrl} alt="Resized preview" />
                    <div className="resize-tool__result-actions">
                        <button className="resize-tool__reimage-btn" onClick={() => onResult(resultUrl)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Re-Image
                            <span className="reimage-info" data-tip="Sets this result as your working image for further edits">ⓘ</span>
                        </button>
                        <a className="btn-download" href={resultUrl} download={`resized.${extOf(resultUrl)}`}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16l-4-4m4 4l4-4m-4 4V4M4 20h16"/></svg>
                            Download
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResizeTool;
