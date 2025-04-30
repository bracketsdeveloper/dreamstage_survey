// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { ToastProvider } from "./components/ToastProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ToastProvider>
    <RouterProvider router={router}>
      <App />
    </RouterProvider>
  </ToastProvider>
);
