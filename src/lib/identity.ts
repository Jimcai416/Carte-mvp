import AsyncStorage from "@react-native-async-storage/async-storage";
import { readMigratedValue } from "./storage";

const CLIENT_ID_KEY = "tavue.clientId";
const LEGACY_CLIENT_ID_KEYS = ["carte.clientId"];

export async function getClientId(): Promise<string> {
  const saved = await readMigratedValue(CLIENT_ID_KEY, LEGACY_CLIENT_ID_KEYS);
  if (saved) return saved;

  const id = `tavue-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
  await AsyncStorage.setItem(CLIENT_ID_KEY, id);
  return id;
}
