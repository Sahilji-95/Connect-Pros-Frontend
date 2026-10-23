import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducer/authReducer/index.js";
import postReducer from "./reducer/postReducer/index.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    post: postReducer,
  },
});
