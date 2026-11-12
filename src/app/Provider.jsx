"use client";

import { Provider } from "react-redux";
import { store } from "@/config/redux/store.js";
import { ThemeProvider } from "@/component/ThemeProvider";

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <ThemeProvider>{children}</ThemeProvider>
    </Provider>
  );
}
