import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let _app: App | null = null;

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  if (process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    _app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "matrix-logistic-6355c",
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
    });
  } else {
    _app = initializeApp({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "matrix-logistic-6355c",
    });
  }

  return _app;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export const COLLECTIONS = {
  users: "users",
  environments: "environments",
  environmentMembers: "environmentMembers",
  items: "items",
  orders: "orders",
  orderItems: "orderItems",
  sections: "sections",
  // Legacy (kept for migration)
  orderWindow: "orderWindow",
  sessions: "sessions",
  generalOrderDetails: "generalOrderDetails",
} as const;

export type UserDoc = {
  email: string;
  fullName: string;
  phoneNumber: string;
  globalRole: "user" | "super_admin";
  globalStatus: "active" | "blocked";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  // Legacy fields kept for migration
  branch?: string;
  department?: string;
  role?: string;
  status?: string;
};

export type EnvironmentDoc = {
  name: string;
  description: string;
  ownerUserId: string;
  status: "active" | "blocked";
  inviteCode: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

export type EnvironmentMemberDoc = {
  environmentId: string;
  userId: string;
  role: "user" | "environment_admin";
  status: "pending" | "approved" | "blocked";
  joinedAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

export type ItemDoc = {
  environmentId: string;
  name: string;
  unit: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

export type SectionDoc = {
  environmentId: string;
  name: string;
  status: "active" | "closed" | "archived";
  startDateTime: string;
  endDateTime: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

export type OrderDoc = {
  environmentId: string;
  sectionId: string;
  userId: string;
  userFullName: string;
  email: string;
  phoneNumber: string;
  status: "active" | "blocked";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

export type OrderItemDoc = {
  environmentId: string;
  sectionId: string;
  orderId: string;
  itemId: string;
  itemNameSnapshot: string;
  quantity: number;
  note: string;
  status: "active" | "blocked";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};
