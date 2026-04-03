import { useState, useEffect } from 'react';
import exifr from 'exifr';
import './MetadataTool.css';

const fmt = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtExposure = (t) => t < 1 ? `1/${Math.round(1 / t)}s` : `${t}s`;

const MetadataTool = ({ image }) => {
    const [rows, setRows] = useState(null);

    useEffect(() => {
        const collected = [];

        if (image.name) collected.push(['Filename', image.name]);
        if (image.size) collected.push(['File size', fmt(image.size)]);

        const imgEl = new Image();
        imgEl.onload = async () => {
            const w = imgEl.naturalWidth;
            const h = imgEl.naturalHeight;
            collected.push(['Dimensions', `${w} × ${h}px`]);
            collected.push(['Megapixels', `${((w * h) / 1_000_000).toFixed(2)} MP`]);
            collected.push(['Aspect ratio', (() => {
                const gcd = (a, b) => b ? gcd(b, a % b) : a;
                const d = gcd(w, h);
                return `${w / d}:${h / d}`;
            })()]);

            if (image.file) {
                try {
                    const exif = await exifr.parse(image.file, {
                        pick: [
                            'Make', 'Model', 'Software',
                            'DateTimeOriginal', 'CreateDate',
                            'ExposureTime', 'FNumber', 'ISOSpeedRatings',
                            'FocalLength', 'Flash', 'WhiteBalance',
                            'GPSLatitude', 'GPSLongitude', 'GPSAltitude',
                            'ColorSpace', 'Orientation',
                        ],
                    });

                    if (exif) {
                        if (exif.Make)             collected.push(['Camera make',   exif.Make]);
                        if (exif.Model)            collected.push(['Camera model',  exif.Model]);
                        if (exif.Software)         collected.push(['Software',      exif.Software.trim()]);
                        const date = exif.DateTimeOriginal || exif.CreateDate;
                        if (date)                  collected.push(['Date taken',    new Date(date).toLocaleString()]);
                        if (exif.ExposureTime)     collected.push(['Shutter speed', fmtExposure(exif.ExposureTime)]);
                        if (exif.FNumber)          collected.push(['Aperture',      `f/${exif.FNumber}`]);
                        if (exif.ISOSpeedRatings)  collected.push(['ISO',           String(exif.ISOSpeedRatings)]);
                        if (exif.FocalLength)      collected.push(['Focal length',  `${exif.FocalLength} mm`]);
                        if (exif.GPSLatitude != null && exif.GPSLongitude != null)
                            collected.push(['GPS', `${exif.GPSLatitude.toFixed(6)}, ${exif.GPSLongitude.toFixed(6)}`]);
                        if (exif.GPSAltitude != null)
                            collected.push(['Altitude', `${Math.round(exif.GPSAltitude)} m`]);
                    }
                } catch {
                    // No EXIF data — basic info is still shown
                }
            }

            setRows([...collected]);
        };
        imgEl.src = image.url;
    }, [image.url]);

    if (!rows) {
        return <p className="metadata-tool__loading">Reading metadata…</p>;
    }

    return (
        <div className="metadata-tool">
            <table className="metadata-tool__table">
                <tbody>
                    {rows.map(([label, value]) => (
                        <tr key={label} className="metadata-tool__row">
                            <td className="metadata-tool__label">{label}</td>
                            <td className="metadata-tool__value">{value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MetadataTool;
