import type { z } from "zod";
import {
  emptyGeometry,
  type FloorPlanGeometryV1,
  floorPlanGeometryV1Schema,
  polygonAreaSqM,
} from "@/features/floor-plan/domain/geometry";
import {
  propertyTotalPence,
  roomTotals,
  sumReplacementPence,
} from "@/features/inventory/domain/valuation";
import { prisma } from "@/server/db";
import { AppError } from "@/server/session";
import {
  inventoryFilterSchema,
  inventoryItemSchema,
  inventoryItemUpdateSchema,
  propertyCreateSchema,
  propertyUpdateSchema,
  roomCreateSchema,
  roomUpdateSchema,
} from "@/server/validators/schemas";

async function getOwnedProperty(propertyId: string, userId: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId },
  });
  if (!property) throw new AppError("Property not found", 404, "NOT_FOUND");
  return property;
}

export async function listProperties(userId: string) {
  const properties = await prisma.property.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      rooms: {
        include: {
          items: {
            select: {
              quantity: true,
              replacementValuePence: true,
            },
          },
        },
      },
    },
  });

  return properties.map((p) => {
    const totals = roomTotals(
      p.rooms.map((r) => ({ id: r.id, name: r.name, items: r.items })),
    );
    return {
      id: p.id,
      name: p.name,
      address: p.address,
      notes: p.notes,
      currency: p.currency,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      roomCount: p.rooms.length,
      itemCount: totals.reduce((n, r) => n + r.itemCount, 0),
      inventoryValuePence: propertyTotalPence(totals),
    };
  });
}

export async function createProperty(
  userId: string,
  input: z.infer<typeof propertyCreateSchema>,
) {
  const data = propertyCreateSchema.parse(input);
  const property = await prisma.property.create({
    data: {
      userId,
      name: data.name,
      address: data.address ?? null,
      notes: data.notes ?? null,
      floorPlan: {
        create: {
          geometry: emptyGeometry(),
        },
      },
    },
  });
  return property;
}

export async function getProperty(userId: string, propertyId: string) {
  await getOwnedProperty(propertyId, userId);
  const property = await prisma.property.findUniqueOrThrow({
    where: { id: propertyId },
    include: {
      floorPlan: true,
      rooms: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: { updatedAt: "desc" },
            include: { attachments: true },
          },
        },
      },
    },
  });
  const totals = roomTotals(
    property.rooms.map((r) => ({
      id: r.id,
      name: r.name,
      items: r.items,
    })),
  );
  return {
    ...property,
    roomTotals: totals,
    inventoryValuePence: propertyTotalPence(totals),
  };
}

export async function updateProperty(
  userId: string,
  propertyId: string,
  input: z.infer<typeof propertyUpdateSchema>,
) {
  await getOwnedProperty(propertyId, userId);
  const data = propertyUpdateSchema.parse(input);
  return prisma.property.update({
    where: { id: propertyId },
    data,
  });
}

export async function deleteProperty(userId: string, propertyId: string) {
  await getOwnedProperty(propertyId, userId);
  await prisma.property.delete({ where: { id: propertyId } });
}

export async function getPropertySummary(userId: string, propertyId: string) {
  const property = await getProperty(userId, propertyId);
  return {
    id: property.id,
    name: property.name,
    address: property.address,
    roomCount: property.rooms.length,
    itemCount: property.roomTotals.reduce((n, r) => n + r.itemCount, 0),
    inventoryValuePence: property.inventoryValuePence,
    roomTotals: property.roomTotals,
  };
}

export async function getDashboard(userId: string) {
  const properties = await listProperties(userId);
  const recentItems = await prisma.inventoryItem.findMany({
    where: { room: { property: { userId } } },
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      room: {
        select: {
          id: true,
          name: true,
          property: { select: { id: true, name: true } },
        },
      },
    },
  });

  return {
    propertyCount: properties.length,
    roomCount: properties.reduce((n, p) => n + p.roomCount, 0),
    itemCount: properties.reduce((n, p) => n + p.itemCount, 0),
    inventoryValuePence: properties.reduce(
      (n, p) => n + p.inventoryValuePence,
      0,
    ),
    properties,
    recentItems,
    recentProperties: properties.slice(0, 5),
  };
}

export async function createRoom(
  userId: string,
  propertyId: string,
  input: z.infer<typeof roomCreateSchema>,
) {
  await getOwnedProperty(propertyId, userId);
  const data = roomCreateSchema.parse(input);
  const count = await prisma.room.count({ where: { propertyId } });
  return prisma.room.create({
    data: {
      propertyId,
      name: data.name,
      type: data.type,
      sortOrder: data.sortOrder ?? count,
    },
  });
}

export async function updateRoom(
  userId: string,
  roomId: string,
  input: z.infer<typeof roomUpdateSchema>,
) {
  const room = await prisma.room.findFirst({
    where: { id: roomId, property: { userId } },
  });
  if (!room) throw new AppError("Room not found", 404, "NOT_FOUND");
  const data = roomUpdateSchema.parse(input);
  return prisma.room.update({ where: { id: roomId }, data });
}

export async function deleteRoom(userId: string, roomId: string) {
  const room = await prisma.room.findFirst({
    where: { id: roomId, property: { userId } },
  });
  if (!room) throw new AppError("Room not found", 404, "NOT_FOUND");

  const floorPlan = await prisma.floorPlan.findUnique({
    where: { propertyId: room.propertyId },
  });
  if (floorPlan) {
    const geometry = floorPlanGeometryV1Schema.parse(floorPlan.geometry);
    const next: FloorPlanGeometryV1 = {
      ...geometry,
      roomPolygons: geometry.roomPolygons.filter((p) => p.roomId !== roomId),
    };
    await prisma.floorPlan.update({
      where: { id: floorPlan.id },
      data: { geometry: next },
    });
  }

  await prisma.room.delete({ where: { id: roomId } });
}

