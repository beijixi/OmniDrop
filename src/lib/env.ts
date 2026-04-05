export const env = {
  appName: process.env.APP_NAME?.trim() || "OmniDrop",
  storageDir: process.env.STORAGE_DIR?.trim() || "./storage/uploads",
  publicAppUrl:
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000"
};
