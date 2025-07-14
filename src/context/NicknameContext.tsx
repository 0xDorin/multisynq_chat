"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface NicknameContextType {
  nickname: string;
  setNickname: (name: string) => void;
}

const NicknameContext = createContext<NicknameContextType | undefined>(
  undefined
);

export function NicknameProvider({ children }: { children: ReactNode }) {
  const [nickname, setNickname] = useState("");

  return (
    <NicknameContext.Provider value={{ nickname, setNickname }}>
      {children}
    </NicknameContext.Provider>
  );
}

export function useNickname() {
  const context = useContext(NicknameContext);
  if (context === undefined) {
    throw new Error("useNickname must be used within a NicknameProvider");
  }
  return context;
}
