import { useState, useRef } from 'react';
import Base64Tool from './Base64Tool';
import ResizeTool from './ResizeTool';
import CropTool from './CropTool';
import MetadataTool from './MetadataTool';
import ConvertTool from './ConvertTool';
import ColorPickerTool from './ColorPickerTool';
import RemoveBackgroundTool from './RemoveBackgroundTool';
import FilterTool from './FilterTool';
import './OperationPanel.css';

import cropIcon     from '../../assets/icons/crop.png';
import resizeIcon   from '../../assets/icons/resize.png';
import removeBgIcon from '../../assets/icons/remove_BG.png';
import filtersIcon  from '../../assets/icons/filters.png';
import colorsIcon   from '../../assets/icons/colors.png';
import convertIcon  from '../../assets/icons/convert.png';
import base64Icon   from '../../assets/icons/base64.png';
import metadataIcon from '../../assets/icons/metadata.png';

const SECTIONS = [
    {
        label: 'Edit',
        tools: [
            { id: 'Crop',      icon: cropIcon },
            { id: 'Resize',    icon: resizeIcon },
            { id: 'Remove BG', icon: removeBgIcon },
        ],
    },
    {
        label: 'Style',
        tools: [
            { id: 'Image Filters', icon: filtersIcon },
            { id: 'Color Picker',  icon: colorsIcon },
        ],
    },
    {
        label: 'Format',
        tools: [
            { id: 'Convert', icon: convertIcon },
            { id: 'Base64',  icon: base64Icon },
        ],
    },
    {
        label: 'Info',
        tools: [
            { id: 'Metadata', icon: metadataIcon },
        ],
    },
];

const TRASH_ICON = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
);

const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const OperationPanel = ({ image, onReplace, onRemove }) => {
    const [activeOperation, setActiveOperation] = useState(null);
    const [workingImage, setWorkingImage]        = useState(image);
    const [isDraggingOver, setIsDraggingOver]    = useState(false);
    const replaceInputRef = useRef(null);

    const handleResult = (url) => setWorkingImage({ url });
    const handleReset  = () => setWorkingImage(image);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
        if (file) onReplace(file);
    };
    const handleDragOver  = (e) => { e.preventDefault(); setIsDraggingOver(true); };
    const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDraggingOver(false); };

    const isModified = workingImage.url !== image.url;

    return (
        <div className="workspace">

            {/* ── Left sidebar ── */}
            <div className="workspace__sidebar">
                <nav className="sidebar__nav">
                    {SECTIONS.map(section => (
                        <div key={section.label} className="sidebar__section">
                            <span className="sidebar__section-label">{section.label}</span>
                            {section.tools.map(tool => (
                                <button
                                    key={tool.id}
                                    className={`sidebar__tool-btn ${activeOperation === tool.id ? 'sidebar__tool-btn--active' : ''}`}
                                    onClick={() => setActiveOperation(tool.id)}
                                >
                                    <img src={tool.icon} alt="" className="sidebar__tool-icon" />
                                    {tool.id}
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>

            </div>

            {/* ── Right main area ── */}
            <div
                className={`workspace__main ${isDraggingOver ? 'workspace__main--drop' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {/* Image preview */}
                <div className="workspace__image-area">
                    <input
                        ref={replaceInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => { onReplace(e.target.files[0]); e.target.value = ''; }}
                    />
                    {isDraggingOver && (
                        <div className="workspace__drop-overlay">Drop to replace</div>
                    )}
                    <div
                        className="workspace__image-wrap"
                        onClick={() => replaceInputRef.current.click()}
                        title="Click to change image"
                    >
                        <img className="workspace__image" src={workingImage.url} alt={image.name} />
                        <div className="workspace__image-change-hint">Click to change</div>
                    </div>
                    <div className="workspace__image-meta">
                        <span className="workspace__image-name" title={image.name}>{image.name}</span>
                        {image.size && <span className="workspace__image-size">{formatSize(image.size)}</span>}
                        <button
                            className="workspace__image-remove"
                            onClick={onRemove}
                            title="Remove image"
                        >
                            {TRASH_ICON}
                        </button>
                    </div>
                </div>

                {/* Reimaged banner */}
                {isModified && (
                    <div className="workspace__reimage-banner">
                        <img src={workingImage.url} alt="Modified" className="workspace__reimage-thumb" />
                        <span className="workspace__reimage-label">Working on reimaged version</span>
                        <button className="workspace__reimage-reset" onClick={handleReset} title="Reset to original">
                            Reset
                        </button>
                    </div>
                )}

                {/* Tool content */}
                {activeOperation ? (
                    <div className="workspace__tool-area">
                        {activeOperation === 'Crop'         && <CropTool             image={workingImage} onResult={handleResult} />}
                        {activeOperation === 'Resize'        && <ResizeTool           image={workingImage} onResult={handleResult} />}
                        {activeOperation === 'Remove BG'     && <RemoveBackgroundTool image={workingImage} onResult={handleResult} />}
                        {activeOperation === 'Image Filters' && <FilterTool           image={workingImage} onResult={handleResult} />}
                        {activeOperation === 'Color Picker'  && <ColorPickerTool      image={workingImage} />}
                        {activeOperation === 'Convert'       && <ConvertTool          image={workingImage} onResult={handleResult} />}
                        {activeOperation === 'Base64'        && <Base64Tool           image={workingImage} onResult={handleResult} />}
                        {activeOperation === 'Metadata'      && <MetadataTool         image={workingImage} />}
                    </div>
                ) : (
                    <div className="workspace__placeholder">
                        Select a tool from the sidebar
                    </div>
                )}
            </div>
        </div>
    );
};

export default OperationPanel;
