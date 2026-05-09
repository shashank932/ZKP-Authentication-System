import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { ClaimProvider } from "./context/ClaimContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ClaimProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ClaimProvider>
);
