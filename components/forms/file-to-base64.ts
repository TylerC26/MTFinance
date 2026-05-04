export type FileBase64 = { base64: string; mediaType: string };

export function fileToBase64(file: File): Promise<FileBase64> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }
      const comma = result.indexOf(",");
      if (comma < 0) {
        reject(new Error("Unexpected file data"));
        return;
      }
      resolve({ base64: result.slice(comma + 1), mediaType: file.type });
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
