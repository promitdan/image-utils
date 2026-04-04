import { useState, useRef } from 'react';
import './RemoveBackgroundTool.css';

// BFS flood-fill from all 4 corners, making pixels transparent if they are
// within `tolerance` of the sampled background color.
function removeBackgroundCanvas(imageData, tolerance) {
    const { data, width, height } = imageData;
    const visited = new Uint8Array(width * height);
    const tolSq = tolerance * tolerance * 3;

    // Average the 4 corner colors as the background sample
    let r = 0, g = 0, b = 0;
    for (const [cx, cy] of [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]) {
        const i = (cy * width + cx) * 4;
        r += data[i]; g += data[i + 1]; b += data[i + 2];
    }
    r /= 4; g /= 4; b /= 4;

    function diff(i) {
        const dr = data[i] - r, dg = data[i + 1] - g, db = data[i + 2] - b;
        return dr * dr + dg * dg + db * db;
    }

    // Seed BFS from every edge pixel, not just corners, for better coverage
    const queue = [];
    const seed = (x, y) => {
        const idx = y * width + x;
        if (!visited[idx]) { visited[idx] = 1; queue.push(x, y); }
    };
    for (let x = 0; x < width; x++)  { seed(x, 0); seed(x, height - 1); }
    for (let y = 1; y < height - 1; y++) { seed(0, y); seed(width - 1, y); }

    let qi = 0;
    while (qi < queue.length) {
        const x = queue[qi++], y = queue[qi++];
        const pi = (y * width + x) * 4;
        if (diff(pi) > tolSq) continue;
        data[pi + 3] = 0;
        const neighbors = [x - 1, y, x + 1, y, x, y - 1, x, y + 1];
        for (let n = 0; n < 8; n += 2) {
            const nx = neighbors[n], ny = neighbors[n + 1];
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const ni = ny * width + nx;
                if (!visited[ni]) { visited[ni] = 1; queue.push(nx, ny); }
            }
        }
    }
}


const RemoveBackgroundTool = ({ image, onResult }) => {
    const [tolerance, setTolerance] = useState(30);
    const [resultUrl, setResultUrl] = useState(null);
    const canvasRef = useRef(null);

    const handleRemove = () => {
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            removeBackgroundCanvas(imageData, tolerance);
            ctx.putImageData(imageData, 0, 0);

            const url = canvas.toDataURL('image/png');
            setResultUrl(url);
        };
        img.src = image.url;
    };

    return (
        <div className="rm-tool">
            <div className="rm-tool__preview-wrap">
                <div className="rm-tool__checker" />
                <img className="rm-tool__img" src={resultUrl ?? image.url} alt="Preview" />
            </div>

            <label className="rm-tool__tolerance-label">
                <span>Tolerance: {tolerance}</span>
                <input
                    type="range"
                    min="1"
                    max="120"
                    value={tolerance}
                    onChange={e => { setTolerance(Number(e.target.value)); setResultUrl(null); }}
                    className="rm-tool__slider"
                />
            </label>

            <div className="rm-tool__actions">
                <button className="rm-tool__btn" onClick={handleRemove}>
                    Remove Background
                </button>
                {resultUrl && (
                    <>
                        <button className="rm-tool__reimage-btn" onClick={() => onResult(resultUrl)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Re-Image
                            <span className="reimage-info" data-tip="Sets this result as your working image for further edits">ⓘ</span>
                        </button>
                        <a className="btn-download" href={resultUrl} download="no-bg.png">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16l-4-4m4 4l4-4m-4 4V4M4 20h16"/></svg>
                            Download
                        </a>
                    </>
                )}
            </div>

            <canvas ref={canvasRef} hidden />
        </div>
    );
};

export default RemoveBackgroundTool;
