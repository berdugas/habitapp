import * as Network from "expo-network";

export async function isNetworkAvailable() {
  const state = await Network.getNetworkStateAsync();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}
