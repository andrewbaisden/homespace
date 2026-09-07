export type ValuableItem = {
  quantity: number;
  replacementValuePence: number;
  currentValuePence?: number | null;
  purchasePricePence?: number | null;
};

/** Primary rollup field: replacement value × quantity (insurance-oriented). */
export function itemReplacementTotalPence(item: ValuableItem): number {
  return item.replacementValuePence * item.quantity;
}

export function sumReplacementPence(items: ValuableItem[]): number {
  return items.reduce((sum, item) => sum + itemReplacementTotalPence(item), 0);
}

export type RoomValueRow = {
  roomId: string;
  roomName: string;
  totalPence: number;
  itemCount: number;
};

export function roomTotals(
  rooms: { id: string; name: string; items: ValuableItem[] }[],
): RoomValueRow[] {
  return rooms.map((room) => ({
    roomId: room.id,
    roomName: room.name,
    totalPence: sumReplacementPence(room.items),
    itemCount: room.items.reduce((n, i) => n + i.quantity, 0),
  }));
}

export function propertyTotalPence(rooms: RoomValueRow[]): number {
  return rooms.reduce((sum, r) => sum + r.totalPence, 0);
}
