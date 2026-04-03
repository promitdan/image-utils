import { useState } from 'react';
import Base64Tool from './Base64Tool';
import ResizeTool from './ResizeTool';
import CropTool from './CropTool';
import MetadataTool from './MetadataTool';
import ConvertTool from './ConvertTool';
import './OperationPanel.css';

const OPERATIONS = ['Base64', 'Resize', 'Crop', 'Metadata', 'Convert'];

const OperationPanel = ({ image }) => {
    const [activeOperation, setActiveOperation] = useState(null);
    const [workingImage, setWorkingImage] = useState(image);

    const handleResult = (url) => {
        setWorkingImage({ url });
    };

    const handleReset = () => {
        setWorkingImage(image);
    };

    const isModified = workingImage.url !== image.url;

    return (
        <div className="operation-panel">
            <div className="operation-selector">
                {OPERATIONS.map(op => (
                    <button
                        key={op}
                        className={`operation-btn ${activeOperation === op ? 'operation-btn--active' : ''}`}
                        onClick={() => setActiveOperation(op)}
                    >
                        {op}
                    </button>
                ))}
            </div>
            {isModified && (
                <div className="operation-panel__reimage-card">
                    <img
                        className="operation-panel__reimage-thumb"
                        src={workingImage.url}
                        alt="Reimaged preview"
                    />
                    <div className="operation-panel__reimage-info">
                        <div className="operation-panel__reimage-title">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Reimaged
                        </div>
                        <span className="operation-panel__reimage-sub">All operations use this image</span>
                    </div>
                    <button className="operation-panel__reset-btn" onClick={handleReset} title="Reset to original">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            {activeOperation === 'Base64'   && <Base64Tool   image={workingImage} onResult={handleResult} />}
            {activeOperation === 'Resize'   && <ResizeTool   image={workingImage} onResult={handleResult} />}
            {activeOperation === 'Crop'     && <CropTool     image={workingImage} onResult={handleResult} />}
            {activeOperation === 'Metadata' && <MetadataTool image={workingImage} />}
            {activeOperation === 'Convert'  && <ConvertTool  image={workingImage} onResult={handleResult} />}
        </div>
    );
};

export default OperationPanel;
