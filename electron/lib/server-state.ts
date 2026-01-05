// electron/lib/server-state.ts

let serverPort = 0;

export const setServerPort = (port: number) => {
  serverPort = port;
};

export const getServerPort = () => serverPort;