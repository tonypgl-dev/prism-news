import { AdminPostsClient } from "./AdminPostsClient";

export const metadata = {
  title: "Admin · Postări sociale · Prisma News",
  robots: { index: false, follow: false },
};

export default function AdminPostsPage() {
  return <AdminPostsClient />;
}
