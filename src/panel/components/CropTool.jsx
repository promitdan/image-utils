import { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './CropTool.css';

const ASPECT_PRESETS = [
    { label: 'Free', value: undefined },
    { label: '1:1',  value: 1 },
    { label: '4:3',  value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
];


// Canvas toDataURL only supports jpeg/png/webp. Anything else (avif, heic, bmp…)
// falls back silently to PNG and inflates the size. For those, use webp instead.
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

const CropTool = ({ image, onResult }) => {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [aspectRatio, setAspectRatio] = useState(undefined);
    const [resultUrl, setResultUrl] = useState(null);
    const imgRef = useRef(null);

    const handleAspectPreset = (value) => {
        setAspectRatio(value);
        setCrop(undefined);
        setCompletedCrop(null);
        setResultUrl(null);
    };

    const handleCrop = () => {
        if (!completedCrop || !imgRef.current) return;
        const img = imgRef.current;
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(completedCrop.width * scaleX);
        canvas.height = Math.round(completedCrop.height * scaleY);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            img,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0, 0,
            canvas.width,
            canvas.height,
        );

        const [mime, quality] = getOutputFormat(image);
        const url = canvas.toDataURL(mime, quality);
        setResultUrl(url);
    };

    return (
        <div className="crop-tool">
            <div className="crop-tool__presets">
                {ASPECT_PRESETS.map(p => (
                    <button
                        key={p.label}
                        className={`crop-tool__preset-btn ${aspectRatio === p.value ? 'crop-tool__preset-btn--active' : ''}`}
                        onClick={() => handleAspectPreset(p.value)}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <ReactCrop
                crop={crop}
                onChange={setCrop}
                onComplete={setCompletedCrop}
                aspect={aspectRatio}
                className="crop-tool__react-crop"
            >
                <img
                    ref={imgRef}
                    src={image.url}
                    alt="Crop preview"
                    className="crop-tool__preview-img"
                />
            </ReactCrop>

            <button
                className="crop-tool__btn"
                onClick={handleCrop}
                disabled={!completedCrop?.width || !completedCrop?.height}
            >
                Crop
            </button>

            {resultUrl && (
                <div className="crop-tool__result">
                    <p className="result-label">Output</p>
                    <img src={resultUrl} alt="Cropped preview" />
                    <div className="crop-tool__result-actions">
                        <button className="crop-tool__reimage-btn" onClick={() => onResult(resultUrl)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Re-Image
                            <span className="reimage-info" data-tip="Sets this result as your working image for further edits">ⓘ</span>
                        </button>
                        <a className="btn-download" href={resultUrl} download={`cropped.${extOf(resultUrl)}`}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16l-4-4m4 4l4-4m-4 4V4M4 20h16"/></svg>
                            Download
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CropTool;
