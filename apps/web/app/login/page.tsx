import { signIn, signUp } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="auth-shell">
      <form className="auth-card">
        <p className="eyebrow">Private workspace</p>
        <h1>Continue your investigations</h1>
        <p>Demo records stay disposable. Sign in to import and preserve your own evidence.</p>
        <label>Email<input name="email" required type="email" /></label>
        <label>Password<input minLength={8} name="password" required type="password" /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="auth-actions">
          <button formAction={signIn}>Sign in</button>
          <button className="secondary-button" formAction={signUp}>Create account</button>
        </div>
      </form>
    </main>
  );
}
