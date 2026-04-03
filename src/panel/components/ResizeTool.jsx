import { useState, useEffect, useRef } from 'react';
import './ResizeTool.css';

const ResizeTool = ({ image }) => {
    const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [lockAspect, setLockAspect] = useState(true);
    const [resultUrl, setResultUrl] = useState(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setOriginalSize({ width: img.naturalWidth, height: img.naturalHeight });
            setWidth(String(img.naturalWidth));
            setHeight(String(img.naturalHeight));
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
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const targetW = Number(width);
        const targetH = Number(height);
        if (!targetW || !targetH) return;

        const img = new Image();
        img.onload = () => {
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

            setResultUrl(finalCanvas.toDataURL());
        };
        img.src = image.url;
    };


    return (
        <div className="resize-tool">
            <p className="resize-tool__original">
                Original: {originalSize.width} × {originalSize.height}px
            </p>

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
                    <img src={resultUrl} alt="Resized preview" />
                    <a href={resultUrl} download="resized.png">Download</a>
                </div>
            )}
        </div>
    );
};

export default ResizeTool;
