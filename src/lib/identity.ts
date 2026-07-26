import AsyncStorage from "@react-native-async-storage/async-storage";

const CLIENT_ID_KEY = "carte.clientId";

export async function getClientId(): Promise<string> {
  const saved = await AsyncStorage.getItem(CLIENT_ID_KEY);
  if (saved) return saved;

  const id = `carte-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
  await AsyncStorage.setItem(CLIENT_ID_KEY, id);
  return id;
}
