import axios from "axios";

export const BASE_URl =
  import.meta.env.MODE === "development"
    ? "http://localhost:9090"
    : "https://connect-pros-backend.onrender.com";

const clientServer = axios.create({
  baseURL: BASE_URl,
  withCredentials: true,
});

export default clientServer;
