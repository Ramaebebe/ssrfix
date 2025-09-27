export default function NotFound(){
  return (
    <main className="container-tight py-24">
      <div className="card p-10 text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-white/70 mb-6">Sorry, the page you’re looking for was not found.</p>
        <a className="btn inline-block" href="/">Go back home</a>
      </div>
    </main>
  );
}

