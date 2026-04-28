// utils/downloadFile.js
// Triggers a browser "Save As" download from a Blob or ArrayBuffer.

/**
 * @param {Blob|ArrayBuffer} data
 * @param {string} filename
 * @param {string} [mimeType]
 */
// utils/downloadFile.js
export function downloadFile(data, filename, mimeType = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);

  // Open in new tab instead of forcing download
  const tab = window.open(url, '_blank');

  // Fallback to download if popup was blocked
  if (!tab) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
