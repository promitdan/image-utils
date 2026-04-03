import { useState } from 'react';
import './MainPage.css';
import ImageUploader from './ImageUploader';
import OperationPanel from './OperationPanel';

const MainPage = () => {
    const [image, setImage] = useState(null);

    const handleImageLoad = (file) => {
        if (image) URL.revokeObjectURL(image.url);
        setImage({
            name: file.name,
            size: file.size,
            url: URL.createObjectURL(file),
            file
        });
    };

    const handleImageRemove = () => {
        URL.revokeObjectURL(image.url);
        setImage(null);
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="main-page">
            <ImageUploader onImageLoad={handleImageLoad} />
            {image && (
                <div className="image-card">
                    <img className="image-card__thumb" src={image.url} alt={image.name} />
                    <div className="image-card__info">
                        <span className="image-card__name" title={image.name}>{image.name}</span>
                        <span className="image-card__size">{formatSize(image.size)}</span>
                    </div>
                    <button className="image-card__remove" onClick={handleImageRemove} title="Remove">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            {image && <OperationPanel image={image} />}
        </div>
    );
};

export default MainPage;