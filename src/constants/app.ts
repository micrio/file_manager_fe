export const APP = {
  appName: 'File Manager',
  baseUrl: process.env.REACT_APP_BASE_URL,
  requestTimeout: process.env.REACT_APP_REQUEST_TIMEOUT ? Number(process.env.REACT_APP_REQUEST_TIMEOUT) :  5000,
  // Uploads (esp. videos) need far longer than a normal API call, so they get
  // their own timeout rather than inheriting `requestTimeout`.
  uploadTimeout: process.env.REACT_APP_UPLOAD_TIMEOUT ? Number(process.env.REACT_APP_UPLOAD_TIMEOUT) : 300000,
}
