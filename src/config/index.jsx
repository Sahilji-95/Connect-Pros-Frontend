import axios from "axios";

export const BASE_URl = "http://localhost:9090";
const clientServer = axios.create({
  baseURL: BASE_URl,
  withCredentials: true,
});

export default clientServer;
