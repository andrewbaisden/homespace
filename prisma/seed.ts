import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";
import type { FloorPlanGeometryV1 } from "../src/features/floor-plan/domain/geometry";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const email = "demo@homespace.app";
  const password = "demopassword";

  await prisma.inventoryItem.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.room.deleteMany();
  await prisma.floorPlan.deleteMany();
  await prisma.property.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      name: "Demo Homeowner",
      email,
      emailVerified: true,
    },
  });

  const hashed = await hashPassword(password);
  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashed,
    },
  });

  const property = await prisma.property.create({
    data: {
      userId: user.id,
      name: "12 Example Road",
      address: "12 Example Road, London",
      notes: "Demo property with a full floor plan and inventory.",
    },
  });

  const roomDefs = [
    { name: "Living Room", type: "LIVING_ROOM" as const },
    { name: "Kitchen", type: "KITCHEN" as const },
    { name: "Dining Room", type: "DINING_ROOM" as const },
    { name: "Master Bedroom", type: "BEDROOM" as const },
    { name: "Bedroom 2", type: "BEDROOM" as const },
    { name: "Bathroom", type: "BATHROOM" as const },
    { name: "Garage", type: "GARAGE" as const },
  ];

  const rooms = [];
  for (const [index, def] of roomDefs.entries()) {
    rooms.push(
      await prisma.room.create({
        data: {
          propertyId: property.id,
          name: def.name,
          type: def.type,
          sortOrder: index,
        },
      }),
    );
  }

  const [living, kitchen, dining, master, bedroom2, bathroom, garage] = rooms;

  // Orthogonal floor plan in mm (approx 12m x 10m footprint)
  const geometry: FloorPlanGeometryV1 = {
    version: 1,
    walls: [
      { id: "w1", a: { x: 0, y: 0 }, b: { x: 12000, y: 0 }, thickness: 100 },
      {
        id: "w2",
        a: { x: 12000, y: 0 },
        b: { x: 12000, y: 10000 },
        thickness: 100,
      },
      {
        id: "w3",
        a: { x: 12000, y: 10000 },
        b: { x: 0, y: 10000 },
        thickness: 100,
      },
      { id: "w4", a: { x: 0, y: 10000 }, b: { x: 0, y: 0 }, thickness: 100 },
      {
        id: "w5",
        a: { x: 6000, y: 0 },
        b: { x: 6000, y: 6000 },
        thickness: 100,
      },
      {
        id: "w6",
        a: { x: 0, y: 6000 },
        b: { x: 6000, y: 6000 },
        thickness: 100,
      },
      {
        id: "w7",
        a: { x: 6000, y: 4000 },
        b: { x: 12000, y: 4000 },
        thickness: 100,
      },
      {
        id: "w8",
        a: { x: 9000, y: 4000 },
        b: { x: 9000, y: 10000 },
        thickness: 100,
      },
      { id: "w9", a: { x: 0, y: 6000 }, b: { x: 0, y: 10000 }, thickness: 100 },
      {
        id: "w10",
        a: { x: 3000, y: 6000 },
        b: { x: 3000, y: 10000 },
        thickness: 100,
      },
      // Bathroom / dining shared wall (was missing)
      {
        id: "w15",
        a: { x: 6000, y: 6000 },
        b: { x: 6000, y: 10000 },
        thickness: 100,
      },
    ],
    openings: [
      { id: "d1", kind: "door", wallId: "w1", t: 0.2, width: 900 },
      { id: "d2", kind: "door", wallId: "w5", t: 0.45, width: 800 },
      { id: "d3", kind: "door", wallId: "w7", t: 0.35, width: 800 },
      // Bedroom 2 from living
      { id: "d5", kind: "door", wallId: "w6", t: 0.2, width: 800 },
      // Master bedroom from dining
      { id: "d6", kind: "door", wallId: "w8", t: 0.35, width: 800 },
      // Bathroom from dining
      { id: "d7", kind: "door", wallId: "w15", t: 0.45, width: 700 },
      { id: "win1", kind: "window", wallId: "w1", t: 0.7, width: 1200 },
      { id: "win2", kind: "window", wallId: "w2", t: 0.2, width: 1200 },
      { id: "win3", kind: "window", wallId: "w3", t: 0.4, width: 1400 },
    ],
    roomPolygons: [
      {
        roomId: living.id,
        points: [
          { x: 0, y: 0 },
          { x: 6000, y: 0 },
          { x: 6000, y: 6000 },
          { x: 0, y: 6000 },
        ],
      },
      {
        roomId: kitchen.id,
        points: [
          { x: 6000, y: 0 },
          { x: 12000, y: 0 },
          { x: 12000, y: 4000 },
          { x: 6000, y: 4000 },
        ],
      },
      {
        roomId: dining.id,
        points: [
          { x: 6000, y: 4000 },
          { x: 9000, y: 4000 },
          { x: 9000, y: 10000 },
          { x: 6000, y: 10000 },
          { x: 6000, y: 6000 },
        ],
      },
      {
        roomId: master.id,
        points: [
          { x: 9000, y: 4000 },
          { x: 12000, y: 4000 },
          { x: 12000, y: 10000 },
          { x: 9000, y: 10000 },
        ],
      },
      {
        roomId: bedroom2.id,
        points: [
          { x: 0, y: 6000 },
          { x: 3000, y: 6000 },
          { x: 3000, y: 10000 },
          { x: 0, y: 10000 },
        ],
      },
      {
        roomId: bathroom.id,
        points: [
          { x: 3000, y: 6000 },
          { x: 6000, y: 6000 },
          { x: 6000, y: 10000 },
          { x: 3000, y: 10000 },
        ],
      },
      {
        roomId: garage.id,
        points: [
          { x: 0, y: 10000 },
          { x: 4000, y: 10000 },
          { x: 4000, y: 13000 },
          { x: 0, y: 13000 },
        ],
      },
    ],
  };

  // Extend outer walls for garage
  geometry.walls.push(
    {
      id: "w11",
      a: { x: 0, y: 10000 },
      b: { x: 4000, y: 10000 },
      thickness: 100,
    },
    {
      id: "w12",
      a: { x: 4000, y: 10000 },
      b: { x: 4000, y: 13000 },
      thickness: 100,
    },
    {
      id: "w13",
      a: { x: 4000, y: 13000 },
      b: { x: 0, y: 13000 },
      thickness: 100,
    },
    { id: "w14", a: { x: 0, y: 13000 }, b: { x: 0, y: 10000 }, thickness: 100 },
  );
  geometry.openings.push({
    id: "d4",
    kind: "door",
    wallId: "w13",
    t: 0.5,
    width: 2400,
  });

  await prisma.floorPlan.create({
    data: {
      propertyId: property.id,
      geometry,
    },
  });

  const inventory: Array<{
    roomId: string;
    name: string;
    category:
      | "FURNITURE"
      | "ELECTRONICS"
      | "APPLIANCES"
      | "TOOLS"
      | "KITCHENWARE"
      | "OTHER";
    quantity: number;
    replacementValuePence: number;
    purchasePricePence?: number;
    currentValuePence?: number;
  }> = [
    {
      roomId: living.id,
      name: "Sofa",
      category: "FURNITURE",
      quantity: 1,
      replacementValuePence: 120000,
      purchasePricePence: 110000,
      currentValuePence: 70000,
    },
    {
      roomId: living.id,
      name: "Television",
      category: "ELECTRONICS",
      quantity: 1,
      replacementValuePence: 85000,
      purchasePricePence: 90000,
      currentValuePence: 50000,
    },
    {
      roomId: living.id,
      name: "MacBook",
      category: "ELECTRONICS",
      quantity: 1,
      replacementValuePence: 190000,
      purchasePricePence: 180000,
      currentValuePence: 120000,
    },
    {
      roomId: living.id,
      name: "Camera",
      category: "ELECTRONICS",
      quantity: 1,
      replacementValuePence: 70000,
    },
    {
      roomId: living.id,
      name: "Sideboard",
      category: "FURNITURE",
      quantity: 1,
      replacementValuePence: 45000,
    },
    {
      roomId: kitchen.id,
      name: "Fridge freezer",
      category: "APPLIANCES",
      quantity: 1,
      replacementValuePence: 90000,
    },
    {
      roomId: kitchen.id,
      name: "Oven",
      category: "APPLIANCES",
      quantity: 1,
      replacementValuePence: 75000,
    },
    {
      roomId: kitchen.id,
      name: "Cookware set",
      category: "KITCHENWARE",
      quantity: 1,
      replacementValuePence: 25000,
    },
    {
      roomId: kitchen.id,
      name: "Dining stools",
      category: "FURNITURE",
      quantity: 4,
      replacementValuePence: 8000,
    },
    {
      roomId: dining.id,
      name: "Dining table",
      category: "FURNITURE",
      quantity: 1,
      replacementValuePence: 65000,
    },
    {
      roomId: dining.id,
      name: "Dining chairs",
      category: "FURNITURE",
      quantity: 6,
      replacementValuePence: 7500,
    },
    {
      roomId: master.id,
      name: "King bed",
      category: "FURNITURE",
      quantity: 1,
      replacementValuePence: 110000,
    },
    {
      roomId: master.id,
      name: "Wardrobe",
      category: "FURNITURE",
      quantity: 2,
      replacementValuePence: 40000,
    },
    {
      roomId: bedroom2.id,
      name: "Double bed",
      category: "FURNITURE",
      quantity: 1,
      replacementValuePence: 60000,
    },
    {
      roomId: bedroom2.id,
      name: "Desk",
      category: "FURNITURE",
      quantity: 1,
      replacementValuePence: 25000,
    },
    {
      roomId: bathroom.id,
      name: "Towel warmer",
      category: "APPLIANCES",
      quantity: 1,
      replacementValuePence: 18000,
    },
    {
      roomId: bathroom.id,
      name: "Mirror cabinet",
      category: "FURNITURE",
      quantity: 1,
      replacementValuePence: 22000,
    },
    {
      roomId: garage.id,
      name: "Tool chest",
      category: "TOOLS",
      quantity: 1,
      replacementValuePence: 85000,
    },
    {
      roomId: garage.id,
      name: "Lawn mower",
      category: "TOOLS",
      quantity: 1,
      replacementValuePence: 45000,
    },
    {
      roomId: garage.id,
      name: "Bike",
      category: "OTHER",
      quantity: 2,
      replacementValuePence: 55000,
    },
  ];

  for (const item of inventory) {
    await prisma.inventoryItem.create({
      data: {
        roomId: item.roomId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        replacementValuePence: item.replacementValuePence,
        purchasePricePence: item.purchasePricePence ?? null,
        currentValuePence: item.currentValuePence ?? null,
        condition: "GOOD",
      },
    });
  }

  console.log("Seeded demo user:");
  console.log(`  email: ${email}`);
  console.log(`  password: ${password}`);
  console.log(`  property: ${property.name} (${property.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
