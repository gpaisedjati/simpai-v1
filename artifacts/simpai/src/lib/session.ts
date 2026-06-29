import { createContext, useContext } from "react";

export interface SessionCtx {
  username: string;
  kuotaSisa: number;
  kuotaMaks: number;
  setKuota: (sisa: number, maks: number) => void;
  refreshQuota: () => Promise<void>;
}

export const SessionContext = createContext<SessionCtx>({
  username: "",
  kuotaSisa: 0,
  kuotaMaks: 0,
  setKuota: () => {},
  refreshQuota: async () => {},
});

export const useSession = () => useContext(SessionContext);
