export const mediaFileToDataUrl = (file, maxBytes = 6 * 1024 * 1024) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('video/')) {
      reject(new Error('Please select a video file'));
      return;
    }

    if (file.size > maxBytes) {
      reject(new Error('Video must be 6 MB or smaller'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected video'));
    reader.readAsDataURL(file);
  });
