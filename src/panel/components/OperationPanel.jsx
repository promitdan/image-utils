import { useState } from 'react';
import Base64Tool from './Base64Tool';
import ResizeTool from './ResizeTool';
import CropTool from './CropTool';
import './OperationPanel.css';

const OPERATIONS = ['Base64', 'Resize', 'Crop'];

const OperationPanel = ({ image }) => {
    const [activeOperation, setActiveOperation] = useState(null);

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
            {activeOperation === 'Base64' && <Base64Tool image={image} />}
            {activeOperation === 'Resize' && <ResizeTool image={image} />}
            {activeOperation === 'Crop' && <CropTool image={image} />}
        </div>
    );
};

export default OperationPanel;