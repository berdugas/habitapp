jest.mock(
  "@react-native-async-storage/async-storage",
  () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import {
  getStoredJson,
  removeStoredItem,
  setStoredJson,
} from "@/lib/storage";

describe("storage adapter", () => {
  it("round-trips JSON values", async () => {
    await setStoredJson("habits.test", { count: 2 });

    await expect(getStoredJson("habits.test", { count: 0 })).resolves.toEqual({
      count: 2,
    });

    await removeStoredItem("habits.test");

    await expect(getStoredJson("habits.test", { count: 0 })).resolves.toEqual({
      count: 0,
    });
  });
});
