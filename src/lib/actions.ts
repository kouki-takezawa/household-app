"use server";

import { revalidatePath } from "next/cache";
import * as gas from "./gas";
import type { AssetSnapshot, Category, Member, ScheduleEvent, Transaction } from "./types";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/budget");
  revalidatePath("/schedule");
  revalidatePath("/assets");
  revalidatePath("/settings");
}

// ---- Transactions ----------------------------------------------------

export async function addTransaction(data: Transaction) {
  await gas.createRow("Transactions", data);
  revalidateAll();
}

export async function editTransaction(id: string, data: Partial<Transaction>) {
  await gas.updateRow("Transactions", id, data);
  revalidateAll();
}

export async function removeTransaction(id: string) {
  await gas.deleteRow("Transactions", id);
  revalidateAll();
}

// ---- Schedule events ---------------------------------------------------

export async function addEvent(data: ScheduleEvent) {
  await gas.createRow("Events", data);
  revalidateAll();
}

export async function editEvent(id: string, data: Partial<ScheduleEvent>) {
  await gas.updateRow("Events", id, data);
  revalidateAll();
}

export async function removeEvent(id: string) {
  await gas.deleteRow("Events", id);
  revalidateAll();
}

// ---- Asset snapshots -----------------------------------------------------

export async function addAssetSnapshot(data: AssetSnapshot) {
  await gas.createRow("AssetSnapshots", data);
  revalidateAll();
}

export async function editAssetSnapshot(id: string, data: Partial<AssetSnapshot>) {
  await gas.updateRow("AssetSnapshots", id, data);
  revalidateAll();
}

export async function removeAssetSnapshot(id: string) {
  await gas.deleteRow("AssetSnapshots", id);
  revalidateAll();
}

// ---- Members ------------------------------------------------------------

export async function addMember(data: Member) {
  await gas.createRow("Members", data);
  revalidateAll();
}

export async function removeMember(id: string) {
  await gas.deleteRow("Members", id);
  revalidateAll();
}

// ---- Categories -----------------------------------------------------------

export async function addCategory(data: Category) {
  await gas.createRow("Categories", data);
  revalidateAll();
}

export async function removeCategory(id: string) {
  await gas.deleteRow("Categories", id);
  revalidateAll();
}
