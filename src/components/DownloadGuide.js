import React from 'react';
import Button from './Button';
import '../styles/global.css';

const DownloadGuide = () => {
  const handleDownload = () => {
    // Create a link to download the PDF from the public folder
    const link = document.createElement('a');
    link.href = '/Thunder_Dragon_Club_User_Guide.pdf';
    link.download = 'Thunder_Dragon_Club_User_Guide.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="download-guide">
      <p>Download the Thunder Dragon Club user guide to learn about membership benefits, points system, and more.</p>
      <Button
        text="Download User Guide"
        onClick={handleDownload}
        className="download-button"
      />

      <style jsx>{`
        .download-guide {
          padding: 20px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .download-guide p {
          margin-bottom: 20px;
          color: var(--text-color);
        }

        .download-button {
          background-color: var(--accent-color);
          color: black;
          font-weight: bold;
        }

        .download-button:hover {
          background-color: #FFE44D;
        }
      `}</style>
    </div>
  );
};

export default DownloadGuide; 