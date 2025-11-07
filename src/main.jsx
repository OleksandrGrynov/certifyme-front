import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./i18n/i18n";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

const clientId =
  "382994921409-a7plkvr0d3pns8e6uac4fn7go39lielq.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
