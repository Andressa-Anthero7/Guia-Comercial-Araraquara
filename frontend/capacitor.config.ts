import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.guiacomercialararaquara.app",
  appName: "Guia Comercial Araraquara",
  webDir: "dist",
  server: {
    androidScheme: "https"
  },
  android: {
    backgroundColor: "#1c1917"
  }
};

export default config;
