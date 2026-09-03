export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <main className="auth-shell">
      <form action="/auth" className="auth-card" method="post">
        <p className="eyebrow">Private workspace</p>
        <h1>Continue your investigations</h1>
        <p>Demo records stay disposable. Sign in to import and preserve your own evidence.</p>
        <label>Email<input name="email" required type="email" /></label>
        <label>Password<input minLength={8} name="password" required type="password" /></label>
        <input name="next" type="hidden" value={next ?? "/workspace"} />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="auth-actions">
          <button name="intent" value="sign-in">Sign in</button>
          <button className="secondary-button" name="intent" value="sign-up">Create account</button>
        </div>
      </form>
    </main>
  );
}
