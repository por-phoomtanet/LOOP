import { userLocationRepository } from "../repositories/userLocation.repository";
import { ForbiddenError, NotFoundError } from "../utils/errors";

type LocationInput = {
  label: string;
  address: string;
  lat: number;
  lng: number;
};

export async function listMyLocations(userId: number) {
  return userLocationRepository.findByUser(userId);
}

export async function createMyLocation(userId: number, input: LocationInput) {
  return userLocationRepository.create({ userId, ...input });
}

export async function deleteMyLocation(userId: number, id: number) {
  const location = await userLocationRepository.findById(id);
  if (!location) throw new NotFoundError("ไม่พบสถานที่นี้");
  if (location.userId !== userId) throw new ForbiddenError("ไม่มีสิทธิ์ลบสถานที่นี้");
  await userLocationRepository.remove(id);
}
