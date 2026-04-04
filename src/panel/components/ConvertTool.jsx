import { useState } from 'react';
import './ConvertTool.css';

const FORMATS = [
    { label: 'PNG',  mime: 'image/png',  ext: 'png',  hasQuality: false },
    { label: 'JPEG', mime: 'image/jpeg', ext: 'jpg',  hasQuality: true  },
    { label: 'WebP', mime: 'image/webp', ext: 'webp', hasQuality: true  },
];

const fmt = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const REIMAGE_ICON = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

const QUALITY_PRESETS = [
    { label: 'High',     value: 95 },
    { label: 'Balanced', value: 80 },
    { label: 'Small',    value: 60 },
];

const ConvertTool = ({ image, onResult }) => {
    const [format, setFormat] = useState(FORMATS[0]);
    const [quality, setQuality] = useState(90);
    const [result, setResult] = useState(null);

    const handleFormatChange = (f) => {
        setFormat(f);
        setResult(null);
    };

    const handleConvert = () => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');

            if (format.mime === 'image/jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL(format.mime, format.hasQuality ? quality / 100 : undefined);
            const size = Math.round(atob(dataUrl.split(',')[1]).length);
            const origSz = image.size ?? (image.url.startsWith('data:') ? Math.round(atob(image.url.split(',')[1]).length) : null);
            const diff = origSz !== null ? size - origSz : null;
            setResult({ url: dataUrl, size, ext: format.ext, origSz, diff, pct: diff !== null ? Math.round((diff / origSz) * 100) : null });
        };
        img.src = image.url;
    };

    return (
        <div className="convert-tool">
            <div className="convert-tool__formats">
                {FORMATS.map(f => (
                    <button
                        key={f.label}
                        className={`convert-tool__fmt-btn ${format.label === f.label ? 'convert-tool__fmt-btn--active' : ''}`}
                        onClick={() => handleFormatChange(f)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {format.hasQuality && (
                <div className="convert-tool__quality">
                    <div className="convert-tool__quality-header">
                        <span>Quality</span>
                        <span className="convert-tool__quality-val">{quality}%</span>
                        <div className="convert-tool__quality-presets">
                            {QUALITY_PRESETS.map(p => (
                                <button
                                    key={p.label}
                                    className={`convert-tool__quality-preset-btn ${quality === p.value ? 'convert-tool__quality-preset-btn--active' : ''}`}
                                    onClick={() => { setQuality(p.value); setResult(null); }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <input
                        className="convert-tool__slider"
                        type="range"
                        min="1"
                        max="100"
                        value={quality}
                        onChange={(e) => { setQuality(Number(e.target.value)); setResult(null); }}
                    />
                </div>
            )}

            <button className="convert-tool__btn" onClick={handleConvert}>Convert</button>

            {result && (
                <div className="convert-tool__result">
                    <p className="result-label">Output</p>
                    <img src={result.url} alt="Converted" />
                    <div className="convert-tool__result-meta">
                        {result.origSz !== null ? (
                            <span className="size-delta">
                                <span className="size-delta__from">{fmt(result.origSz)}</span>
                                <span className="size-delta__arrow">→</span>
                                <span className="size-delta__to">{fmt(result.size)}</span>
                                <span className={`size-delta__pct size-delta__pct--${result.diff <= 0 ? 'smaller' : 'larger'}`}>
                                    {result.diff > 0 ? '+' : ''}{result.pct}%
                                </span>
                            </span>
                        ) : (
                            <span className="convert-tool__result-size">{fmt(result.size)}</span>
                        )}
                        <div className="convert-tool__result-actions">
                            <button className="convert-tool__reimage-btn" onClick={() => onResult(result.url)}>
                                {REIMAGE_ICON} Re-Image
                                <span className="reimage-info" data-tip="Sets this result as your working image for further edits">ⓘ</span>
                            </button>
                            <a className="btn-download" href={result.url} download={`converted.${result.ext}`}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16l-4-4m4 4l4-4m-4 4V4M4 20h16"/></svg>
                                Download
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConvertTool;