export async function getFloorPlan(userId: string, propertyId: string) {
  await getOwnedProperty(propertyId, userId);
  const floorPlan = await prisma.floorPlan.findUnique({
    where: { propertyId },
  });
  if (!floorPlan) throw new AppError("Floor plan not found", 404, "NOT_FOUND");
  return {
    ...floorPlan,
    geometry: floorPlanGeometryV1Schema.parse(floorPlan.geometry),
  };
}

export async function putFloorPlan(
  userId: string,
  propertyId: string,
  geometryInput: unknown,
) {
  await getOwnedProperty(propertyId, userId);
  const geometry = floorPlanGeometryV1Schema.parse(geometryInput);

  const rooms = await prisma.room.findMany({ where: { propertyId } });
  const roomIds = new Set(rooms.map((r) => r.id));
  for (const poly of geometry.roomPolygons) {
    if (!roomIds.has(poly.roomId)) {
      throw new AppError(
        `Room polygon references unknown room ${poly.roomId}`,
        400,
        "INVALID_GEOMETRY",
      );
    }
  }

  for (const poly of geometry.roomPolygons) {
    await prisma.room.update({
      where: { id: poly.roomId },
      data: { areaSqM: polygonAreaSqM(poly.points) },
    });
  }

  return prisma.floorPlan.upsert({
    where: { propertyId },
    create: {
      propertyId,
      geometry,
    },
    update: {
      geometry,
      version: { increment: 1 },
    },
  });
}

export async function createItem(
  userId: string,
  roomId: string,
  input: z.infer<typeof inventoryItemSchema>,
) {
  const room = await prisma.room.findFirst({
    where: { id: roomId, property: { userId } },
  });
  if (!room) throw new AppError("Room not found", 404, "NOT_FOUND");
  const data = inventoryItemSchema.parse(input);
  return prisma.inventoryItem.create({
    data: {
      roomId,
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      purchasePricePence: data.purchasePricePence ?? null,
      currentValuePence: data.currentValuePence ?? null,
      replacementValuePence: data.replacementValuePence,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      condition: data.condition,
      notes: data.notes ?? null,
      serialNumber: data.serialNumber ?? null,
    },
  });
}

export async function updateItem(
  userId: string,
  itemId: string,
  input: z.infer<typeof inventoryItemUpdateSchema>,
) {
  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, room: { property: { userId } } },
  });
  if (!item) throw new AppError("Item not found", 404, "NOT_FOUND");
  const data = inventoryItemUpdateSchema.parse(input);
  return prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      ...data,
      purchaseDate:
        data.purchaseDate === undefined
          ? undefined
          : data.purchaseDate
            ? new Date(data.purchaseDate)
            : null,
    },
  });
}

export async function deleteItem(userId: string, itemId: string) {
  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, room: { property: { userId } } },
  });
  if (!item) throw new AppError("Item not found", 404, "NOT_FOUND");
  await prisma.inventoryItem.delete({ where: { id: itemId } });
}

export async function listInventory(
  userId: string,
  propertyId: string,
  filters: z.infer<typeof inventoryFilterSchema>,
) {
  await getOwnedProperty(propertyId, userId);
  const f = inventoryFilterSchema.parse(filters);

  const items = await prisma.inventoryItem.findMany({
    where: {
      room: {
        propertyId,
        ...(f.roomId ? { id: f.roomId } : {}),
      },
      ...(f.category ? { category: f.category as never } : {}),
      ...(f.condition ? { condition: f.condition as never } : {}),
      ...(f.q
        ? {
            OR: [
              { name: { contains: f.q, mode: "insensitive" } },
              { notes: { contains: f.q, mode: "insensitive" } },
              { serialNumber: { contains: f.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(f.minValuePence !== undefined || f.maxValuePence !== undefined
        ? {
            replacementValuePence: {
              ...(f.minValuePence !== undefined
                ? { gte: f.minValuePence }
                : {}),
              ...(f.maxValuePence !== undefined
                ? { lte: f.maxValuePence }
                : {}),
            },
          }
        : {}),
      ...(f.recent
        ? {
            createdAt: {
              gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
            },
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      room: { select: { id: true, name: true } },
      attachments: true,
    },
  });

  return {
    items,
    totalReplacementPence: sumReplacementPence(items),
  };
}

export async function exportInventoryCsv(userId: string, propertyId: string) {
  const property = await getProperty(userId, propertyId);
  const lines = [
    [
      "Room",
      "Item",
      "Category",
      "Quantity",
      "Condition",
      "Purchase Price (GBP)",
      "Current Value (GBP)",
      "Replacement Value (GBP)",
      "Line Replacement Total (GBP)",
      "Serial Number",
      "Notes",
    ].join(","),
  ];

  for (const room of property.rooms) {
    for (const item of room.items) {
      const lineTotal = (item.replacementValuePence * item.quantity) / 100;
      lines.push(
        [
          csv(room.name),
          csv(item.name),
          csv(item.category),
          String(item.quantity),
          csv(item.condition),
          item.purchasePricePence != null
            ? (item.purchasePricePence / 100).toFixed(2)
            : "",
          item.currentValuePence != null
            ? (item.currentValuePence / 100).toFixed(2)
            : "",
          (item.replacementValuePence / 100).toFixed(2),
          lineTotal.toFixed(2),
          csv(item.serialNumber ?? ""),
          csv(item.notes ?? ""),
        ].join(","),
      );
    }
  }

  return lines.join("\n");
}

function csv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
