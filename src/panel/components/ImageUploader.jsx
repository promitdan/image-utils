import { useState, useRef } from 'react';
import './ImageUploader.css';

const ImageUploader = ({ onImageLoad, compact }) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef(null);

    const loadFile = (files) => {
        const imageFile = Array.from(files).find(f => f.type.startsWith('image/'));
        if (!imageFile) return;
        onImageLoad(imageFile);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        loadFile(e.dataTransfer.files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleInputChange = (e) => {
        loadFile(e.target.files);
        e.target.value = '';
    };

    const sharedEvents = {
        onDrop: handleDrop,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onClick: () => inputRef.current.click(),
    };

    const fileInput = (
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleInputChange} />
    );

    if (compact) {
        return (
            <div className={`drop-zone drop-zone--compact ${isDragging ? 'drop-zone--active' : ''}`} {...sharedEvents}>
                {fileInput}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span>{isDragging ? 'Drop to replace' : 'Drop or click to replace image'}</span>
            </div>
        );
    }

    return (
        <div className="image-uploader">
            <div className={`drop-zone ${isDragging ? 'drop-zone--active' : ''}`} {...sharedEvents}>
                {fileInput}
                <div className="drop-zone__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                </div>
                <p className="drop-zone__primary">
                    {isDragging ? 'Drop image here' : 'Drag & drop an image'}
                </p>
                <p className="drop-zone__secondary">or click to browse</p>
            </div>
        </div>
    );
};

export default ImageUploader;
