import { categoryRepository } from "../repositories/category.repository";

export async function listActiveCategories() {
  return categoryRepository.findActive();
}
