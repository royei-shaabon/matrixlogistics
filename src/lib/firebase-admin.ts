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
    // Application Default Credentials — used in Cloud Run
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

// Firestore collection names
export const COLLECTIONS = {
  users: "users",
  orderWindow: "orderWindow",
  generalOrderDetails: "generalOrderDetails",
  orders: "orders",
  orderItems: "orderItems",
  sessions: "sessions",
} as const;

export type UserDoc = {
  email: string;
  fullName: string;
  branch: string;
  department: string;
  role: "admin" | "user";
  status: "pending" | "approved";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

export type OrderWindowDoc = {
  windowId: string;
  startDateTime: string; // ISO string
  endDateTime: string;   // ISO string
  updatedAt: FirebaseFirestore.Timestamp;
  updatedBy: string;
};

export type GeneralOrderDetailsDoc = {
  orderDate: string;
  requesterName: string;
  phoneNumber: string;
  customerSite: string;
  deliveryAddress: string;
  matrixEmployeesCount: string;
  courierNotes: string;
  updatedAt: FirebaseFirestore.Timestamp;
  updatedBy: string;
};

export type OrderDoc = {
  userId: string;
  userFullName: string;
  email: string;
  branch: string;
  department: string;
  windowId: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

export type OrderItemDoc = {
  orderId: string;
  itemId: number;
  itemName: string;
  quantity: number;
  orderNote: string;
};
