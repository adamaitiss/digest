import { appConfig } from "../config";
import type { AppRepository } from "../types";
import { createDemoRepository } from "./demoRepository";
import { createSupabaseRepository } from "./supabaseRepository";

let repository: AppRepository | null = null;

export function getRepository(): AppRepository {
  if (!repository) {
    repository = appConfig.useDemoData ? createDemoRepository() : createSupabaseRepository();
  }
  return repository;
}

