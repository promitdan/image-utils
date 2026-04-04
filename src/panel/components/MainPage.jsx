import { useState } from 'react';
import './MainPage.css';
import ImageUploader from './ImageUploader';
import OperationPanel from './OperationPanel';

const MainPage = () => {
    const [image, setImage] = useState(null);

    const loadFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        if (image) URL.revokeObjectURL(image.url);
        setImage({ name: file.name, size: file.size, url: URL.createObjectURL(file), file });
    };

    const handleImageRemove = () => {
        URL.revokeObjectURL(image.url);
        setImage(null);
    };

    return (
        <div className="main-page">
            <header className="app-header">
                <img src="/logo_128.png" alt="ImgLab" className="app-header__logo" />
                <div className="app-header__text">
                    <span className="app-header__name">ImgLab</span>
                    <span className="app-header__tagline">Edit, transform, and optimize images in one flow</span>
                </div>
            </header>

            <div className={`main-page__content ${!image ? 'main-page__content--empty' : ''}`}>
                {!image ? (
                    <>
                        <p className="main-page__intro">
                            Drop or upload an image to resize, crop, convert formats, inspect metadata, and encode to Base64.
                        </p>
                        <ImageUploader onImageLoad={loadFile} />
                    </>
                ) : (
                    <OperationPanel
                        key={image.url}
                        image={image}
                        onReplace={loadFile}
                        onRemove={handleImageRemove}
                    />
                )}
            </div>
        </div>
    );
};

export default MainPage;
