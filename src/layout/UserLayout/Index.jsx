import React from "react";
import NavBar from "@/component/NavBar";

export default function UserLayOut({ children }) {
  return (
    <div>
      <NavBar />
      {children}
    </div>
  );
}
