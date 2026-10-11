import { apiClient } from "./client";

export interface EmulatorStatus {
  running: boolean;
  activeLanes: number;
  emulatedModel: string;
  baudRate: number;
  cyclesCompleted: number;
}

export async function getEmulatorStatus(): Promise<EmulatorStatus> {
  return apiClient<EmulatorStatus>("/emulator/status");
}

export async function sendEmulatorCommand(cmd: string, args: Record<string, unknown> = {}): Promise<{ ok: boolean }> {
  return apiClient<{ ok: boolean }>("/emulator/command", {
    method: "POST",
    body: JSON.stringify({ cmd, args }),
  });
}
