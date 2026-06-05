export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">You are offline</h1>
        <p className="mt-2 text-stone-600">
          Borrowed books remain available if your 7-day period has not expired.
        </p>
      </div>
    </main>
  );
}
