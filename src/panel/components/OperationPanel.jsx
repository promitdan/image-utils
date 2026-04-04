import { useState, useRef } from 'react';
import Base64Tool from './Base64Tool';
import ResizeTool from './ResizeTool';
import CropTool from './CropTool';
import MetadataTool from './MetadataTool';
import ConvertTool from './ConvertTool';
import ColorPickerTool from './ColorPickerTool';
import RemoveBackgroundTool from './RemoveBackgroundTool';
import FilterTool from './FilterTool';
import SVGCodeTool from './SVGCodeTool';
import './OperationPanel.css';

import cropIcon     from '../../assets/icons/crop.png';
import resizeIcon   from '../../assets/icons/resize.png';
import removeBgIcon from '../../assets/icons/remove_BG.png';
import filtersIcon  from '../../assets/icons/filters.png';
import colorsIcon   from '../../assets/icons/colors.png';
import convertIcon  from '../../assets/icons/convert.png';
import base64Icon   from '../../assets/icons/base64.png';
import metadataIcon  from '../../assets/icons/metadata.png';
import svgCodeIcon   from '../../assets/icons/svg_code.png';

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
            { id: 'SVG Code', icon: svgCodeIcon },
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

const sizeOf = (url) => {
    if (!url.startsWith('data:')) return null;
    const rest = url.slice(url.indexOf(',') + 1);
    if (url.includes(';base64,')) return Math.round(atob(rest).length);
    return new Blob([decodeURIComponent(rest)]).size;
};

const OperationPanel = ({ image, onReplace, onRemove }) => {
    const [activeOperation, setActiveOperation] = useState(null);
    const [reimagedUrl, setReimagedUrl]          = useState(null);
    const [selectedVersion, setSelectedVersion]  = useState('original');
    const [isDraggingOver, setIsDraggingOver]    = useState(false);
    const replaceInputRef = useRef(null);

    const workingImage = selectedVersion === 'reimaged' && reimagedUrl
        ? { url: reimagedUrl }
        : image;

    const handleResult = (url) => {
        setReimagedUrl(url);
        setSelectedVersion('reimaged');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
        if (file) onReplace(file);
    };
    const handleDragOver  = (e) => { e.preventDefault(); setIsDraggingOver(true); };
    const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDraggingOver(false); };

    const displayName = selectedVersion === 'reimaged' ? 'Re-Image' : image.name;
    const displaySize = selectedVersion === 'reimaged' ? sizeOf(reimagedUrl) : image.size;

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
                        <img className="workspace__image" src={workingImage.url} alt={displayName} />
                        <div className="workspace__image-change-hint">Click to change</div>
                    </div>
                    <div className="workspace__image-meta">
                        <span className="workspace__image-name" title={displayName}>{displayName}</span>
                        {displaySize && <span className="workspace__image-size">{formatSize(displaySize)}</span>}
                        <button
                            className="workspace__image-remove"
                            onClick={onRemove}
                            title="Remove image"
                        >
                            {TRASH_ICON}
                        </button>
                    </div>
                    {reimagedUrl && (
                        <div className="workspace__version-cards">
                            <button
                                className={`workspace__version-card ${selectedVersion === 'original' ? 'workspace__version-card--active' : ''}`}
                                onClick={() => setSelectedVersion('original')}
                            >
                                <img src={image.url} alt="Original" className="workspace__version-card-thumb" />
                                <span className="workspace__version-card-label">Original</span>
                            </button>
                            <button
                                className={`workspace__version-card ${selectedVersion === 'reimaged' ? 'workspace__version-card--active' : ''}`}
                                onClick={() => setSelectedVersion('reimaged')}
                            >
                                <img src={reimagedUrl} alt="Re-Image" className="workspace__version-card-thumb" />
                                <span className="workspace__version-card-label">Re-Image</span>
                            </button>
                        </div>
                    )}
                </div>

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
                        {activeOperation === 'SVG Code'      && <SVGCodeTool          image={workingImage} onResult={handleResult} />}
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
