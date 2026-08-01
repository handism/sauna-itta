import { ApiVisitRepository } from "./apiVisitRepository";
import { LocalVisitRepository } from "./localVisitRepository";

export * from "./types";

export const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "api" : "local";

let repository: ApiVisitRepository | LocalVisitRepository | undefined;

export function getVisitRepository() {
  repository ??= DATA_SOURCE === "api" ? new ApiVisitRepository() : new LocalVisitRepository();
  return repository;
}
