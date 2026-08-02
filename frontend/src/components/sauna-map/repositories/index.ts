import { ApiVisitRepository } from "./apiVisitRepository";
import { LocalVisitRepository } from "./localVisitRepository";
import { DATA_SOURCE } from "../../../../dataSource";

export * from "./types";
export { DATA_SOURCE };

let repository: ApiVisitRepository | LocalVisitRepository | undefined;

export function getVisitRepository() {
  repository ??= DATA_SOURCE === "api" ? new ApiVisitRepository() : new LocalVisitRepository();
  return repository;
}
