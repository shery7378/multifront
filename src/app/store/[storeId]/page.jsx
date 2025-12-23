// src/app/store/[storeId]/page.jsx
import StorePage from "./store";

// 🔹 Shared fetch function
async function getStoreData(storeId) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/stores/${storeId}/products`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    console.error("Failed to fetch store data");
    return null;
  }else{
    console.log('Store data fetched successfully');
  }

  return res.json(); // ✅ returns { data: { ... } }
}

// 🔹 Generate metadata (no duplicate fetch)
export async function generateMetadata({ params }) {
  const { storeId } = await params;
  const data = await getStoreData(storeId);
  const store = data?.data || {};

  return {
    title: store?.meta_title || store?.name
      ? `${store?.meta_title || store.name} | My Site`
      : "Store | My Site",
    description:
      store?.meta_description ||
      store?.description ||
      "Browse the latest items in our store.",
  };
}

// 🔹 Page Component (reuses same fetch)
export default async function Page({ params }) {
  const { storeId } = await params;
  const data = await getStoreData(storeId); // ✅ same function
  const store = data?.data || {};
  const others = Array.isArray(data?.others) ? data.others : [];

  return <StorePage store={store} others={others} />; // ✅ pass full store, not just id
}
