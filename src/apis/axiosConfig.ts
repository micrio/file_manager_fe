import axios from "axios";

import { APP } from "@/constants/app";

const axiosConfig = axios.create({
  baseURL: APP.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: APP.requestTimeout,
});

export default axiosConfig;
