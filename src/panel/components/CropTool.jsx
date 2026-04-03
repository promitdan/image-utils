import { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './CropTool.css';

const CropTool = ({ image }) => {
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
                    <img src={resultUrl} alt="Cropped preview" />
                    <a href={resultUrl} download="cropped.png">Download</a>
                </div>
            )}
        </div>
    );
};

export default CropTool;
