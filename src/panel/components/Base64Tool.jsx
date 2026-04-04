import { useState, useEffect } from 'react';
import './Base64Tool.css';

const REIMAGE_ICON = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

const detectMime = (raw) => {
    if (raw.startsWith('/9j/')) return 'image/jpeg';
    if (raw.startsWith('iVBORw')) return 'image/png';
    if (raw.startsWith('UklGR')) return 'image/webp';
    if (raw.startsWith('R0lGOD')) return 'image/gif';
    return 'image/png';
};

const Base64Tool = ({ image, onResult }) => {
    const [mode, setMode] = useState('encode');

    // Encode state
    const [base64, setBase64] = useState('');
    const [copied, setCopied] = useState(false);

    // Decode state
    const [input, setInput] = useState('');
    const [decodedUrl, setDecodedUrl] = useState(null);
    const [decodeError, setDecodeError] = useState(false);

    useEffect(() => {
        if (mode !== 'encode') return;
        if (image.url.startsWith('data:')) {
            setBase64(image.url);
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setBase64(e.target.result);
        reader.readAsDataURL(image.file);
    }, [image.url, mode]);

    const handleCopy = () => {
        navigator.clipboard.writeText(base64);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDecode = () => {
        const raw = input.trim();
        const dataUrl = raw.startsWith('data:')
            ? raw
            : `data:${detectMime(raw)};base64,${raw}`;

        const img = new Image();
        img.onload = () => { setDecodedUrl(dataUrl); setDecodeError(false); };
        img.onerror = () => { setDecodeError(true); setDecodedUrl(null); };
        img.src = dataUrl;
    };

    const handleModeSwitch = (next) => {
        setMode(next);
        setDecodedUrl(null);
        setDecodeError(false);
    };

    return (
        <div className="base64-tool">
            <div className="base64-tool__toggle">
                <button
                    className={`base64-tool__mode-btn ${mode === 'encode' ? 'base64-tool__mode-btn--active' : ''}`}
                    onClick={() => handleModeSwitch('encode')}
                >Encode</button>
                <button
                    className={`base64-tool__mode-btn ${mode === 'decode' ? 'base64-tool__mode-btn--active' : ''}`}
                    onClick={() => handleModeSwitch('decode')}
                >Decode</button>
            </div>

            {mode === 'encode' ? (
                <>
                    <textarea className="base64-tool__output" value={base64} readOnly rows={6} />
                    <button className="base64-tool__copy" onClick={handleCopy}>
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </>
            ) : (
                <>
                    <textarea
                        className="base64-tool__input"
                        placeholder="Paste a base64 string or full data URL…"
                        value={input}
                        rows={5}
                        onChange={(e) => { setInput(e.target.value); setDecodedUrl(null); setDecodeError(false); }}
                    />
                    {decodeError && (
                        <p className="base64-tool__error">Invalid base64 — could not decode as image.</p>
                    )}
                    <button
                        className="base64-tool__copy"
                        onClick={handleDecode}
                        disabled={!input.trim()}
                    >
                        Decode
                    </button>
                    {decodedUrl && (
                        <div className="base64-tool__decoded">
                            <p className="result-label">Output</p>
                            <img src={decodedUrl} alt="Decoded" />
                            <div className="base64-tool__result-actions">
                                <button className="base64-tool__reimage-btn" onClick={() => onResult(decodedUrl)}>
                                    {REIMAGE_ICON} Re-Image
                                <span className="reimage-info" data-tip="Sets this result as your working image for further edits">ⓘ</span>
                                </button>
                                <a className="btn-download" href={decodedUrl} download="decoded.png">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16l-4-4m4 4l4-4m-4 4V4M4 20h16"/></svg>
                                    Download
                                </a>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Base64Tool;
