import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Force dark mode permanently
document.documentElement.classList.add("dark");

// Restore language direction
const savedLang = localStorage.getItem("sarad_lang");
if (savedLang === "ar") {
  document.documentElement.setAttribute("dir", "rtl");
  document.documentElement.setAttribute("lang", "ar");
} else {
  document.documentElement.setAttribute("dir", "ltr");
  document.documentElement.setAttribute("lang", "en");
}

// Restore RTL mode (legacy key compat)
if (localStorage.getItem("rtl_mode") === "1") {
  document.documentElement.setAttribute("dir", "rtl");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
