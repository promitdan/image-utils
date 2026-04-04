import { useState, useEffect } from 'react';
import './SVGCodeTool.css';

const REIMAGE_ICON = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

const SVGCodeTool = ({ image, onResult }) => {
    const [code, setCode]         = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [parseError, setParseError] = useState(false);

    const isSvg = image.file?.type === 'image/svg+xml'
        || image.url.startsWith('data:image/svg');

    useEffect(() => {
        if (!isSvg) return;
        fetch(image.url)
            .then(r => r.text())
            .then(text => {
                setCode(text);
                setPreviewUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`);
                setParseError(false);
            });
    }, [image.url]);

    const handleCodeChange = (e) => {
        const val = e.target.value;
        setCode(val);
        const doc = new DOMParser().parseFromString(val, 'image/svg+xml');
        if (doc.querySelector('parsererror')) {
            setParseError(true);
        } else {
            setParseError(false);
            setPreviewUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(val)}`);
        }
    };

    if (!isSvg) {
        return (
            <div className="svg-code-tool__unsupported">
                Only available for SVG images.
            </div>
        );
    }

    return (
        <div className="svg-code-tool">
            <div className="svg-code-tool__preview-section">
                <p className="result-label">Preview</p>
                {previewUrl && (
                    <>
                        <div className="svg-code-tool__preview-wrap">
                            <img src={previewUrl} alt="SVG Preview" className="svg-code-tool__preview-img" />
                        </div>
                        {!parseError && (
                            <div className="svg-code-tool__actions">
                                <button className="svg-code-tool__reimage-btn" onClick={() => onResult(previewUrl)}>
                                    {REIMAGE_ICON} Re-Image
                                    <span className="reimage-info" data-tip="Sets this result as your working image for further edits">ⓘ</span>
                                </button>
                                <a className="btn-download" href={previewUrl} download="output.svg">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16l-4-4m4 4l4-4m-4 4V4M4 20h16"/></svg>
                                    Download
                                </a>
                            </div>
                        )}
                    </>
                )}
            </div>
            <div className="svg-code-tool__editor-section">
                <p className="result-label">Code</p>
                <textarea
                    className={`svg-code-tool__editor ${parseError ? 'svg-code-tool__editor--error' : ''}`}
                    value={code}
                    onChange={handleCodeChange}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                />
                {parseError && (
                    <span className="svg-code-tool__error-msg">Invalid SVG — preview not updated</span>
                )}
            </div>
        </div>
    );
};

export default SVGCodeTool;
