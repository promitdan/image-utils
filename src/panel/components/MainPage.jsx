import { useState, useRef } from 'react';
import './MainPage.css';
import ImageUploader from './ImageUploader';
import OperationPanel from './OperationPanel';

const MainPage = () => {
    const [image, setImage] = useState(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const replaceInputRef = useRef(null);

    const loadFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        if (image) URL.revokeObjectURL(image.url);
        setImage({ name: file.name, size: file.size, url: URL.createObjectURL(file), file });
    };

    const handleImageRemove = () => {
        URL.revokeObjectURL(image.url);
        setImage(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
        if (file) loadFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsDraggingOver(false);
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="main-page">
            <header className="app-header">
                <img src="/logo_32.png" alt="ProImage+" className="app-header__logo" />
                <div className="app-header__text">
                    <span className="app-header__name">ProImage+</span>
                    <span className="app-header__tagline">Image toolkit</span>
                </div>
            </header>

            <div className="main-page__content">
                {!image ? (
                    <>
                        <p className="main-page__intro">
                            Drop or upload an image to resize, crop, convert formats, inspect metadata, and encode to Base64.
                        </p>
                        <ImageUploader onImageLoad={loadFile} />
                    </>
                ) : (
                    <>
                        <div
                            className={`image-card ${isDraggingOver ? 'image-card--drop-active' : ''}`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => replaceInputRef.current.click()}
                            title="Click or drop to replace image"
                        >
                            <input
                                ref={replaceInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => { loadFile(e.target.files[0]); e.target.value = ''; }}
                            />
                            <img className="image-card__thumb" src={image.url} alt={image.name} />
                            <div className="image-card__info">
                                <span className="image-card__name" title={image.name}>{image.name}</span>
                                <span className="image-card__size">{formatSize(image.size)}</span>
                            </div>
                            {isDraggingOver ? (
                                <span className="image-card__drop-hint">Drop to replace</span>
                            ) : (
                                <button
                                    className="image-card__remove"
                                    onClick={(e) => { e.stopPropagation(); handleImageRemove(); }}
                                    title="Remove"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <OperationPanel key={image.url} image={image} />
                    </>
                )}
            </div>
        </div>
    );
};

export default MainPage;
