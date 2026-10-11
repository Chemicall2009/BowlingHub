import { Camera } from "../../api/cameras";

export const MOCK_CAMERAS: Camera[] = [
  {
    id: "tvision-1",
    name: "T-Vision 1",
    type: "tvision",
    mode: "dual_lane",
    lane_ids: [5, 6],
    is_active: true,
    ip_address: "192.168.1.50",
  },
  {
    id: "pin-deck-1",
    name: "Pin Deck 1",
    type: "pin_deck",
    mode: "single_lane",
    lane_ids: [8],
    is_active: true,
    ip_address: "192.168.1.51",
  },
];
