import * as userLocationService from "../services/userLocation.service";

type LocationInput = Parameters<typeof userLocationService.createMyLocation>[1];

export async function list(userId: number) {
  const result = await userLocationService.listMyLocations(userId);
  return { data: result, message: "ok" };
}

export async function create(userId: number, body: unknown) {
  const result = await userLocationService.createMyLocation(userId, body as LocationInput);
  return { data: result, message: "ok" };
}

export async function remove(userId: number, id: number) {
  await userLocationService.deleteMyLocation(userId, id);
  return { data: null, message: "ok" };
}
