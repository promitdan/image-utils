import { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './CropTool.css';

const CropTool = ({ image, onResult }) => {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [resultUrl, setResultUrl] = useState(null);
    const imgRef = useRef(null);

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

        setResultUrl(canvas.toDataURL());
    };

    return (
        <div className="crop-tool">
            <ReactCrop
                crop={crop}
                onChange={setCrop}
                onComplete={setCompletedCrop}
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
                            Reimage
                        </button>
                        <a href={resultUrl} download="cropped.png">Download</a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CropTool;
