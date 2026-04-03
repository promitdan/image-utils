import { useState, useEffect } from 'react';
import './Base64Tool.css';

const Base64Tool = ({ image }) => {
    const [base64, setBase64] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const reader = new FileReader();
        reader.onload = (e) => setBase64(e.target.result);
        reader.readAsDataURL(image.file);
    }, [image.file]);

    const handleCopy = () => {
        navigator.clipboard.writeText(base64);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="base64-tool">
            <textarea
                className="base64-tool__output"
                value={base64}
                readOnly
                rows={6}
            />
            <button className="base64-tool__copy" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
            </button>
        </div>
    );
};

export default Base64Tool;
