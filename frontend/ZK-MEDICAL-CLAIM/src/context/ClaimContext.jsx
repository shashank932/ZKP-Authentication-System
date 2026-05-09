import { createContext, useState } from "react";

export const ClaimContext = createContext();

export const ClaimProvider = ({ children }) => {
  const [claims, setClaims] = useState([]);

  const addClaim = (claim) => {
    setClaims([...claims, claim]);
  };

  return (
    <ClaimContext.Provider value={{ claims, addClaim }}>
      {children}
    </ClaimContext.Provider>
  );
};
