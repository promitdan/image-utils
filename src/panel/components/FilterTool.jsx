import { useState, useRef } from 'react';
import './FilterTool.css';

const FILTERS = [
    { id: 'none',      label: 'None',      css: '' },
    { id: 'grayscale', label: 'Grayscale', css: 'grayscale(1)' },
    { id: 'sepia',     label: 'Sepia',     css: 'sepia(1)' },
    { id: 'invert',    label: 'Invert',    css: 'invert(1)' },
    { id: 'vivid',     label: 'Vivid',     css: 'saturate(2) contrast(1.1)' },
    { id: 'warm',      label: 'Warm',      css: 'sepia(0.35) saturate(1.5) brightness(1.05)' },
    { id: 'cool',      label: 'Cool',      css: 'hue-rotate(195deg) saturate(1.15) brightness(1.05)' },
    { id: 'vintage',   label: 'Vintage',   css: 'sepia(0.45) contrast(1.1) brightness(0.92) saturate(0.85)' },
    { id: 'dramatic',  label: 'Dramatic',  css: 'contrast(1.5) brightness(0.88) saturate(1.3)' },
    { id: 'fade',      label: 'Fade',      css: 'contrast(0.78) brightness(1.12) saturate(0.65)' },
];

const fmt = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const extOf = (url) => MIME_EXT[url.split(';')[0].slice(5)] ?? 'png';
const CANVAS_ENCODABLE = new Set(['image/jpeg', 'image/png', 'image/webp']);
const QUALITY = { 'image/jpeg': 0.85, 'image/webp': 0.85 };
const getOutputFormat = (image) => {
    const type = image.file?.type
        ?? (image.url.startsWith('data:') ? image.url.split(';')[0].slice(5) : null);
    const mime = CANVAS_ENCODABLE.has(type) ? type : 'image/webp';
    return [mime, QUALITY[mime]];
};

const FilterTool = ({ image, onResult }) => {
    const [selected, setSelected] = useState('none');
    const [resultUrl, setResultUrl] = useState(null);
    const canvasRef = useRef(null);

    const activeFilter = FILTERS.find(f => f.id === selected);

    const handleSelect = (id) => {
        setSelected(id);
        if (id === 'none') {
            setResultUrl(null);
            return;
        }
        const filter = FILTERS.find(f => f.id === id);
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.filter = filter.css;
            ctx.drawImage(img, 0, 0);
            ctx.filter = 'none';
            const [mime, quality] = getOutputFormat(image);
            const url = canvas.toDataURL(mime, quality);
            setResultUrl(url);
        };
        img.src = image.url;
    };

    return (
        <div className="filter-tool">
            <div className="filter-tool__grid">
                {FILTERS.map(f => (
                    <button
                        key={f.id}
                        className={`filter-tool__swatch ${selected === f.id ? 'filter-tool__swatch--active' : ''}`}
                        onClick={() => handleSelect(f.id)}
                    >
                        <img
                            src={image.url}
                            alt={f.label}
                            style={{ filter: f.css }}
                            draggable={false}
                        />
                        <span>{f.label}</span>
                    </button>
                ))}
            </div>

            <div className="filter-tool__preview">
                <img
                    src={image.url}
                    alt="Preview"
                    style={{ filter: activeFilter.css }}
                    draggable={false}
                />
            </div>

            {resultUrl && (
                <div className="filter-tool__actions">
                    <button className="filter-tool__reimage-btn" onClick={() => onResult(resultUrl)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Re-Image
                        <span className="reimage-info" data-tip="Sets this result as your working image for further edits">ⓘ</span>
                    </button>
                    <a className="btn-download" href={resultUrl} download={`filtered.${extOf(resultUrl)}`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16l-4-4m4 4l4-4m-4 4V4M4 20h16"/></svg>
                        Download
                    </a>
                </div>
            )}

            <canvas ref={canvasRef} hidden />
        </div>
    );
};

export default FilterTool;
